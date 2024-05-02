import * as mime from 'react-native-mime-types';
import { FILE_DELIMITER } from "./disbox-file-manager";
import { showSaveFilePicker } from "native-file-system-adapter";


export function getMimeType(name) {
    return mime.lookup(name) || 'application/octet-stream';
}

export async function pickLocationAsWritable(suggestedName) {
    let pickerConfig = {
        suggestedName: suggestedName
    }
    if (suggestedName.includes(".")) {
        let extension = `.${suggestedName.split(".").pop()}`;
        const mimeType = getMimeType(suggestedName);
        pickerConfig.types = [{
            description: extension,
            accept: {[mimeType]: [extension] }
        }]
    }
    const fileHandler = await showSaveFilePicker(pickerConfig);
    return await (await fileHandler.createWritable()).getWriter();
}

export function formatSize(bytes, decimals = 1) {
    if (bytes === 0) return '0 Bytes';
    if (!bytes) return '';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


export async function getAvailableFileName(fileManager, path, originalName) {
    const extension = originalName.includes(".") ? originalName.split(".").pop() : "";
    const baseName = originalName.includes(".") ? originalName.substring(0, originalName.lastIndexOf(".")) : originalName;
    let name = baseName;
    let tryIndex = 1;
    while (await fileManager.getFile(`${path}${FILE_DELIMITER}${name}${extension ? `.${extension}` : ""}`)) {
        name = `${baseName} (${tryIndex})`;
        tryIndex++;
    }
    return name + (extension ? `.${extension}` : "");
}