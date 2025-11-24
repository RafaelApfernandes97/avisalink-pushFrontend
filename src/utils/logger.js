/**
 * Logger utility for frontend
 * Logs to console with formatted messages
 */

const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.MODE === 'production';

class Logger {
  constructor() {
    this.prefix = '[WebPush SaaS]';
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    return [`${timestamp} ${this.prefix} [${level}]:`, message, ...args];
  }

  info(message, ...args) {
    console.log(...this.formatMessage('INFO', message, ...args));
  }

  success(message, ...args) {
    console.log(...this.formatMessage('✅ SUCCESS', message, ...args));
  }

  warn(message, ...args) {
    console.warn(...this.formatMessage('⚠️  WARN', message, ...args));
  }

  error(message, ...args) {
    console.error(...this.formatMessage('❌ ERROR', message, ...args));
  }

  debug(message, ...args) {
    if (isDevelopment) {
      console.debug(...this.formatMessage('DEBUG', message, ...args));
    }
  }

  // Log de inicialização
  init() {
    console.log('='.repeat(60));
    console.log('🚀 INICIANDO FRONTEND - WEBPUSH SAAS');
    console.log('='.repeat(60));
    console.log(`📦 Ambiente: ${import.meta.env.MODE}`);
    console.log(`🌐 API URL: ${import.meta.env.VITE_API_URL}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log('='.repeat(60));

    if (isProduction) {
      console.log('✨ Frontend rodando em PRODUÇÃO');
    } else {
      console.log('🔧 Frontend rodando em DESENVOLVIMENTO');
    }
    console.log('='.repeat(60));
  }

  // Log de API request
  apiRequest(method, url, data = null) {
    this.debug(`📡 API Request: ${method.toUpperCase()} ${url}`, data);
  }

  // Log de API response
  apiResponse(method, url, status, data = null) {
    if (status >= 200 && status < 300) {
      this.debug(`✅ API Response: ${method.toUpperCase()} ${url} - ${status}`, data);
    } else {
      this.error(`❌ API Error: ${method.toUpperCase()} ${url} - ${status}`, data);
    }
  }

  // Log de navegação
  navigation(from, to) {
    this.debug(`🧭 Navigation: ${from} → ${to}`);
  }

  // Log de autenticação
  auth(action, user = null) {
    this.info(`🔐 Auth: ${action}`, user);
  }
}

export default new Logger();
