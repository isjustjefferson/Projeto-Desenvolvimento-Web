import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChamadosProvider } from './context/ChamadosContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ChamadosProvider>
          <App />
        </ChamadosProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
