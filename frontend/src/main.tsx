import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { DiretorioProvider } from './context/DiretorioContext';
import { ChamadosProvider } from './context/ChamadosContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <DiretorioProvider>
            <ChamadosProvider>
              <App />
            </ChamadosProvider>
          </DiretorioProvider>
        </AuthProvider>
        <Toaster richColors position="top-right" closeButton />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
