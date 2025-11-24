const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} [${req.method}] ${req.url} - ${req.ip}`);
  next();
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 INICIANDO FRONTEND - WEBPUSH SAAS');
  console.log('='.repeat(60));
  console.log(`📦 Ambiente: ${process.env.NODE_ENV || 'production'}`);
  console.log(`📍 Porta: ${PORT}`);
  console.log(`🌐 Servidor: http://localhost:${PORT}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  console.log('✅ FRONTEND RODANDO COM SUCESSO!');
  console.log('='.repeat(60));
  console.log('📡 Pronto para servir arquivos estáticos');
  console.log('🔄 SPA mode habilitado - todas rotas servem index.html');
  console.log('='.repeat(60));
  console.log('✨ Deploy realizado com sucesso! Sistema operacional.');
  console.log('='.repeat(60));
});

// Error handling
app.on('error', (error) => {
  console.error('='.repeat(60));
  console.error('❌ ERRO NO SERVIDOR FRONTEND');
  console.error('='.repeat(60));
  console.error('Erro:', error.message);
  console.error('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM recebido: encerrando servidor frontend...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT recebido: encerrando servidor frontend...');
  process.exit(0);
});
