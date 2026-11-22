import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import App from './app/App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register PWA Service Worker for mobile installability and offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[Odyssey PWA] Service worker registered:', reg.scope);
      })
      .catch((error) => {
        console.error('[Odyssey PWA] Service worker registration failed:', error);
      });
  });
}

