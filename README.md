# Disbox Web Client

### Try Disbox here: https://disboxapp.github.io/web

This is the web client for the Disbox project.

Disbox is a cloud storage service that stores your files on discord. It bypasses the file size limit by splitting files into chunks, and wraps everything in a virtual file system.

Using Discord allows for easy and secure logins, fast uploads and downloads, multiple drives, and easy access management.

# Features

| Feature                    | Support                  | UI                                    | JavaScript API                                        |
|----------------------------|--------------------------|---------------------------------------|-------------------------------------------------------|
| Login using Webhook URL    | ✅                        | Setup page                            | `new DisboxFileManager(webhookUrl)`                               |
| Upload files               | ✅                        | "Upload file" button                  | `uploadFile(path, file, onProgress)`                  |
| Create folders             | ✅                        | "New folder" button                   | `createDirectory(path)`                               |
| Download files             | ✅                        | "Download" column                     | `downloadFile(path, fileSystemWritable, onProgress)`  |
| Share files             | ✅                        | "Share" column                     | `getAttachmentUrls(path)`  |
| Delete files/empty folders | ✅                        | "Delete" column                       | `deleteFile(path, onProgress)`                        |
| Rename                     | ✅                        | Double-click name column             | `renameFile(path, newName)`                           |
| Show folder                | ✅                        | Double-click row (except name column) | `getChildren(path)`                                   |
| Sort              | ✅ UI Only                | Click column header                  | -                                                     |
| Filter              | ✅ UI Only                | Click 3 dots on column headers                  | -                                                     |
| Search                     | ✅ UI Only                | Search bar                            | -                                                     |
| File icons      | ✅ UI Only             | On the left of the file name                                     | -                                                     |
| Move                       | ⚠️ Coming soon | -                                     | `moveFile(path, newParentPath)` (Untested)            |
| Edit files                 | ⚠️ Coming soon | -                                     | `uploadFile(path, file, onProgress)` (Untested)       |
| Right-click menu      | ❌Coming soon (UI Only)   | -                                     | -                                                     |
| Mobile      | ❌Coming soon (UI Only)   | -                                     | -                                                     |
| Delete non-empty folders   | ❌                        | -                                     | -                                                     |
| Upload folders             | ❌                        | -                                     | -                                                     |
| Download folders           | ❌                        | -                                     | -                                                     |

...And more!

Suggestions and contributions are welcome!

# How it works

In essence, Disbox simply takes your upload files, and splits them to fit in Discord's (25MB) file size limit. It then stores metadata about the file like the file name and path in a separate central database. This allows for a simple way to manage your files and download them back as one chunk.

## Technical Details

This section will include techincal details about how Disbox is implemented. It exists to help understand why Disbox does requires certain things and what are it's limitations. 
It also includes challenges in implementing a project like this, for people who are interested.

### Database

Disbox's database only stores file metadata, and the message IDs that contain the attachments for the files. Disbox uses webhook URLs as accounts, which are hashed on the client side. This means that even though disbox has the message ID, it can't access the message itself - so it can't access any of your files.

### Discord API

#### Webhooks

There are 2 main ways to implement this project:
- Bots: bots have a lot of permissions, and can eliminate the need for a database, storing everything, even metadata, on Discord itself. This is not recommended for 2 reasons:
    - Storing the metadata on Discord itself would make fetching the file system a much slower process.
    - It requires every user to create a bot account, which is a hassle, and makes using Disbox a lot more difficult.
- Webhooks: While webhooks have very minimal permissions, they are very easy to create. This is the main reason Disbox uses webhooks and not bots.

#### CORS

As with any secure site, discord doesn't allow other websites to fetch and download data from the API programmatically. This is a big issue, because it blocks the ability to download your files from the web client directly.

There are 2 main ways to solve this, and because both are viable and fit for different use cases, Disbox implements both.

- Proxy: All downloaded are forwarded to an external proxy, which downloads the files and sends them back to the client. Disbox uses the [allOrigins](https://allorigins.win) proxy for this. This option is less secure as it exposes your data to the proxy. It also decreases download speeds as the proxy's server may be slower than Discord' servers.

- Browser extension: Instead of forwarding the requests to an external source, Disbox uses an extension to download the files. This is the recommended option, but it requires a browser extension to be installed by every user, which is not always an option.
