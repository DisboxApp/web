/*global chrome*/
import React, { useEffect, useState } from 'react';

import { Button, CssBaseline, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, LinearProgress, linearProgressClasses, Snackbar, Tooltip, Typography } from '@mui/material';
import { createTheme, styled, ThemeProvider } from '@mui/material/styles';
import { Box } from '@mui/system';
import { DataGrid, GridCloseIcon } from '@mui/x-data-grid';
import { Button as BsButton } from 'react-bootstrap';
import urlJoin from 'url-join';
import './App.css';
import buildColumns from './columns';
import DisboxFileManager, { FILE_DELIMITER } from "./disbox-file-manager";
import { getAvailableFileName, pickLocationAsWritable } from "./file-utils.js";
import NavigationBar from './NavigationBar';
import PathParts from './PathParts';
import SearchBar from './SearchBar';
import ThemeSwitch from './ThemeSwitch';
import pako from 'pako'

const EXTENSION_URL = "https://chrome.google.com/webstore/detail/disboxdownloader/jklpfhklkhbfgeencifbmkoiaokeieah";

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    }
});
const lightTheme = createTheme({
    palette: {
        mode: 'light',
    },
    root: {
        padding: '6px 16px',
    }
});


const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
    height: 10,
    borderRadius: 5,
    [`&.${linearProgressClasses.colorPrimary}`]: {
        backgroundColor: theme.palette.grey[theme.palette.mode === 'light' ? 200 : 800],
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
    const [searchValue, setSearchValue] = useState("");

    const [currentAction, setCurrentAction] = useState("");
    const [showProgress, setShowProgress] = useState(false);
    const [progressValue, setProgressValue] = useState(-1);
    const [showExtensionDialog, setShowExtensionDialog] = useState(false);


    useEffect(() => {
        try {
            chrome.runtime.sendMessage("jklpfhklkhbfgeencifbmkoiaokeieah", { message: {} }, response => {
                if (!response || !response.installed) {
                    setShowExtensionDialog(true);
                }
            });
        } catch {
            setShowExtensionDialog(true);
        }

        const webhookUrl = localStorage.getItem("webhookUrl");
        async function init() {
            if (webhookUrl) {
                const manager = await DisboxFileManager.create(webhookUrl);
                setFileManager(manager);
                setRows(Object.values(manager.getChildren("")));
                setPath("");
                // setParent(null);
            }
        }
        init();
    }, []);


    useEffect(() => {
        if (progressValue === 100 || progressValue === -1 ) {
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
        return rows.find(row => row.id === id);
    }


    // Needed because we don't have the pro version of the data grid
    const updateRowById = (id, row) => {
        const newRows = [];
        rows.forEach(r => {
            if (r.id === id) {
                newRows.push(row);
            } else {
                newRows.push(r);
            }
        });
        setRows(newRows);
    }


    const deleteRowById = (id) => {
        const newRows = [];
        rows.forEach(r => {
            if (r.id !== id) {
                newRows.push(r);
            }
        });
        setRows(newRows);
    }


    const addRow = (row) => {
        setRows([...rows, row]);
    }


    const showDirectory = async (path) => {
        setPath(path);
        const parent = await fileManager.getParent(path);
        // setParent(parent ? parent.path : null);
        setRows(Object.values(fileManager.getChildren(path)));
    }
    
    const onProgress = (value, total) => {
        const percentage = Math.round((value / total) * 100).toFixed(0);
        setProgressValue(Number(percentage));
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
    }


    const onCellDoubleClick = async (params) => {
        if (params.field === "name") {
            return;
        }
        if (params.row.type === "directory") {
            await showDirectory(params.row.path);
        }
    }


    const onDeleteFileClick = async (params) => {
        if (currentAction) {
            return;
        }
        if (params.row.type !== "directory" && !window.confirm(`Are you sure you want to delete ${params.row.name}?`)) {
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
    }


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
    }


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
    }


    const onShareFileClick = async (params) => {
        if (currentAction) {
            return;
        }
        if (!window.confirm("Sharing this file will create a permanent link to it. Anyone with the link will be able to download the file. Are you sure you want to share this file?")) {
            return;
        }
        try {
            const fileName = params.row.name;
            const attachmentUrls = await fileManager.getAttachmentUrls(params.row.path);
            const base64AttachmentUrlsBase = JSON.stringify(attachmentUrls);
            const encodedUrls = pako.deflate(base64AttachmentUrlsBase.replace(/\?(.*?)"/g, '"'));
            const base64AttachmentUrls = btoa(String.fromCharCode.apply(null, encodedUrls)).replace(/\+/g, '~').replace(/\//g, '_').replace(/=/g, '-');

            const shareUrl = encodeURI(urlJoin(window.location.href, `/file/?name=${fileName}&size=${params.row.size}#${base64AttachmentUrls}`));

            if (navigator.share) {
                await navigator.share({
                    title: fileName,
                    url: shareUrl
                });
            } else {
                navigator.clipboard.writeText(shareUrl);
                alert("File shared successfully. A link to it has been copied to your clipboard.");
            }

            // alert("File shared successfully. The link has been copied to your clipboard.");
        } catch (e) {
            alert(`Failed to share file: ${e}`);
            throw e;
        }
    }


    const onNewFolderClick = async (params) => {
        try {
            const folderName = await getAvailableFileName(fileManager, path, "New Folder");
            const folderPath = `${path}${FILE_DELIMITER}${folderName}`;
            await fileManager.createDirectory(folderPath); // TODO: Maybe change folder to directory
            const row = fileManager.getFile(folderPath);
            addRow(row);
        } catch (e) {
            alert(`Failed to create folder: ${e}`);
        }
    }


    const showSearchResults = (value = null) => {
        if (value === null) {
            value = searchValue;
        }
        const file = fileManager.getFile(value);
        if (file && file.type === "directory") {
            showDirectory(value);
        } else {
            const fileOptions = [];
            searchOptions.forEach(option => {
                fileOptions.push(fileManager.getFile(option));
            });
            setRows(fileOptions);
            setPath(null);
        }
    }

    return (
        <div style={{ height: "87vh" }}>
            <NavigationBar />
            <ThemeProvider theme={theme ? darkTheme : lightTheme}>
                <CssBaseline />
                <Dialog open={showExtensionDialog} onClose={() => { setShowExtensionDialog(false) }}>
                    <DialogTitle>Warning</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Disbox recommends using the official Disbox chrome extension for
                            better download speeds and increased security.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => { setShowExtensionDialog(false) }}>Remind me later</Button>
                        <Button variant="contained" onClick={() => {
                            setShowExtensionDialog(false);
                            window.open(EXTENSION_URL, "_blank").focus();
                        }} >Install</Button>
                    </DialogActions>
                </Dialog>

                <Snackbar
                    message=""
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right', }}
                    open={showProgress}
                >
                    <Box style={{ backgroundColor: "white", width: "500px", height: "60px" }}>
                        <Box sx={{ width: '100%', mr: 1, ml: 1, mt: 1, mb: -0.5 }}>
                            <Typography sx={{ color: "black" }} variant="body2" color="text.secondary">{currentAction}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', marginTop: "4px" }}>
                            <Box sx={{ width: '100%', mr: 1, ml: 1 }}>
                                <BorderLinearProgress variant="determinate" value={progressValue} />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                                <Typography sx={{ color: "black" }} variant="body2" color="text.secondary">{`${progressValue}%`}</Typography>
                            </Box>
                            <IconButton size="small" aria-label="close" sx={{ color: "black" }} onClick={() => { setShowProgress(false) }}>
                                <GridCloseIcon fontSize="small" />
                            </IconButton>
                        </Box>

                    </Box>
                </Snackbar>

                <div style={{ height: "100%" }}>
                    <div className='m-2'>
                        <Tooltip title="Select a file or directory to show them or hit enter to show all matching results" placement="bottom-end">
                            <div>
                                <SearchBar fileManager={fileManager} files={true} directories={true} advanced={true} rows={rows}
                                    search={true} onOptionsChanged={(options) => { setSearchOptions(options) }}
                                    onChange={(value) => { setSearchValue(value) }} onSelect={showSearchResults} onEnter={showSearchResults}
                                    placeholder="Search for files, directories, extensions (e.g. ext:png)" />
                            </div>
                        </Tooltip>
                    </div>
                    <div className='m-2'>
                        <input id="uploadFile" type="file" style={{ display: "none" }} onChange={onUploadFileClick}></input>
                        <BsButton variant="outline-primary" onClick={() => { document.getElementById("uploadFile").click() }} disabled={(currentAction !== "" || path === null)}>Upload file</BsButton>
                        <BsButton variant="outline-primary" style={{ marginLeft: "0.25rem" }} onClick={onNewFolderClick} disabled={(currentAction !== "" || path === null)}>New Folder</BsButton>
                    </div>
                    <PathParts path={path} fileManager={fileManager} showDirectory={showDirectory} />
                    <div style={{ height: "82.5%", width: '100%' }}>
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
                                        `rgb(126,10,15, ${theme.palette.mode === 'dark' ? 0 : 0.1})`,
                                    color: (theme) => (theme.palette.mode === 'dark' ? '#ff4343' : '#750f0f'),
                                },
                            }}
                            style={{ border: "0px" }}
                            rows={rows}
                            columns={buildColumns(fileManager, currentAction, onShareFileClick, onDownloadFileClick, onDeleteFileClick)}
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
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <ThemeSwitch theme={theme} setTheme={setTheme} />
            </div>
        </div>
    );
}

export default App;