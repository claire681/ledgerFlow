import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AIProvider } from './hooks/useAI';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AIProvider>
      <App />
    </AIProvider>
  </React.StrictMode>
);

reportWebVitals();