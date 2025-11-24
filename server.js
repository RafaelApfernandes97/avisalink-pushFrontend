const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Verificar se o diretório dist existe
const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

console.log('='.repeat(60));
console.log('🔍 VERIFICANDO ARQUIVOS');
console.log('='.repeat(60));
console.log(`📁 Diretório de trabalho: ${__dirname}`);
console.log(`📁 Diretório dist: ${distPath}`);
console.log(`📄 Index.html: ${indexPath}`);

if (fs.existsSync(distPath)) {
  console.log('✅ Diretório dist encontrado');
  const files = fs.readdirSync(distPath);
  console.log(`📦 Arquivos no dist: ${files.length}`);
  console.log(`📋 Arquivos: ${files.slice(0, 10).join(', ')}${files.length > 10 ? '...' : ''}`);
} else {
  console.error('❌ Diretório dist NÃO encontrado!');
}

if (fs.existsSync(indexPath)) {
  console.log('✅ index.html encontrado');
} else {
  console.error('❌ index.html NÃO encontrado!');
}
console.log('='.repeat(60));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} [${req.method}] ${req.url} - ${req.ip}`);
  next();
});

// Serve static files from dist directory
app.use(express.static(distPath, {
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    console.log(`📤 Servindo arquivo estático: ${path}`);
  }
}));

// Handle SPA routing - serve index.html for all routes
app.get('*', (req, res) => {
  console.log(`🔄 SPA fallback para: ${req.url}`);

  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error('❌ index.html não encontrado ao tentar servir!');
    res.status(404).send('index.html not found');
  }
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
