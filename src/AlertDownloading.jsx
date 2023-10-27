import React from 'react';

function AlertDownloading({ savePickerAvailable }) {
  return (
    <div
      className={
        savePickerAvailable == false
          ? `m-2 flex rounded-lg bg-red-600 p-2`
          : `hidden`
      }
    >
      File Saving Not Supported on your device
    </div>
  );
}

export default AlertDownloading;
