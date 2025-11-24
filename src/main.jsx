import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SnackbarProvider } from 'notistack'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import logger from './utils/logger'
import './index.css'

// Inicializar logs
logger.init();

// Log de erros globais
window.addEventListener('error', (event) => {
  logger.error('Global Error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled Promise Rejection:', event.reason);
});

// Log de inicialização do React
logger.info('Inicializando React App...');

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right'
            }}
          >
            <App />
          </SnackbarProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>,
  );

  logger.success('React App inicializado com sucesso!');
} catch (error) {
  logger.error('Falha ao inicializar React App:', error);
  throw error;
}
