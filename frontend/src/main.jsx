import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: '16px',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          boxShadow: '0 18px 60px rgba(15, 23, 42, 0.16)'
        }
      }}
    />
  </React.StrictMode>
);
