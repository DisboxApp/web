import { LinearProgress, linearProgressClasses, styled } from '@mui/material';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import { downloadFromAttachmentUrls } from './disbox-file-manager';
import { formatSize, pickLocationAsWritable } from './file-utils.js';
import AlertDownloading from './AlertDownloading';
import AlertExtension from './AlertExtension';

const BorderLinearProgress = styled(LinearProgress)(({}) => ({
  height: 20,
  borderRadius: 5,
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 5,
  },
}));

function File() {
  const [searchParams] = useSearchParams();
  const [progressValue, setProgressValue] = useState(-1);
  const [currentlyDownloading, setCurrentlyDownloading] = useState(false);
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);
  const [savePickerAvailable, setSavePickerAvailable] = useState(false);

  const onProgress = (value, total) => {
    const percentage = Number(Math.round((value / total) * 100).toFixed(0));
    setProgressValue(percentage);
    if (percentage === 100) {
      setTimeout(() => {
        setCurrentlyDownloading(false);
        setProgressValue(0);
      }, 1500);
    }
  };

  async function download() {
    const fileName = searchParams.get('name');
    let base64AttachmentUrls = searchParams.get('attachmentUrls');
    base64AttachmentUrls = base64AttachmentUrls
      .replace(/~/g, '+')
      .replace(/_/g, '/')
      .replace(/-/g, '=');
    const attachmentUrls = atob(base64AttachmentUrls);
    const attachmentUrlsArray = JSON.parse(attachmentUrls);

    const writable = await pickLocationAsWritable(fileName);
    setCurrentlyDownloading(true);
    setProgressValue(0);
    await downloadFromAttachmentUrls(
      attachmentUrlsArray,
      writable,
      onProgress,
      searchParams.get('size'),
    );
  }

  useEffect(() => {
    try {
      chrome?.runtime.sendMessage(
        'jklpfhklkhbfgeencifbmkoiaokeieah',
        { message: {} },
        (response) => {
          if (!response || !response.installed) {
            setShowExtensionDialog(true);
          }
        },
      );
    } catch {
      setShowExtensionDialog(true);
    }
    setSavePickerAvailable(!!window.showSaveFilePicker);
  }, []);

  return searchParams.get('name') !== null &&
    searchParams.get('attachmentUrls') !== null &&
    searchParams.get('size') !== null ? (
    <div className='pb-4'>
      <Helmet>
        <title> {searchParams.get('name')}</title>
        <meta name='description' content='Shared from Disbox' />
      </Helmet>
      <div className='w-full flex-col justify-center bg-gray-800 py-8'>
        <span className='flex justify-center text-center text-3xl font-bold text-white'>
          File Shared from Disbox
        </span>
      </div>
      <AlertDownloading savePickerAvailable={savePickerAvailable} />
      <AlertExtension
        showExtensionDialog={showExtensionDialog}
        setShowExtensionDialog={setShowExtensionDialog}
      />
      <div className='w-full flex-col items-center justify-center px-4 pt-2'>
        <div className=''>{searchParams.get('name')}</div>
        <div className='pb-2'>{formatSize(searchParams.get('size'))}</div>
        <div className='flex w-full items-center justify-center'>
          <button
            type='submit'
            className='rounded-lg bg-blue-500 px-2 py-1 text-lg font-bold text-white hover:bg-blue-700'
            onClick={download}
            disabled={!savePickerAvailable}
          >
            Download
          </button>
        </div>
        {currentlyDownloading && (
          <>
            <div className='pt-4'>
              <BorderLinearProgress
                variant='determinate'
                value={progressValue}
              />
            </div>
            <div className='flex w-full items-center justify-center pt-4'>
              <span className='text-center text-2xl font-bold text-black'>
                Downloading...
              </span>
            </div>
          </>
        )}

        {!currentlyDownloading && progressValue !== -1 && (
          <div className='flex w-full items-center justify-center pt-4'>
            <span className='text-center text-2xl font-bold text-black'>
              Download complete
            </span>
          </div>
        )}
      </div>
    </div>
  ) : (
    <div
      className='App App-header'
      style={{ color: 'red', justifyContent: 'center', height: '100vh' }}
    >
      <h1 style={{ fontSize: '2rem' }}>
        <b>Oops, something went wrong.</b>
      </h1>
    </div>
  );
}

export default File;
