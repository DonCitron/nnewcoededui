import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';
import './utils/errorLogger';

// Get the root element
const container = document.getElementById('root');
if (!container) {
  throw new Error('Failed to find the root element');
}

// Create root and render app
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);