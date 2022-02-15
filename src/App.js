import { DataGrid } from '@mui/x-data-grid';
import './App.css';
import DisboxFileManager, { FILE_DELIMITER } from "./disbox-file-manager";
import React, { useEffect, useState } from 'react';
import NavigationBar from './NavigationBar';
import ThemeSwitch from './ThemeSwitch';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Button, Tooltip } from '@mui/material';
import { Button as BsButton } from 'react-bootstrap';
import SearchBar from './SearchBar';


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

function PathPart(props) {
    return <div>
        <Button onClick={() => props.showDirectory(props.path)}>{`${props.name} >`}</Button>
    </div>
}

function PathParts(props) {
    const [partComponents, setPartComponents] = useState([]);

    useEffect(() => {
        async function f() {
            if (props.fileManager) {
                const parts = [];
                if (props.path) {
                    parts.push(<PathPart fileManager={props.fileManager} path={props.path}
                        name={await props.fileManager.getFile(props.path).name} showDirectory={props.showDirectory} />);
                }
                let parent = await props.fileManager.getParent(props.path);
                while (parent && "path" in parent) {
                    parts.push(<PathPart fileManager={props.fileManager} path={parent.path} name={parent.name} showDirectory={props.showDirectory} />);
                    parent = await props.fileManager.getParent(parent.path);
                }
                parts.push(<PathPart fileManager={props.fileManager} path={""} name={"Storage"} showDirectory={props.showDirectory} />);
                setPartComponents(parts.reverse());
            }
        }
        f();
    }, [props.path]);

    return <div style={{ display: "flex" }}>
        {partComponents.map((component, index) => (
            <React.Fragment key={index}>
                {component}
            </React.Fragment>
        ))}
    </div>
}


function formatSize(bytes, decimals = 1) {
    if (bytes === 0) return '0 Bytes';
    if (!bytes) return '';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatDateString(dateString) {
    let date = new Date(dateString);
    return date.toLocaleString();
}

function App() {
    const [fileManager, setFileManager] = useState(null);
    const [rows, setRows] = useState([]);
    const [theme, setTheme] = useState(true);

    const [parent, setParent] = useState(null);
    const [path, setPath] = useState(null);

    const [searchOptions, setSearchOptions] = useState([]);
    const [searchValue, setSearchValue] = useState("");

    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const webhookUrl = localStorage.getItem("webhookUrl");
        async function init() {
            if (webhookUrl) {
                const manager = new DisboxFileManager(webhookUrl);
                await manager.init();
                setFileManager(manager);
                setRows(Object.values(await manager.getChildren("")));
                setPath("");
                setParent(null);
            }
        }
        init();
    }, []);

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
        setParent(parent ? parent.path : null);
        setRows(Object.values(await fileManager.getChildren(path)));
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
        try {
            const changes = await fileManager.renameFile(row.path, newValue);
            for (const [key, value] of Object.entries(changes)) {
                row[key] = value;
            }
        } catch (e) {
            alert(`Failed to rename file: ${e}`);
            throw e;
        }
        updateRowById(params.id, row);
    }

    const onCellDoubleClick = async (params) => {
        if (params.field === "name") {
            return;
        }
        await showDirectory(params.row.path);
    }

    const onDeleteFileClick = async (params) => {
        try {
            await fileManager.deleteFile(params.row.path);
            deleteRowById(params.row.id);
        } catch (e) {
            alert(`Failed to delete file: ${e}`);
            throw e;
        }
    }

    const onDownloadFileClick = async (params) => {
        try {
            await fileManager.downloadFile(params.row.path, (size, total) => { console.log(`Downloading ${formatSize(size)} of ${formatSize(total)}`); });
        } catch (e) {
            alert(`Failed to download file: ${e}`);
            throw e;
        }
    }


    const getAvailableFileName = async (originalName) => {
        const extension = originalName.includes(".") ? originalName.split(".").pop() : "";
        let name = originalName.includes(".") ? originalName.substring(0, originalName.lastIndexOf(".")) : originalName;
        let tryIndex = 1;
        while (await fileManager.getFile(`${path}${FILE_DELIMITER}${name}`)) {
            console.log(await fileManager.getFile(`${path}${FILE_DELIMITER}${name}`));
            name = `${originalName} (${tryIndex})`;
            tryIndex++;
        }
        return name + (extension ? `.${extension}` : "");
    }


    const onUploadFileClick = async (params) => {
        if (uploading) {
            return;
        }
        setUploading(true);
        const file = params.target.files[0];
        const fileName = await getAvailableFileName(file.name);
        const filePath = `${path}${FILE_DELIMITER}${fileName}`;
        try {
            await fileManager.uploadFile(filePath, file);
            const row = fileManager.getFile(filePath);
            console.log(row);
            addRow(row);
        } catch (e) {
            alert(`Failed to upload file: ${e}`);
            throw e;
        } finally {
            setUploading(false);
            params.target.value = null;
        }
    }

    const onNewFolderClick = async (params) => {
        try {
            const folderName = await getAvailableFileName("New Folder");
            const folderPath = `${path}${FILE_DELIMITER}${folderName}`;
            await fileManager.createDirectory(folderPath); // TODO: Maybe change folder to directory
            const row = fileManager.getFile(folderPath);
            addRow(row);
        } catch (e) {
            alert(`Failed to create folder: ${e}`);


        }
    }


    const showSearchResults = (value=null) => {
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



    const columns = [
        // { field: 'id', headerName: 'ID', width: 90 },
        {
            field: 'name',
            headerName: 'Name',
            width: 500,
            editable: true,
        },
        {
            field: 'created_at',
            headerName: 'Created at',
            type: 'date',
            width: 200,
            valueFormatter: (params) => formatDateString(params.value),
        },
        {
            field: 'updated_at',
            headerName: 'Updated at',
            type: 'date',
            width: 200,
            valueFormatter: (params) => formatDateString(params.value),
        },
        {
            field: 'size',
            headerName: 'Size',
            // type: 'number',
            width: 150,
            valueFormatter: (params) => formatSize(params.value),
        },
        {
            field: 'path',
            headerName: 'Path',
            width: 500,
            // hide: path !== null, // Deprecated
        },
        {
            field: 'download',
            headerName: 'Download',
            width: 130,
            style: {
                fontSize: '2rem',
            },
            renderCell: (params) => (
                <div>
                    <Button
                        disabled={params.row.type === "directory"}
                        variant="text"
                        color="primary"
                        style={{ marginLeft: 16 }}
                        onClick={async () => {
                            onDownloadFileClick(params);
                        }}
                    >
                        Download
                    </Button>
                </div>
            ),
        },
        {
            field: 'delete',
            headerName: 'Delete',
            width: 100,
            style: {
                fontSize: '2rem',
            },
            renderCell: (params) => (
                <div>
                    <Button
                        disabled={params.row.type === "directory"}
                        variant="text"
                        color="error"
                        style={{ marginLeft: 16 }}
                        onClick={async () => {
                            onDeleteFileClick(params);
                        }}
                    >
                        Delete
                    </Button>
                </div>
            ),
        }
    ];


    return (
        <div style={{ height: "87vh" }}>
            <NavigationBar />
            <ThemeProvider theme={theme ? darkTheme : lightTheme}>
                <CssBaseline />
                <div style={{ height: "100%" }}>
                    <div className='m-2'>
                        <Tooltip title="Select a file or directory to show them or hit enter to show all matching results" placement="bottom-end">
                            <div>
                            <SearchBar fileManager={fileManager} files={true} directories={true} advanced={true}
                                search={true} onOptionsChanged={(options) => {setSearchOptions(options)}}
                                onChange={(value) => {setSearchValue(value)}} onSelect={showSearchResults} onEnter={showSearchResults} 
                                placeholder="Search for files, directories, extensions (e.g. ext:png)"/>
                            </div>
                        </Tooltip>
                    </div>
                    <div className='m-2'>
                        <input id="uploadFile" type="file" style={{ display: "none" }} onChange={onUploadFileClick}></input>
                        <BsButton variant="outline-primary" onClick={() => { document.getElementById("uploadFile").click() }} disabled={(uploading || path === null)}>Upload file</BsButton>
                        <BsButton variant="outline-primary" style={{ marginLeft: "0.25rem" }} onClick={onNewFolderClick} disabled={(uploading || path === null)}>New Folder</BsButton>
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
                            columns={columns}
                            // pageSize={5}
                            // rowsPerPageOptions={[5]}
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
