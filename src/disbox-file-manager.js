/*global chrome*/
import { sha256 } from 'js-sha256';

const SERVER_URL = 'https://disbox-server.fly.dev';
export const FILE_DELIMITER = '/';
const FILE_CHUNK_SIZE = 25 * 1024 * 1023 // Almost 25MB

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function* readFile(file, chunkSize) {
    var fileSize = file.size;
    var offset = 0;


    while (offset < fileSize) {
        var blob = file.slice(offset, offset + chunkSize);
        yield await blob.arrayBuffer();
        offset += chunkSize;

    }
}

async function fetchUrlFromExtension(url) {
    return new Promise((resolve, reject) => {
        try {
            chrome.runtime.sendMessage("jklpfhklkhbfgeencifbmkoiaokeieah", { message: {url: url } }, response => {
                if (!response || !("data" in response)) {
                    resolve(null);
                }
                resolve(response.data);

            });
        } catch {
            resolve(null);
        }
    });
}

async function fetchUrlFromProxy(url) {
    return await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);  
}

async function fetchUrl(url) {
    const extensionResult = await fetchUrlFromExtension(url);
    if (extensionResult !== null) {
        return await (await fetch(extensionResult)).blob();
    }
    return await (await fetchUrlFromProxy(url)).blob();
}


export async function downloadFromAttachmentUrls(attachmentUrls, writeStream, onProgress = null, fileSize=-1) {
    let bytesDownloaded = 0;
    if (onProgress) { 
        onProgress (0, fileSize);
    }
    for (let attachmentUrl of attachmentUrls) {
        const blob = await fetchUrl(attachmentUrl);
        await writeStream.write(blob);
        bytesDownloaded += blob.size;
        if (onProgress) {
            onProgress(bytesDownloaded, fileSize);
        }
    }

    await writeStream.close();
}

class DiscordWebhookClient {
    constructor(webhookUrl) {
        const id = webhookUrl.split('/').slice(0, -1).pop();
        const token = webhookUrl.split('/').pop();
        this.baseUrl = `https://discordapp.com/api/webhooks/${id}/${token}`;
        this.rateLimitWaits = {};
    }

    async fetchFromApi(path, {type, method, body}) {
        if (this.rateLimitWaits[type] > 0) {
            console.log(`Waiting ${this.rateLimitWaits[type]}ms for rate limit to reset`)
            await sleep(this.rateLimitWaits[type]);
        }
        const response = await fetch(`${this.baseUrl}${path}`, {
            method: method,
            body: body,
        });
        const headers = response.headers;
        const remainingRequests = Number(headers.get("X-RateLimit-Remaining"));
        const resetAfter = Number(headers.get("X-RateLimit-Reset-After"));
        this.rateLimitWaits[type] = remainingRequests === 0 ? resetAfter * 1000 : 0;

        const status = response.status;
        if (status === 429) {
            const responseJson = await response.json();
            const retryAfter = responseJson.retry_after;
            this.rateLimitWaits[type] = (retryAfter) * 1000;
            console.log("Rate limit exceeded, retrying");
            return await this.fetchFromApi(path, {method, body, type});
        }
        if (status >= 400) {
            throw new Error(`Failed to ${type} with status ${status}: ${await response.text()}`);
        }
        return response;
    }

    async sendAttachment(filename, blob) {
        const formData = new FormData();
        formData.append('payload_json', JSON.stringify({}));
        formData.append('file', blob, filename);
        const response = await this.fetchFromApi("?wait=true", {
            type: "sendAttachment",
            method: 'POST',
            body: formData,
        });
        return await response.json();
    }

    async getMessage(id) {
        const response = await this.fetchFromApi(`/messages/${id}`, {
            type: "getMessage",
            method: 'GET',
        });
        return await response.json();
    }

    async deleteMessage(id) {
        await this.fetchFromApi(`/messages/${id}`, {
            type: "deleteMessage",
            method: 'DELETE',
        });
    }

}

class DiscordFileStorage {
    constructor(webhookUrl) {
        this.webhookClient = new DiscordWebhookClient(webhookUrl);
    }

    async getAttachmentUrls(messageIds) {
        const attachmentUrls = [];
        for (let id of messageIds) {
            const message = await this.webhookClient.getMessage(id);
            const url = message.attachments[0].url;
            attachmentUrls.push(url);
        }
        return attachmentUrls;
    }

    async upload(sourceFile, namePrefix, onProgress = null) {
        const messageIds = [];
        let uploadedBytes = 0;
        let index = 0;
        if (onProgress) {
            onProgress(0, sourceFile.size);
        }
        for await (const chunk of readFile(sourceFile, FILE_CHUNK_SIZE)) {
            const result = await this.webhookClient.sendAttachment(`${namePrefix}_${index}`, new Blob([chunk]));
            messageIds.push(result.id);
            uploadedBytes += chunk.byteLength;
            index++;
            if (onProgress) {
                onProgress(uploadedBytes, sourceFile.size);
            }
        }
        return messageIds;
    }


    async download(messageIds, writeStream, onProgress = null, fileSize=-1) {
        const attachmentUrls = await this.getAttachmentUrls(messageIds);
        await downloadFromAttachmentUrls(attachmentUrls, writeStream, onProgress, fileSize);
    }

    async delete(messageIds, onProgress) {
        let chunksDeleted = 0;
        if (onProgress) {
            onProgress(0, messageIds.length);
        }
        for (let id of messageIds) {
            await this.webhookClient.deleteMessage(id);
            chunksDeleted++;
            if (onProgress) {
                onProgress(chunksDeleted, messageIds.length);
            }
        }
    }
}


class DisboxFileManager {
    static async create(webhookUrl) {
        const url = new URL(webhookUrl);
        let fileTrees = {};

        // Handle Discord changing webhook URLs
        for (const hostname of ["discord.com", "discordapp.com"]) {
            url.hostname = hostname;
            const result = await fetch(`${SERVER_URL}/files/get/${sha256(url.href)}`);
            if (result.status === 200) {
                fileTrees[url.href] = await result.json();
            }
        }
        if (fileTrees.length === 0) {
            throw new Error(`Failed to get files for user.`);
        }

        // If one of them has entries, choose it no matter what the entered URL was.
        const [chosenUrl, fileTree] = Object.entries(fileTrees).sort((f1, f2) => f2[1].length - f1[1].length)[0];

        return new this(sha256(chosenUrl), new DiscordFileStorage(webhookUrl), fileTree);
    }

    constructor(userId, storage, fileTree) {
        this.userId = userId;
        this.discordFileStorage = storage;
        this.fileTree = fileTree;
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
        return file;
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
        delete parent.children[file.name];
        parent.children[changes.name] = changes;

        return this.getFile(newPath);
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
        const changes = await this.updateFile(file.path, { parent_id: newParent.id });

        delete parent.children[file.name];
        newParent.children[file.name] = file;
        return changes;
    }

    // TODO: Delete a non-empty directory?
    async deleteFile(path, onProgress) {
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
        if (file.type === 'file' && file.content) {
            await this.discordFileStorage.delete(JSON.parse(file.content), onProgress);
            const parent = this.getParent(path);
            delete parent.children[file.name];
            return await result.json();
        }
        if (onProgress) {
            onProgress(1, 1);
        }
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

    async uploadFile(path, fileBlob, onProgress) {
        let file = this.getFile(path);
        if (!file) {
            await this.createFile(path);
            file = this.getFile(path);
        }
        if (file.type === 'directory') {
            throw new Error(`Directory can't have content: ${path}`);
        }
        const contentReferences = await this.discordFileStorage.upload(fileBlob, file.id, onProgress);
        await this.updateFile(file.path, { size: fileBlob.size, content: JSON.stringify(contentReferences) });

        if (onProgress) {
            onProgress(1, 1);
        }
        return file;
    }

    async downloadFile(path, writeStream, onProgress) {
        const file = this.getFile(path);
        if (!file) {
            throw new Error(`File not found: ${path}`);
        }
        if (file.type === 'directory') {
            throw new Error(`Cannot download content from directory: ${path}`);
        }

        const contentReferences = JSON.parse(file.content);
        await this.discordFileStorage.download(contentReferences, writeStream, onProgress, file.size);

        if (onProgress) { // Reconsider this
            onProgress(1, 1);
        }
    }

    async getAttachmentUrls(path) {
        const file = this.getFile(path);
        if (!file) {
            throw new Error(`File not found: ${path}`);
        }
        if (file.type === 'directory') {
            throw new Error(`Cannot share directory: ${path}`);
        }

        const contentReferences = JSON.parse(file.content);
        return await this.discordFileStorage.getAttachmentUrls(contentReferences);
    }

}

export default DisboxFileManager;


