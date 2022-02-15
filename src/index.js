import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Home from './Home';
import Setup from './Setup';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.css';
import { RecoilRoot } from 'recoil';
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";


function HomeOrApp() {
  if (localStorage.getItem("webhookUrl") === null) {
    return <Home />
  } else {
    return <App />
  }
}

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter basename='/web'>
      <Routes>
        {/* <Route path="/" element={<App />} /> */}
        <Route path="" element={<HomeOrApp />}/>
        <Route path="web/home" element={<Home />}/>
        <Route path="setup" element={<Setup />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
