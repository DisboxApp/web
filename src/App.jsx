/*global chrome*/
import React, { useEffect, useState } from 'react';

import {
  CssBaseline,
  LinearProgress,
  linearProgressClasses,
  Snackbar,
  Tooltip,
} from '@mui/material';
import { createTheme, styled, ThemeProvider } from '@mui/material/styles';
import { DataGrid, GridCloseIcon } from '@mui/x-data-grid';
import urlJoin from 'url-join';
import buildColumns from './columns';
import DisboxFileManager, { FILE_DELIMITER } from './disbox-file-manager';
import { getAvailableFileName, pickLocationAsWritable } from './file-utils.js';
import PathParts from './PathParts';
import SearchBar from './SearchBar';
import ThemeSwitch from './ThemeSwitch';
import Clipboard from 'react-clipboard.js';
import AlertDownloading from './AlertDownloading';
import AlertExtension from './AlertExtension';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});
const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
  root: {
    padding: '6px 16px',
  },
});

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 5,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor:
      theme.palette.grey[theme.palette.mode === 'light' ? 200 : 800],
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 5,
    backgroundColor: theme.palette.mode === 'light' ? '#1a90ff' : '#308fe8',
  },
}));

function App() {
  const [fileManager, setFileManager] = useState(null);
  const [rows, setRows] = useState([]);
  const [theme, setTheme] = useState(true);

  const [path, setPath] = useState(null);

  const [searchOptions, setSearchOptions] = useState([]);
  const [searchValue, setSearchValue] = useState('');

  const [currentAction, setCurrentAction] = useState('');
  const [showProgress, setShowProgress] = useState(false);
  const [progressValue, setProgressValue] = useState(-1);
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);
  const [savePickerAvailable, setSavePickerAvailable] = useState(false);
  const [activeShareUrl, setActiveShareUrl] = useState('');

  useEffect(() => {
    try {
      chrome.runtime.sendMessage(
        'jklpfhklkhbfgeencifbmkoiaokeieah',
        { message: {} },
        (response) => {
          if (!response || !response.installed) {
            setShowExtensionDialog(true);
          }
        },
      );
    } catch {
      setShowExtensionDialog(true);
    }

    setSavePickerAvailable(!!window.showSaveFilePicker);

    const webhookUrl = localStorage.getItem('webhookUrl');
    async function init() {
      if (webhookUrl) {
        const manager = await DisboxFileManager.create(webhookUrl);
        setFileManager(manager);
        setRows(Object.values(manager.getChildren('')));
        setPath('');
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
        setCurrentAction('');
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
    // setParent(parent ? parent.path : null);
    setRows(Object.values(fileManager.getChildren(path)));
  };

  const onProgress = (value, total) => {
    const percentage = Math.round((value / total) * 100).toFixed(0);
    setProgressValue(Number(percentage));
  };

  const onCellEditCommit = async (params) => {
    if (params.field !== 'name') {
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
    if (params.field === 'name') {
      return;
    }
    if (params.row.type === 'directory') {
      await showDirectory(params.row.path);
    }
  };

  const onDeleteFileClick = async (params) => {
    if (currentAction) {
      return;
    }
    if (
      params.row.type !== 'directory' &&
      !window.confirm(`Are you sure you want to delete ${params.row.name}?`)
    ) {
      return;
    }
    try {
      setCurrentAction(`Deleting ${params.row.name}`);
      await fileManager.deleteFile(params.row.path, onProgress);
      deleteRowById(params.row.id);
    } catch (e) {
      alert(`Failed to delete file: ${e}`);
      throw e;
    }
  };

  const onUploadFileClick = async (params) => {
    if (currentAction) {
      return;
    }
    const file = params.target.files[0];
    const fileName = await getAvailableFileName(fileManager, path, file.name);
    setCurrentAction(`Uploading ${fileName}`);
    const filePath = `${path}${FILE_DELIMITER}${fileName}`;
    try {
      await fileManager.uploadFile(filePath, file, onProgress);
      const row = fileManager.getFile(filePath);
      addRow(row);
    } catch (e) {
      alert(`Failed to upload file: ${e}`);
      throw e;
    } finally {
      params.target.value = null;
    }
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
    } catch (e) {
      alert(`Failed to download file: ${e}`);
      throw e;
    }
  };

  const onShareFileClick = async (params) => {
    if (currentAction) {
      return;
    }

    try {
      const fileName = params.row.name;
      const attachmentUrls = await fileManager.getAttachmentUrls(
        params.row.path,
      );

      const base64AttachmentUrls = btoa(JSON.stringify(attachmentUrls))
        .replace(/\+/g, '~')
        .replace(/\//g, '_')
        .replace(/=/g, '-');

      const shareUrl = encodeURI(
        urlJoin(
          window.location.href,
          `/file/?name=${fileName}&attachmentUrls=${base64AttachmentUrls}&size=${params.row.size}`,
        ),
      );
      setActiveShareUrl(shareUrl);
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
        'New Folder',
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
    if (file && file.type === 'directory') {
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

  return (
    <div>
      <ThemeProvider theme={theme ? darkTheme : lightTheme}>
        <CssBaseline />
        <Snackbar
          message=''
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          open={showProgress}
        >
          <div>
            <div>
              <span className='text-lg font-bold text-white'>
                {currentAction}
              </span>
            </div>
            <div>
              <div>
                <BorderLinearProgress
                  variant='determinate'
                  value={progressValue}
                />
              </div>
              <div className='flex w-full'>
                <span className='text-lg font-bold text-white'>
                  {`${progressValue}%`}
                </span>

                <span className='justify-end text-lg font-bold text-white'>
                  <GridCloseIcon
                    fontSize='small'
                    onClick={() => {
                      setShowProgress(false);
                    }}
                  />
                </span>
              </div>
            </div>
          </div>
        </Snackbar>

        <div style={{ height: '100%' }}>
          <div className='m-2'>
            <Tooltip
              title='Select a file or directory to show them or hit enter to show all matching results'
              placement='bottom-end'
            >
              <div>
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
                  placeholder='Search for files, directories, extensions (e.g. ext:png)'
                />
              </div>
            </Tooltip>
          </div>
          <div className='m-2'>
            <input
              id='uploadFile'
              type='file'
              style={{ display: 'none' }}
              onChange={onUploadFileClick}
            ></input>
            <button
              className='rounded-lg bg-blue-500 px-2 py-1 text-lg font-bold text-white hover:bg-blue-700'
              onClick={() => {
                document.getElementById('uploadFile').click();
              }}
              disabled={currentAction !== '' || path === null}
            >
              Upload file
            </button>
            <button
              className='ml-2 rounded-lg bg-blue-500 px-2 py-1 text-lg font-bold text-white hover:bg-blue-700'
              onClick={onNewFolderClick}
              disabled={currentAction !== '' || path === null}
            >
              New Folder
            </button>
          </div>
          <AlertDownloading savePickerAvailable={savePickerAvailable} />
          <AlertExtension
            showExtensionDialog={showExtensionDialog}
            setShowExtensionDialog={setShowExtensionDialog}
          />
          <div
            className={
              activeShareUrl ? 'm-2 w-full rounded-lg bg-green-500' : 'hidden'
            }
          >
            <div className='flex-col justify-between'>
              <div className='p-2'>
                <span className='text-lg font-bold text-white'>
                  Shareable Link
                </span>
                <span className='ml-2 text-sm text-white'>
                  Anyone with this link can download the file
                </span>
              </div>
              <div className='p-2'>
                <input
                  id='shareurlinput'
                  className='w-full rounded-lg p-2 text-black'
                  value={activeShareUrl}
                  readOnly
                />
              </div>
              <div className='p-2'>
                <Clipboard
                  className='rounded-lg bg-blue-500 px-2 py-1 text-lg font-bold text-white hover:bg-blue-700'
                  data-clipboard-text={activeShareUrl}
                >
                  Copy URL
                </Clipboard>
                <button
                  className='ml-2 rounded-lg bg-red-500 px-2 py-1 text-lg font-bold text-white hover:bg-red-700'
                  onClick={() => {
                    setActiveShareUrl('');
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
          <PathParts
            path={path}
            fileManager={fileManager}
            showDirectory={showDirectory}
          />
          <div>
            <DataGrid
              sx={{
                width: 1,
                '& .MuiDataGrid-cell--editing': {
                  bgcolor: 'rgb(255,215,115, 0.19)',
                  color: '#1a3e72',
                  '& .MuiInputBase-root': {
                    height: '100%',
                  },
                },
                '& .Mui-error': {
                  bgcolor: (theme) =>
                    `rgb(126,10,15, ${
                      theme.palette.mode === 'dark' ? 0 : 0.1
                    })`,
                  color: (theme) =>
                    theme.palette.mode === 'dark' ? '#ff4343' : '#750f0f',
                },
              }}
              style={{ border: '0px' }}
              rows={rows}
              columns={buildColumns(
                fileManager,
                currentAction,
                onShareFileClick,
                onDownloadFileClick,
                onDeleteFileClick,
                savePickerAvailable,
              )}
              hideFooter={true}
              checkboxSelection
              disableSelectionOnClick
              showColumnRightBorder={false}
              onCellEditCommit={onCellEditCommit}
              onCellDoubleClick={onCellDoubleClick}
            />
          </div>
        </div>
      </ThemeProvider>
      <div className='flex justify-end'>
        <ThemeSwitch theme={theme} setTheme={setTheme} />
      </div>
    </div>
  );
}

export default App;
