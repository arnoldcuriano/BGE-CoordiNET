import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';
import WebFont from 'webfontloader';
import axios from 'axios';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.baseURL = '/';

WebFont.load({
  google: {
    families: ['Poppins:400,700']
  }
});

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);