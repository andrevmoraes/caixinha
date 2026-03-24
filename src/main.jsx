import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './index.css';
import App from './App.jsx';

// Garantir que tema escuro está desativado
document.documentElement.classList.remove('dark');

// Desabilitar zoom completamente
let lastTouchTime = 0;
document.addEventListener(
  'touchend',
  (e) => {
    const currentTime = new Date().getTime();
    const timeSinceLastTouch = currentTime - lastTouchTime;
    lastTouchTime = currentTime;

    // Prevenir double-tap zoom
    if (timeSinceLastTouch < 500 && timeSinceLastTouch > 0) {
      e.preventDefault();
    }
  },
  false
);

// Prevenir pinch zoom
document.addEventListener(
  'touchmove',
  (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  },
  { passive: false }
);

// Prevenir zoom via wheel + ctrl
document.addEventListener(
  'wheel',
  (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  },
  { passive: false }
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  </StrictMode>,
);

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('Service Worker registrado com sucesso:', reg);
      })
      .catch((error) => {
        console.log('Erro ao registrar Service Worker:', error);
      });
  });
}
