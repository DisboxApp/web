import { library } from '@fortawesome/fontawesome-svg-core';
import { faFolder, faFileImage, faFileAudio, faFileVideo ,faFilePdf, faFileWord, faFileExcel, faFilePowerpoint, faFileText, faFileCode, faFileArchive, faFile } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

library.add(faFolder, faFileImage, faFileAudio, faFileVideo, faFilePdf, faFileWord, faFileExcel, faFilePowerpoint, faFileText, faFileCode, faFileArchive, faFile);

var ICON_STRINGS = {
    "image": "file-image",
    "audio": "file-audio",
    "video": "file-video",
    "application/pdf": "file-pdf",
    "application/msword": "file-word",
    "application/vnd.ms-word": "file-word",
    "application/vnd.oasis.opendocument.text": "file-word",
    "application/vnd.openxmlformats-officedocument.wordprocessingml": "file-word",
    "application/vnd.ms-excel": "file-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml": "file-excel",
    "application/vnd.oasis.opendocument.spreadsheet": "file-excel",
    "application/vnd.ms-powerpoint": "file-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml": "file-powerpoint",
    "application/vnd.oasis.opendocument.presentation": "file-powerpoint",
    "text/plain": "file-text",
    "text/html": "file-code",
    "application/json": "file-code",
    "application/gzip": "file-archive",
    "application/zip": "file-archive",
    "inode/directory": "folder",
  };


function getIconString(mimeType) {
    for (let key in ICON_STRINGS) {
        if (mimeType.startsWith(key)) {
            return ICON_STRINGS[key];
        }
    }
    return "file";
}

function FileIcon({mimeType}) {
    return <div>
        <FontAwesomeIcon icon={getIconString(mimeType)} size="xl" />
    </div>
}

export default FileIcon;
