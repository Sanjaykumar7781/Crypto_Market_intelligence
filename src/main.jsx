import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { CurrencyProvider } from './context/CurrencyContext.jsx';
import { WatchlistProvider } from './context/WatchlistContext.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CurrencyProvider>
        <WatchlistProvider>
          <App />
        </WatchlistProvider>
      </CurrencyProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
