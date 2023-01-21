import 'bootstrap/dist/css/bootstrap.css';
import React from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter, Route, Routes
} from "react-router-dom";
import App from './App';
import File from './File';
import Home from './Home';
import './index.css';
import reportWebVitals from './reportWebVitals';
import Setup from './Setup';

function HomeOrApp() {
  if (localStorage.getItem("webhookUrl") === null) {
    return <Home />
  } else {
    return <App />
  }
}

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter basename={'/web'}>
      <Routes>
        {/* <Route path="/" element={<App />} /> */}
        <Route path="" element={<HomeOrApp />}/>
        <Route path="home" element={<Home />}/>
        <Route path="setup" element={<Setup />} />
        <Route path="file" element={<File />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
