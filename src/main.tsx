import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';

// 完全禁用 Service Worker 注册，避免开发环境的问题
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister().then(() => {
          console.log('ServiceWorker unregistered');
        });
      });
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <App />
);
