import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-500-italic.css';
import App from './App';
import './styles/theme.css';
import './styles/global.css';
import bodyFont from '@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2?url';
import displayFont from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff2?url';
import italicFont from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2?url';

for (const href of [bodyFont, displayFont, italicFont]) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = 'font/woff2';
  link.crossOrigin = 'anonymous';
  link.href = href;
  document.head.appendChild(link);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>,
);
