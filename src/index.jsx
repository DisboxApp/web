import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import File from './File';
import Home from './Home';
import './index.css';
import Setup from './Setup';
import NavigationBar from './NavigationBar';

const container = document.getElementById('root');
const root = createRoot(container);

function HomeOrApp() {
  if (localStorage.getItem('webhookUrl') === null) {
    return <Home />;
  } else {
    return <App />;
  }
}

root.render(
  <React.StrictMode>
    <BrowserRouter basename={'/web'}>
      <NavigationBar />
      <Routes>
        {/* <Route path="/" element={<App />} /> */}
        <Route path='/' element={<HomeOrApp />} />
        <Route path='home' element={<Home />} />
        <Route path='setup' element={<Setup />} />
        <Route path='file' element={<File />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
