import axios from 'axios';
import logger from '../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Log da configuração inicial da API
console.log('='.repeat(60));
console.log('🔧 CONFIGURANDO AXIOS API CLIENT');
console.log('='.repeat(60));
console.log(`📡 Base URL: ${API_URL}`);
console.log(`🌐 Ambiente: ${import.meta.env.MODE}`);
console.log('='.repeat(60));

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos
});

// Request interceptor to add JWT token and log requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log da requisição
    logger.apiRequest(config.method, config.url, config.data);
    console.log(`📤 Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);

    return config;
  },
  (error) => {
    logger.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and log responses
api.interceptors.response.use(
  (response) => {
    // Log da resposta bem-sucedida
    logger.apiResponse(
      response.config.method,
      response.config.url,
      response.status,
      response.data
    );
    console.log(`📥 Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} OK`);

    return response;
  },
  (error) => {
    // Log detalhado de erro
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method;

    console.error('='.repeat(60));
    console.error(`❌ API ERROR: ${method?.toUpperCase()} ${url}`);
    console.error('='.repeat(60));
    console.error(`Status: ${status}`);
    console.error(`Message: ${error.message}`);

    if (error.response?.data) {
      console.error('Response Data:', error.response.data);
    }

    if (error.code === 'ECONNABORTED') {
      console.error('⏱️  Request Timeout');
    }

    if (error.code === 'ERR_NETWORK') {
      console.error('🌐 Network Error - Backend pode estar offline');
    }

    console.error('='.repeat(60));

    logger.apiResponse(method, url, status, error.response?.data);

    // Redirecionar para login se não autenticado
    if (status === 401) {
      logger.warn('Sessão expirada ou não autorizado. Redirecionando para login...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Log de sucesso na configuração
logger.success('Axios API Client configurado com sucesso!');

export default api;
