import { Button } from '@mui/material';
import { formatSize, getMimeType } from '../file/file-utils';
import FileIcon from '../icons/FileIcon';

function formatDateString(dateString) {
    let date = new Date(dateString);
    return date.toLocaleString();
}

export default function buildColumns(fileManager, currentAction, onShareClick, onDownloadClick, onDeleteClick) {
    return [
        // { field: 'id', headerName: 'ID', width: 90 },
        {
            field: 'type',
            headerName: '',
            width: 0,
            renderCell: (params) => (
                <FileIcon mimeType={params.row.type === "directory" ? "inode/directory" : getMimeType(params.row.name)} />
            ),
            disableColumnMenu: true,
            sortable: false,
            headerClassName: 'no-width no-seperator',
            cellClassName: 'icon-cell'
        },
        {
            field: 'name',
            headerName: 'Name',
            flex: 0.2,
            editable: true,
            headerClassName: 'extra-width',
            cellClassName: 'name-width'
        },
        {
            field: 'created_at',
            headerName: 'Created at',
            type: 'date',
            flex: 0.2,
            valueFormatter: (params) => formatDateString(params.value),
        },
        {
            field: 'updated_at',
            headerName: 'Updated at',
            type: 'date',
            flex: 0.2,
            valueFormatter: (params) => formatDateString(params.value),
        },
        {
            field: 'size',
            headerName: 'Size',
            // type: 'number',
            flex: 0.2,
            valueFormatter: (params) => formatSize(params.value),
        },
        {
            field: 'path',
            headerName: 'Path',
            flex: 0.2,
            // hide: path !== null, // Deprecated
        },
        {
            field: 'share',
            headerName: 'Share',
            flex: 0.2,
            style: {
                fontSize: '2rem',
            },
            renderCell: (params) => (
                <div>
                    <Button
                        disabled={currentAction !== "" || params.row.type === "directory"}
                        variant="text"
                        color="primary"
                        onClick={async () => {
                            onShareClick(params);
                        }}
                    >
                        Share
                    </Button>
                </div>
            ),
        },
        {
            field: 'download',
            headerName: 'Download',
            flex: 0.2,
            style: {
                fontSize: '2rem',
            },
            renderCell: (params) => (
                <div>
                    <Button
                        disabled={currentAction !== "" || params.row.type === "directory"}
                        variant="text"
                        color="primary"
                        onClick={async () => {
                            onDownloadClick(params);
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
            flex: 0.1,
            style: {
                fontSize: '2rem',
            },
            renderCell: (params) => (
                <div>
                    <Button
                        disabled={currentAction !== "" || (params.row.type === "directory" &&
                            fileManager.getFile(params.row.path) !== null && Object.keys(fileManager.getChildren(params.row.path)).length > 0)}
                        variant="text"
                        color="error"
                        onClick={async () => {
                            onDeleteClick(params);
                        }}
                    >
                        Delete
                    </Button>
                </div>
            ),
        }
    ];
}