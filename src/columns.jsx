import { formatSize, getMimeType } from './file-utils';
import FileIcon from './FileIcon';

function formatDateString(dateString) {
  let date = new Date(dateString);
  return date.toLocaleString();
}

export default function buildColumns(
  fileManager,
  currentAction,
  onShareClick,
  onDownloadClick,
  onDeleteClick,
  savePickerAvailable,
) {
  return [
    // { field: 'id', headerName: 'ID', width: 90 },
    {
      field: 'type',
      headerName: '',
      width: 0,
      renderCell: (params) => (
        <FileIcon
          mimeType={
            params.row.type === 'directory'
              ? 'inode/directory'
              : getMimeType(params.row.name)
          }
        />
      ),
      disableColumnMenu: true,
      sortable: false,
      headerClassName: 'no-width no-seperator',
      cellClassName: 'icon-cell',
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 470,
      editable: true,
      headerClassName: 'extra-width',
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
      width: 400,
      // hide: path !== null, // Deprecated
    },
    {
      field: 'share',
      headerName: 'Share',
      width: 85,
      style: {
        fontSize: '2rem',
      },
      renderCell: (params) => (
        <div>
          <button
            disabled={currentAction !== '' || params.row.type === 'directory'}
            className='rounded-lg bg-green-500 px-2 py-1 text-lg font-bold text-white hover:bg-green-700'
            onClick={async () => {
              onShareClick(params);
            }}
          >
            Share
          </button>
        </div>
      ),
    },
    {
      field: 'download',
      headerName: 'Download',
      width: 120,
      style: {
        fontSize: '2rem',
      },
      renderCell: (params) => (
        <div>
          <button
            className='rounded-lg bg-blue-500 px-2 py-1 text-lg font-bold text-white hover:bg-blue-700'
            disabled={
              currentAction !== '' ||
              params.row.type === 'directory' ||
              !savePickerAvailable
            }
            variant='text'
            color='primary'
            onClick={async () => {
              onDownloadClick(params);
            }}
          >
            Download
          </button>
        </div>
      ),
    },
    {
      field: 'delete',
      headerName: 'Delete',
      width: 85,
      style: {
        fontSize: '2rem',
      },
      renderCell: (params) => (
        <div>
          <button
            className='rounded-lg bg-red-500 px-2 py-1 text-lg font-bold text-white hover:bg-red-700'
            disabled={
              currentAction !== '' ||
              (params.row.type === 'directory' &&
                fileManager.getFile(params.row.path) !== null &&
                Object.keys(fileManager.getChildren(params.row.path)).length >
                  0)
            }
            variant='text'
            color='error'
            onClick={async () => {
              onDeleteClick(params);
            }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];
}
