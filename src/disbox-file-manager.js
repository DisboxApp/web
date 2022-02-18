/*global chrome*/
import { sha256 } from 'js-sha256';


const SERVER_URL = 'https://disboxserver.herokuapp.com';
export const FILE_DELIMITER = '/';
const FILE_CHUNK_SIZE = 8 * 1000 * 999 // Almost 8MB


async function* readFile(file, chunkSize) {
    var fileSize = file.size;
    var offset = 0;


    while (offset < fileSize) {
        var blob = file.slice(offset, offset + chunkSize);
        yield await blob.arrayBuffer();
        offset += chunkSize;

    }
}


class DiscordFileStorage {
    constructor(webhookUrl) {
        this.id = webhookUrl.split('/').slice(0, -1).pop();
        this.token = webhookUrl.split('/').pop();
    }

    async sendAttachment(filename, blob) {
        const formData = new FormData();
        formData.append('payload_json', JSON.stringify({}));
        formData.append('file', blob, filename);
        const result = await fetch(`https://discordapp.com/api/webhooks/${this.id}/${this.token}`, {
            method: 'POST',
            body: formData,
        });
        return await result.json();
    }

    async getMessage(id) {
        const result = await fetch(`https://discordapp.com/api/webhooks/${this.id}/${this.token}/messages/${id}`, {
            method: 'GET',
        });
        const json = await result.json();
        console.log(json);
        return json;
    }

    async upload(sourceFile, namePrefix) {
        const messageIds = [];
        let index = 0;
        for await (const chunk of readFile(sourceFile, FILE_CHUNK_SIZE)) {
            const result = await this.sendAttachment(`${namePrefix}_${index}`, new Blob([chunk]));
            messageIds.push(result.id);
            index++;
        }
        return messageIds;
    }

    async fetchUrlFromExtension(url) {
        return new Promise((resolve, reject) => {
            try {
                chrome.runtime.sendMessage("cifapblgkjmandlgommaccjnpidakohc", { message: {url: url } }, response => {
                    if (!("data" in response)) {
                        resolve(null);
                    }
                    resolve(response.data);
    
                });
            } catch {
                resolve(null);
            }
        });
    }

    async fetchUrlFromProxy(url) {
        return await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);  
    }

    async fetchUrl(url) {
        const extensionResult = await this.fetchUrlFromExtension(url);
        console.log(extensionResult.length);
        if (extensionResult !== null) {
            return await (await fetch(extensionResult)).blob();
        }
        return await (await this.fetchUrlFromProxy(url)).blob();
    }

    async download(messageIds, suggestedName = "", onProgress = null) {
        const fileHandler = await window.showSaveFilePicker({
            suggestedName: suggestedName,
        });
        const writer = await fileHandler.createWritable();
        console.log(writer);

        let index = 0;
        for (let id of messageIds) {
            const message = await this.getMessage(id);
            console.log(message);
            const attachment = message.attachments[0];

            const blob = await this.fetchUrl(attachment.url);
            await writer.write(blob);
            console.
                index++;
            if (onProgress) {
                onProgress(index, messageIds.length);
            }
        }

        await writer.close();
    }

}



class DisboxFileManager {
    constructor(userToken) {
        this.discordFileStorage = new DiscordFileStorage(userToken);
        this.userId = sha256(userToken);
    }

    async init() {
        const result = await fetch(`${SERVER_URL}/files/get/${this.userId}`)
        if (result.status !== 200) {
            throw new Error(`Failed to get files for user.`);
        }
        const json = await result.json();
        this.fileTree = json;
    }

    getFile(path, copy = true) {
        let file = this.fileTree;
        let pathParts = path.split(FILE_DELIMITER);
        pathParts.shift(); // remove first empty part
        for (let i = 0; i < pathParts.length; i++) {
            if (file.children[pathParts[i]]) {
                file = file.children[pathParts[i]];
            } else {
                return null
            }
        }
        if (copy) {
            return { ...file, path };
        } else {
            return file;
        }
    }

    getChildren(path) {
        let children = {};
        if (path === '') {
            children = this.fileTree.children || {};
        } else {
            const file = this.getFile(path);
            if (!file) {
                throw new Error(`File not found: ${path}`);
            }
            if (file.type !== 'directory') {
                throw new Error(`File is not a directory: ${path}`);
            }
            children = file.children || {};
        }

        const parsedChildren = {};
        for (let child in children) {
            const childPath = `${path}${FILE_DELIMITER}${child}`;
            parsedChildren[child] = { ...children[child], path: childPath };
        }
        return parsedChildren
    }

    getParent(path) {
        if (!path.includes(FILE_DELIMITER)) {
            return null;
        }
        if (path.split(FILE_DELIMITER).length === 2) {
            return this.fileTree;
        }
        const parentPath = path.split(FILE_DELIMITER).slice(0, -1).join(FILE_DELIMITER);
        return this.getFile(parentPath);
    }

    async updateFile(path, changes) {
        const file = this.getFile(path, false);
        if (!file) {
            throw new Error(`File not found: ${path}`);
        }
        const id = file.id;
        if (!("updated_at" in changes)) {
            changes.updated_at = new Date().toISOString();
        }
        const result = await fetch(`${SERVER_URL}/files/update/${this.userId}/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(changes)
        });
        if (result.status !== 200) {
            throw new Error(`Error updating file: ${result.status} ${result.statusText}`);
        }
        for (let key in changes) {
            file[key] = changes[key];
        }
        return changes;
    }

    async renameFile(path, newName) {
        const file = this.getFile(path);
        if (!file) {
            throw new Error(`File not found: ${path}`);
        }
        const newPath = path.replace(file.name, newName);
        const newFile = this.getFile(newPath);
        if (newFile) {
            throw new Error(`File already exists: ${newPath}`);
        }
        const changes = await this.updateFile(file.path, { name: newName });

        const parent = this.getParent(path);
        parent.children[file.name] = undefined;
        parent.children[newName] = file;

        return changes;
    }

    async moveFile(path, newParentPath) {
        const file = this.getFile(path);
        if (!file) {
            throw new Error(`File not found: ${path}`);
        }
        const parent = this.getParent(path);
        const newParent = this.getFile(newParentPath);
        if (!newParent) {
            throw new Error(`Parent directory not found: ${newParentPath}`);
        }
        if (newParent.type !== 'directory') {
            throw new Error(`Parent is not a directory: ${newParentPath}`);
        }
        const newPath = newParentPath + FILE_DELIMITER + file.name;
        const newFile = this.getFile(newPath);
        if (newFile) {
            throw new Error(`File already exists: ${newPath}`);
        }
        const result = await this.updateFile(file.path, { parent_id: newParent.id });

        parent.children[file.name] = undefined;
        newParent.children[file.name] = file;
        return result;
    }

    // TODO: Delete a non-empty directory?
    // TODO: Also delete content
    async deleteFile(path) {
        const file = this.getFile(path);
        if (!file) {
            throw new Error(`File not found: ${path}`);
        }
        if (file.type === 'directory') {
            const children = this.getChildren(path);
            if (Object.keys(children).length > 0) {
                throw new Error(`Directory is not empty: ${path}`);
            }
        }
        const result = await fetch(`${SERVER_URL}/files/delete/${this.userId}/${file.id}`,
            {
                method: 'DELETE'
            });
        if (result.status !== 200) {
            throw new Error(`Error deleting file: ${result.status} ${result.statusText}`);
        }
        const parent = this.getParent(path);
        parent.children[file.name] = undefined;
        return await result.json();
    }

    async createDirectory(path) {
        await this.createFile(path, 'directory');
    }

    async createFile(path, type = "file") {
        const file = this.getFile(path);
        if (file) {
            throw new Error(`File already exists: ${path}`);
        }
        const name = path.split(FILE_DELIMITER).slice(-1)[0];
        const parentFile = this.getParent(path);
        console.log(parentFile);

        const extra = type === 'directory' ? { children: {} } : {};
        const newFile = {
            parent_id: parentFile.id,
            name: name,
            type: type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }

        const result = await fetch(`${SERVER_URL}/files/create/${this.userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newFile)
        });
        if (result.status !== 200) {
            throw new Error(`Error creating file: ${result.status} ${result.statusText}`);
        }
        const newFileId = Number(await result.text());
        parentFile.children[name] = { ...newFile, ...extra, id: newFileId };
        return this.getFile(path);

    }

    async uploadFile(path, fileBlob) {
        let file = this.getFile(path);
        if (!file) {
            await this.createFile(path);
            file = this.getFile(path);
        }
        if (file.type === 'directory') {
            throw new Error(`Directory can't have content: ${path}`);
        }
        const contentReferences = await this.discordFileStorage.upload(fileBlob, file.id);
        await this.updateFile(file.path, { size: fileBlob.size, content: JSON.stringify(contentReferences) });

        return file;
    }

    async downloadFile(path, onProgress) {
        const file = this.getFile(path);
        if (!file) {
            throw new Error(`File not found: ${path}`);
        }
        if (file.type === 'directory') {
            throw new Error(`Cannot download content from directory: ${path}`);
        }

        const contentReferences = JSON.parse(file.content);
        await this.discordFileStorage.download(contentReferences, file.name, onProgress);
    }

}

export default DisboxFileManager;


