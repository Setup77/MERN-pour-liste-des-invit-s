import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Toaster } from "react-hot-toast";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";



const root = ReactDOM.createRoot(document.getElementById('root')); // lié react au index.html public
root.render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>
);
