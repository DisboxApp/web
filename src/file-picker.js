import * as mime from 'react-native-mime-types';

export async function pickLocationAsWritable(suggestedName) {
    let pickerConfig = {
        suggestedName: suggestedName
    }
    if (suggestedName.includes(".")) {
        let extension = `.${suggestedName.split(".").pop()}`;
        const mimeType = mime.lookup(suggestedName) || 'application/octet-stream';
        console.log(extension, mimeType);
        pickerConfig.types = [{
            description: extension,
            accept: {[mimeType]: [extension] }
        }]
    }
    const fileHandler = await window.showSaveFilePicker(pickerConfig);
    return await fileHandler.createWritable();
}