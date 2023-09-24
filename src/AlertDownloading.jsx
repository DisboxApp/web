import React from 'react';

function AlertDownloading({ savePickerAvailable }) {
  return (
    <div
      className={
        savePickerAvailable ? `hidden` : `m-2 flex rounded-lg bg-red-600 p-2`
      }
    >
      File Saving Not Supported on your device
    </div>
  );
}

export default AlertDownloading;
