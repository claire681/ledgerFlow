import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// === NOVALA MOBILE RESCUE CSS ===
// Forces all elements to respect mobile viewport when screen < 768px
// This is a band-aid until each page is properly redesigned
(function injectMobileRescueCSS() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('novala-mobile-rescue')) return;
  const style = document.createElement('style');
  style.id = 'novala-mobile-rescue';
  style.textContent = `
    @media (max-width: 768px) {
      html, body, #root {
        overflow-x: hidden !important;
        max-width: 100vw !important;
      }
      body * {
        max-width: 100vw !important;
      }
      img, video, iframe, canvas, svg {
        max-width: 100% !important;
        height: auto;
      }
      /* Cap any hardcoded maxWidth that's bigger than the viewport */
      div[style*="maxWidth: 900"],
      div[style*="maxWidth: 1100"],
      div[style*="maxWidth: 1200"],
      div[style*="maxWidth: 1400"],
      div[style*="maxWidth: 580"],
      div[style*="maxWidth: 800"],
      div[style*="maxWidth:900"],
      div[style*="maxWidth:1100"],
      div[style*="maxWidth:1200"],
      div[style*="maxWidth:1400"],
      div[style*="maxWidth:580"],
      div[style*="maxWidth:800"] {
        max-width: 100% !important;
      }
      /* Force grid columns to single column on mobile */
      div[style*="gridTemplateColumns: \"1fr 1fr\""],
      div[style*="gridTemplateColumns:'1fr 1fr'"],
      div[style*="gridTemplateColumns: \"repeat(2"],
      div[style*="gridTemplateColumns:'repeat(2"],
      div[style*="gridTemplateColumns: \"repeat(3"],
      div[style*="gridTemplateColumns:'repeat(3"],
      div[style*="gridTemplateColumns: \"repeat(4"],
      div[style*="gridTemplateColumns:'repeat(4"] {
        grid-template-columns: 1fr !important;
      }
      /* Reduce padding on big sections */
      div[style*="padding: 60"], div[style*="padding:60"],
      div[style*="padding: 80"], div[style*="padding:80"],
      div[style*="padding: 100"], div[style*="padding:100"] {
        padding: 20px !important;
      }
      /* Make horizontal flex rows wrap */
      div[style*="display: \"flex\""][style*="flexDirection: \"row\""],
      div[style*="display:'flex'"][style*="flexDirection:'row'"] {
        flex-wrap: wrap !important;
      }
      /* Inputs need to be at least 16px font to prevent iOS zoom */
      input, select, textarea {
        font-size: 16px !important;
      }
      /* Tap targets minimum 40px */
      button {
        min-height: 40px;
      }
    }
  `;
  document.head.appendChild(style);
})();
// === END NOVALA MOBILE RESCUE ===



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();