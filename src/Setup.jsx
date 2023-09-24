import { useNavigate } from 'react-router-dom';

export default function Setup() {
  const navigate = useNavigate();

  const onContinue = (event) => {
    event.preventDefault();
    const webhookUrl = document.getElementById('webhookUrl').value;
    localStorage.setItem('webhookUrl', webhookUrl);
    navigate('/');
  };
  return (
    <div className='pb-4'>
      <div className='w-full flex-col justify-center bg-gray-800 py-4'>
        <span className='flex justify-center text-center text-3xl font-bold text-white'>
          Setup
        </span>
        <span className='flex justify-center text-center text-xl font-bold text-white'>
          Just a few steps and you're ready to go!
        </span>
      </div>
      <div className='w-full flex-col items-center justify-center px-4'>
        <ol className='align w-full list-inside list-decimal flex-col justify-center text-center'>
          <li className='p-2'>
            <span className='block w-full text-black'>
              Open a Discord account
            </span>
          </li>
          <li className='p-2'>
            <span className='block w-full text-black'>
              <span className='font-bold'>Create a new server</span>
            </span>
            <span className='block w-full text-black'>
              Don't share this server with anyone, as it will be used to store
              your files
            </span>
          </li>
          <li className='p-2'>
            <span className='block w-full text-black'>
              Open <span className='font-bold'>Server Settings</span> from the
              top left menu and select Integrations, then choose{' '}
              <span className='font-bold'>Create Webhook</span>
            </span>
          </li>
          <li className='p-2'>
            <span className='block w-full text-black'>
              Copy the URL of the webhook you just created by clicking the{' '}
              <span className='font-bold'>Copy Webhook URL button</span>
            </span>
          </li>
          <li className='p-2'>
            <span className='block w-full text-black'>
              This URL will be used as your password for the Disbox client and
              it provides full access to all your files
            </span>
            <span className='block w-full font-bold text-black'>
              So don't share it with anyone or store it anywhere.
            </span>
            <span className='block w-full text-black'>
              You can always access this URL from the Integrations menu again,
              if you forget it.
            </span>
          </li>
          <li className='p-2'>
            <span className='block w-full text-black'>
              <span className='font-bold'>Paste the URL</span> below and click{' '}
              <span className='font-bold'>Continue</span>
            </span>
          </li>
        </ol>
        <div className='w-full flex-col justify-center pt-2 text-center'>
          <form onSubmit={onContinue}>
            <input
              id='webhookUrl'
              className='mb-4 w-full rounded-full bg-gray-200 px-4 py-2 text-lg font-bold text-black hover:bg-gray-300'
              type='password'
              placeholder='Webhook URL'
            />
            <button
              className='rounded-full bg-blue-500 px-4 py-2 text-lg font-bold text-white hover:bg-blue-700'
              type='submit'
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
