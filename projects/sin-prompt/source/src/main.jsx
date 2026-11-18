import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import App from './App.jsx';
import { StoreProvider } from './lib/store.jsx';
import { loadFonts } from './lib/fonts.js';
import './styles/global.css';

loadFonts();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <StoreProvider>
        <App />
      </StoreProvider>
    </MotionConfig>
  </StrictMode>,
);
