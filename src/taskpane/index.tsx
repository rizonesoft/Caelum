/**
 * Glide — React Entry Point
 *
 * Bootstraps React into the #root div after Office.js initializes.
 *
 * © Rizonetech (Pty) Ltd. — https://rizonesoft.com
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '../styles/global.css';

/* global Office */

Office.onReady(() => {
  const container = document.getElementById('root');
  if (!container) throw new Error('Missing #root element');
  const root = createRoot(container);
  root.render(<App />);
});
