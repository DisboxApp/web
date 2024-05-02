/*global chrome*/
import React, { useEffect, useState } from "react";

import {
  CssBaseline,
  IconButton,
  LinearProgress,
  linearProgressClasses,
  Snackbar,
  Typography,
} from "@mui/material";
import { createTheme, styled, ThemeProvider } from "@mui/material/styles";
import { Box } from "@mui/system";
import { DataGrid, GridCloseIcon } from "@mui/x-data-grid";
import { Button as BsButton } from "react-bootstrap";
import urlJoin from "url-join";
import styles from "./css/app.module.css";
import buildColumns from "./func/columns/columns.js";
import DisboxFileManager, {
  FILE_DELIMITER,
} from "./func/file/disbox-file-manager.js";
import {
  getAvailableFileName,
  pickLocationAsWritable,
} from "./func/file/file-utils.js";
import NavigationBar from "./func/search/NavigationBar.js";
import PathParts from "./func/file/PathParts.js";
import SearchBar from "./func/search/SearchBar.js";
import pako from "pako";
import ExtensionDialog from "./func/extention/ExtensionDialog.js";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileCirclePlus,
  faFolderPlus,
} from "@fortawesome/free-solid-svg-icons";

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});
const lightTheme = createTheme({
  palette: {
    mode: "light",
  },
  root: {
    padding: "6px 16px",
  },
});

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 5,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor:
      theme.palette.grey[theme.palette.mode === "light" ? 200 : 800],
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 5,
    backgroundColor: theme.palette.mode === "light" ? "#1a90ff" : "#308fe8",
  },
}));

function App() {
  const [fileManager, setFileManager] = useState(null);
  const [rows, setRows] = useState([]);
  const [theme, setTheme] = useState(true);

  const [path, setPath] = useState(null);

  const [searchOptions, setSearchOptions] = useState([]);
  const [searchValue, setSearchValue] = useState("");

  const [currentAction, setCurrentAction] = useState("");
  const [showProgress, setShowProgress] = useState(false);
  const [progressValue, setProgressValue] = useState(-1);

  const [totalStorageSize, setTotalStorageSize] = useState(0);

  useEffect(() => {
    const webhookUrl = localStorage.getItem("webhookUrl");
    async function init() {
      if (webhookUrl) {
        const manager = await DisboxFileManager.create(webhookUrl);
        setFileManager(manager);
        console.log(manager);
        updateRowsWithFolderSizes(manager);
        updateTotalStorageSize(manager);
        setPath("");
        // setParent(null);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (progressValue === 100 || progressValue === -1) {
      setTimeout(() => {
        setShowProgress(false);
      }, 1500);
      setTimeout(() => {
        setProgressValue(-1);
        setCurrentAction("");
      }, 1600);
    } else {
      setShowProgress(true);
    }
  }, [progressValue]);

  const getRowById = (id) => {
    return rows.find((row) => row.id === id);
  };

  // Needed because we don't have the pro version of the data grid
  const updateRowById = (id, row) => {
    const newRows = [];
    rows.forEach((r) => {
      if (r.id === id) {
        newRows.push(row);
      } else {
        newRows.push(r);
      }
    });
    setRows(newRows);
  };

  const deleteRowById = (id) => {
    const newRows = [];
    rows.forEach((r) => {
      if (r.id !== id) {
        newRows.push(r);
      }
    });
    setRows(newRows);
  };

  const addRow = (row) => {
    setRows([...rows, row]);
  };

  const showDirectory = async (path) => {
    setPath(path);
    const parent = await fileManager.getParent(path);
    // setParent(parent ? parent.path : null);
    setRows(Object.values(fileManager.getChildren(path)));
  };

  const onProgress = (value, total) => {
    const percentage = Math.round((value / total) * 100).toFixed(0);
    setProgressValue(Number(percentage));
  };

  // Fonction pour mettre à jour les lignes avec les tailles de dossiers calculées
  function updateRowsWithFolderSizes(fileManager) {
    const newRows = Object.values(fileManager.getChildren("")).map((file) => {
      if (file.type === "directory") {
        // Calculer la taille du dossier
        const size = calculateFolderSize(
          fileManager.fileTree.children[file.name].children
        );
        // Retourner une nouvelle ligne avec la taille mise à jour
        return { ...file, size: size };
      } else {
        // Retourner la ligne sans changements pour les fichiers
        return file;
      }
    });

    setRows([...newRows]);
  }

  function updateTotalStorageSize(manager) {
    let totalSize = 0;

    Object.values(manager.fileTree.children).forEach((child) => {
      if (child.type === "directory") {
        totalSize += calculateFolderSize(child.children);
      } else if (child.type === "file") {
        totalSize += child.size;
      }
    });

    setTotalStorageSize(totalSize);
  }

  function calculateFolderSize(children) {
    let size = 0;

    function accumulateSize(child) {
      if (child.type === "file") {
        size += child.size;
      } else if (child.type === "directory" && child.children) {
        Object.values(child.children).forEach(accumulateSize);
      }
    }

    Object.values(children).forEach(accumulateSize);
    return size;
  }

  const onCellEditCommit = async (params) => {
    if (params.field !== "name") {
      return;
    }
    const row = getRowById(params.id);
    const newValue = params.value;
    if (row.name === newValue) {
      return;
    }
    if (newValue.includes(FILE_DELIMITER)) {
      alert(`File name cannot contain "${FILE_DELIMITER}".`);
      updateRowById(params.id, row);
      return;
    }
    try {
      const changedFile = await fileManager.renameFile(row.path, newValue);
      updateRowById(params.id, changedFile);
    } catch (e) {
      alert(`Failed to rename file: ${e}`);
      updateRowById(params.id, row);
      throw e;
    }
  };

  const onCellDoubleClick = async (params) => {
    if (params.field === "name") {
      return;
    }
    if (params.row.type === "directory") {
      await showDirectory(params.row.path);
    }
  };

  const onDeleteFileClick = async (params) => {
    if (currentAction) {
      return;
    }
    // Confirmation avant suppression
    if (
      params.row.type !== "directory" &&
      !window.confirm(`Are you sure you want to delete ${params.row.name}?`)
    ) {
      return;
    }
    try {
      setCurrentAction(`Deleting ${params.row.name}`);
      await fileManager.deleteFile(params.row.path, onProgress);
      deleteRowById(params.row.id);
      toast.success(`Successfully deleted ${params.row.name}`); // Affiche un toast de succès
    } catch (e) {
      console.error(`Failed to delete file: ${e}`);
      toast.error(`Failed to delete file: ${e}`); // Affiche un toast d'erreur
      throw e; // Pour conserver la propagation de l'exception si nécessaire
    } finally {
      setCurrentAction(""); // S'assurer de réinitialiser l'action en cours
    }
  };
  

  const onUploadFileClick = async (event) => {
    if (currentAction) {
      return;
    }
  
    const files = event.target.files;
    for (let file of files) {
      const fileName = await getAvailableFileName(fileManager, path, file.name);
      setCurrentAction(`Uploading ${fileName}`);
      const filePath = `${path}${FILE_DELIMITER}${fileName}`;
      try {
        await fileManager.uploadFile(filePath, file, onProgress);
        const row = fileManager.getFile(filePath);
        addRow(row);
        toast.success(`Uploading ${fileName} -  Complete`);
      } catch (e) {
        console.error(`Failed to upload file: ${e}`);
        toast.error(`Failed to upload file: ${e}`);
        break;
      }
    }
    event.target.value = null;
  };
  

  const onDownloadFileClick = async (params) => {
    if (currentAction) {
      return;
    }
    try {
      const fileName = params.row.name;
      const writable = await pickLocationAsWritable(fileName);
      setCurrentAction(`Downloading ${fileName}`);
      await fileManager.downloadFile(params.row.path, writable, onProgress);
      toast.success(`Downloading ${fileName} Complete`);
    } catch (e) {
      toast.error(`Failed to download file: ${e}`);
      throw e;
    }
  };
  

  const onShareFileClick = async (params) => {
    if (currentAction) {
      return;
    }
    if (
      !window.confirm(
        "Sharing this file will create a permanent link to it. Anyone with the link will be able to download the file. Are you sure you want to share this file?"
      )
    ) {
      return;
    }
    try {
      const fileName = params.row.name;
      const attachmentUrls = await fileManager.getAttachmentUrls(
        params.row.path
      );
      const stringifyAttachmentUrls = JSON.stringify(attachmentUrls);
      const encodedAttachmentUrls = pako.deflate(stringifyAttachmentUrls);
      const base64EncodedAttachmentUrls = btoa(
        String.fromCharCode.apply(null, encodedAttachmentUrls)
      )
        .replace(/\+/g, "~")
        .replace(/\//g, "_")
        .replace(/=/g, "-");

      const shareUrl = encodeURI(
        urlJoin(
          window.location.href,
          `/file/?name=${fileName}&size=${params.row.size}#${base64EncodedAttachmentUrls}`
        )
      );

      if (navigator.share) {
        try {
          await navigator.share({ title: fileName, url: shareUrl });
        } catch (e) {
          if (
            e instanceof DOMException &&
            e.message ===
              "Failed to execute 'share' on 'Navigator': Must be handling a user gesture to perform a share request."
          ) {
            navigator.clipboard.writeText(shareUrl);
            alert(
              "File was too large to share. A link to it has been copied to your clipboard."
            );
          }
        }
      } else {
        navigator.clipboard.writeText(shareUrl);
        alert(
          "File shared successfully. A link to it has been copied to your clipboard."
        );
      }
    } catch (e) {
      alert(`Failed to share file: ${e}`);
      throw e;
    }
  };

  const onNewFolderClick = async (params) => {
    try {
      const folderName = await getAvailableFileName(
        fileManager,
        path,
        "New Folder"
      );
      const folderPath = `${path}${FILE_DELIMITER}${folderName}`;
      await fileManager.createDirectory(folderPath); // TODO: Maybe change folder to directory
      const row = fileManager.getFile(folderPath);
      addRow(row);
    } catch (e) {
      alert(`Failed to create folder: ${e}`);
    }
  };

  const showSearchResults = (value = null) => {
    if (value === null) {
      value = searchValue;
    }
    const file = fileManager.getFile(value);
    if (file && file.type === "directory") {
      showDirectory(value);
    } else {
      const fileOptions = [];
      searchOptions.forEach((option) => {
        fileOptions.push(fileManager.getFile(option));
      });
      setRows(fileOptions);
      setPath(null);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  
  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
  
    if (currentAction) {
      alert("Please wait until the current operation finishes.");
      return;
    }
  
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };
  
  const handleFileUpload = async (files) => {
    for (let file of files) {
      const fileName = await getAvailableFileName(fileManager, path, file.name);
      setCurrentAction(`Uploading ${fileName}`);
      const filePath = `${path}${FILE_DELIMITER}${fileName}`;
      try {
        await fileManager.uploadFile(filePath, file, onProgress);
        const newRow = fileManager.getFile(filePath);
        addRow(newRow);
        toast.success(`Upload completed for ${fileName}`);  // Notification de la réussite de l'upload
      } catch (e) {
        console.error(`Failed to upload file: ${e}`);
        toast.error(`Failed to upload file: ${e}`);
        break;
      }
    }
  };

  return (
    <div
      style={{ height: "87vh" }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ThemeProvider theme={theme ? darkTheme : lightTheme}>
        <CssBaseline />
        <ExtensionDialog />
        <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

        <div
          style={{ height: "94%" }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className={styles.navbar}>
            <div className={styles.NavSearch}>
              <div className="buttonContainer">
                <NavigationBar
                  theme={theme}
                  setTheme={setTheme}
                  totalStorageSize={totalStorageSize}
                  className={styles.icone}
                />
                <input
                  id="uploadFile"
                  type="file"
                  multiple
                  onChange={onUploadFileClick}
                  className={styles.hidden}
                ></input>
                <BsButton
                  variant="outline-primary"
                  className={styles.navbtn}
                  onClick={() => {
                    document.getElementById("uploadFile").click();
                  }}
                  disabled={currentAction !== "" || path === null}
                >
                  <FontAwesomeIcon
                    icon={faFileCirclePlus}
                    size="lg"
                    className={styles.icone}
                  />
                </BsButton>
              </div>
              <div className="buttonContainer">
                <BsButton
                  variant="outline-primary"
                  onClick={onNewFolderClick}
                  className={styles.navbtn}
                  disabled={currentAction !== "" || path === null}
                >
                  <FontAwesomeIcon
                    icon={faFolderPlus}
                    size="lg"
                    className={styles.icone}
                  />
                </BsButton>
              </div>
              <div className={styles.Search}>
                <SearchBar
                  fileManager={fileManager}
                  files={true}
                  directories={true}
                  advanced={true}
                  rows={rows}
                  search={true}
                  onOptionsChanged={(options) => {
                    setSearchOptions(options);
                  }}
                  onChange={(value) => {
                    setSearchValue(value);
                  }}
                  onSelect={showSearchResults}
                  onEnter={showSearchResults}
                  placeholder="Search for files, directories, extensions (e.g. ext:png)"
                />
              </div>
            </div>
          </div>

          <PathParts
            path={path}
            fileManager={fileManager}
            showDirectory={showDirectory}
          />
          <div style={{ height: "100%", width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={buildColumns(
                fileManager,
                currentAction,
                onShareFileClick,
                onDownloadFileClick,
                onDeleteFileClick
              )}
              hideFooter={false}
              checkboxSelection
              disableSelectionOnClick
              showColumnRightBorder={false}
              onCellEditCommit={onCellEditCommit}
              onCellDoubleClick={onCellDoubleClick}
              rowsPerPageOptions={[]}
            />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}

export default App;
