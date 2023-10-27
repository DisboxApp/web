import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className=''>
      <div className='w-full flex-col bg-gray-800 py-32'>
        <div className='flex w-full justify-center'>
          <span className='text-3xl font-bold text-white'>Disbox</span>
        </div>
        <div className='flex w-full justify-center'>
          <span className='text-xl font-bold text-white'>
            Free, fast, unlimited cloud storage.
          </span>
        </div>
        <div className='mt-10 flex w-full justify-center'>
          <button
            className='rounded-full bg-blue-500 px-4 py-2 text-lg font-bold text-white hover:bg-blue-700'
            onClick={() => {
              navigate('/setup');
            }}
          >
            Start using
          </button>
          <button
            className='ml-5 rounded-full bg-blue-500 px-4 py-2 text-lg font-bold text-gray-800 hover:bg-blue-700'
            onClick={() => {
              window.open('https://github.com/DisboxApp/web');
            }}
          >
            Find out more
          </button>
        </div>
      </div>

      <div className='m-4 grid grid-cols-1 grid-rows-1 gap-4 md:grid-cols-2 lg:grid-cols-5 '>
        <div className='bg-gray-700 p-4'>
          <span className='w-full text-3xl font-bold text-white'>Free</span>
          <span className='text-sm font-bold text-gray-400'>
            {' '}
            As free as it gets. No ads, no subscriptions, and no fees. All of
            our features are free to use, forever.
          </span>
        </div>

        <div className='bg-gray-700 p-4'>
          <div className='w-full flex-col justify-center'>
            <span className='w-full text-3xl font-bold text-white'>Fast</span>
            <span className='text-sm font-bold text-gray-400'>
              {' '}
              Extremely high upload and download speeds and fast load times.
              Upload files of any size, and download them instantly.
            </span>
          </div>
        </div>
        <div className='bg-gray-700 p-4'>
          <div className='w-full flex-col justify-center'>
            <span className='w-full text-3xl font-bold text-white'>
              Unlimited
            </span>
            <span className='text-sm font-bold text-gray-400'>
              {' '}
              No limits. Upload as many files as you want with no storage limit.
              Movies, music, images, backups, everything.
            </span>
          </div>
        </div>
        <div className='bg-gray-700 p-4'>
          <div className='w-full flex-col justify-center'>
            <span className='w-full text-3xl font-bold text-white'>Simple</span>
            <span className='text-sm font-bold text-gray-400'>
              {' '}
              Just a discord account required. No email, no registration, no
              passwords, everything is tied to your Discord account.
            </span>
          </div>
        </div>
        <div className='bg-gray-700 p-4'>
          <div className='w-full flex-col justify-center'>
            <span className='w-full text-3xl font-bold text-white'>Secure</span>
            <span className='text-sm font-bold text-gray-400'>
              {' '}
              All your files are stored on Discord's servers, and we have no
              access to them - we only store file metadata. Everything is open
              source and available on GitHub.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
