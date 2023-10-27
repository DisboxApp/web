import React from 'react';
import { EXTENSION_URL } from './file-utils';

function AlertExtension({ showExtensionDialog, setShowExtensionDialog }) {
  return (
    <div
      className={
        showExtensionDialog
          ? 'm-2 flex-col rounded-lg bg-yellow-500 p-2'
          : 'hidden'
      }
    >
      <div className='flex w-full'>
        Disbox recommends using the official Disbox chrome extension for better
        download speeds and increased security.
      </div>
      <div className='flex w-full justify-end pr-5'>
        <button
          className='rounded-lg bg-blue-500 px-2 py-1 text-lg font-bold text-white hover:bg-blue-700'
          onClick={() => {
            window.open(EXTENSION_URL);
          }}
        >
          Install
        </button>
        <button
          className='ml-2 rounded-lg bg-red-500 px-2 py-1 text-lg font-bold text-white hover:bg-red-700'
          onClick={() => {
            setShowExtensionDialog(false);
          }}
        >
          Later
        </button>
      </div>
    </div>
  );
}

export default AlertExtension;
