import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App';
import { attachAuthHeader, getStoredToken, shouldAttachAuthHeader } from './utils/auth';

axios.interceptors.request.use((config) => {
  const token = getStoredToken();
  const url = `${config.baseURL || ''}${config.url || ''}`;
  if (!token || !shouldAttachAuthHeader(url)) {
    return config;
  }
  const existing =
    config.headers?.Authorization ||
    config.headers?.authorization ||
    (typeof config.headers?.get === 'function' ? config.headers.get('Authorization') : null);
  if (!existing) {
    attachAuthHeader(config, token);
  }
  return config;
});
//import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();

