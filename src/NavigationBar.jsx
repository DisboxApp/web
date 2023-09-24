import { Link } from 'react-router-dom';

export default function NavigationBar() {
  return (
    <nav>
      <div className='flex h-16 w-full bg-gray-950 px-2'>
        <div className='grid h-16 w-full grid-cols-6 grid-rows-2 justify-between'>
          <div className='flex h-16 items-center justify-center font-bold text-white'>
            <Link to={'/'}>Disbox</Link>
          </div>
          <div className='flex h-16 items-center justify-center text-white'>
            <Link to={'/home'}>Home</Link>
          </div>
          <div className='flex h-16 items-center justify-center text-white'>
            <Link to={'/setup'}>Setup</Link>
          </div>
          <div className='flex h-16 items-center justify-center text-white'></div>
          <div className='flex h-16 items-center justify-center text-white'>
            <a
              href='https://github.com/DisboxApp/web'
              target='_blank'
              rel='noreferrer'
            >
              Source
            </a>
          </div>
          <div className='flex h-16 items-center justify-center text-white'>
            <a
              href='https://github.com/DisboxApp/web/issues'
              target='_blank'
              rel='noreferrer'
            >
              Problems
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
