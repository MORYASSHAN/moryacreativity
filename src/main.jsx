import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DefaultLoadingManager } from 'three';
import { setState } from './state.js';
import App from './App.jsx';
import './index.css';

DefaultLoadingManager.onProgress = (_, loaded, total) => setState({ progress: total ? loaded / total : 0 });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
