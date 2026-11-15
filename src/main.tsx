import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Auto-update service worker
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Nueva versión disponible en Service Worker');
  },
  onOfflineReady() {
    console.log('App lista para trabajar 100% Offline');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
