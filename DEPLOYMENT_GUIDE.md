# 🚀 Guia de Separação e Deploy dos Repositórios

Este guia explica como separar o projeto monolítico em dois repositórios independentes (backend e frontend) e fazer deploy em produção.

## 📋 Pré-requisitos

- Git instalado
- Contas no GitHub/GitLab/Bitbucket
- Node.js 16.x ou superior
- MongoDB em produção
- Servidor MinIO ou AWS S3 (opcional, para upload de imagens)

---

## 🔄 Parte 1: Separação dos Repositórios

### Backend

1. **Criar novo repositório para o backend:**
```bash
cd /caminho/para/novo/diretorio
mkdir webpush-saas-backend
cd webpush-saas-backend
git init
```

2. **Copiar arquivos do backend:**
```bash
# A partir do diretório do projeto original
cp -r src/ ../webpush-saas-backend/
cp package.json ../webpush-saas-backend/
cp package-lock.json ../webpush-saas-backend/ 2>/dev/null || true
cp .gitignore.backend ../webpush-saas-backend/.gitignore
cp .env.example.backend ../webpush-saas-backend/.env.example
cp README.backend.md ../webpush-saas-backend/README.md
```

3. **Configurar o repositório:**
```bash
cd ../webpush-saas-backend
git add .
git commit -m "Initial commit: Backend separation"
git branch -M main
git remote add origin https://github.com/seu-usuario/webpush-saas-backend.git
git push -u origin main
```

### Frontend

1. **Criar novo repositório para o frontend:**
```bash
cd /caminho/para/novo/diretorio
mkdir webpush-saas-frontend
cd webpush-saas-frontend
git init
```

2. **Copiar arquivos do frontend:**
```bash
# A partir do diretório do projeto original
cp -r frontend/* ../webpush-saas-frontend/
cp DEPLOYMENT_GUIDE.md ../webpush-saas-frontend/ 2>/dev/null || true
```

3. **Configurar o repositório:**
```bash
cd ../webpush-saas-frontend
git add .
git commit -m "Initial commit: Frontend separation"
git branch -M main
git remote add origin https://github.com/seu-usuario/webpush-saas-frontend.git
git push -u origin main
```

---

## 🔧 Parte 2: Configuração para Produção

### Backend

1. **Configurar variáveis de ambiente:**
```bash
cp .env.example .env
nano .env
```

Preencha todas as variáveis:
```env
NODE_ENV=production
PORT=3000
API_URL=https://api.seu-dominio.com
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/database
JWT_SECRET=$(openssl rand -base64 32)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
CORS_ORIGIN=https://app.seu-dominio.com
```

2. **Gerar chaves VAPID:**
```bash
npx web-push generate-vapid-keys
```

3. **Instalar dependências:**
```bash
npm install --production
```

### Frontend

1. **Configurar variáveis de ambiente:**
```bash
cp .env.example .env
nano .env
```

```env
REACT_APP_API_URL=https://api.seu-dominio.com/api
NODE_ENV=production
```

2. **Instalar dependências:**
```bash
npm install
```

3. **Criar build de produção:**
```bash
npm run build
```

---

## 🌐 Parte 3: Deploy

### Opção 1: Deploy com Docker

#### Backend Dockerfile

Criar `Dockerfile` no backend:
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "src/server.js"]
```

#### Frontend Dockerfile

Criar `Dockerfile` no frontend:
```dockerfile
FROM node:16-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: ./webpush-saas-backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped

  frontend:
    build: ./webpush-saas-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### Opção 2: Deploy em VPS (Ubuntu/Debian)

#### Backend

1. **Instalar PM2:**
```bash
npm install -g pm2
```

2. **Iniciar aplicação:**
```bash
pm2 start src/server.js --name webpush-backend
pm2 save
pm2 startup
```

3. **Configurar Nginx como reverse proxy:**
```nginx
server {
    listen 80;
    server_name api.seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### Frontend

1. **Build da aplicação:**
```bash
npm run build
```

2. **Configurar Nginx:**
```nginx
server {
    listen 80;
    server_name app.seu-dominio.com;
    root /var/www/frontend/build;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass https://api.seu-dominio.com;
    }
}
```

3. **Copiar arquivos:**
```bash
sudo mkdir -p /var/www/frontend
sudo cp -r build/* /var/www/frontend/build/
```

### Opção 3: Deploy em Serviços Cloud

#### Backend - Render/Railway/Heroku

1. Conecte seu repositório GitHub
2. Configure variáveis de ambiente no painel
3. Deploy automático a cada push

#### Frontend - Vercel/Netlify

1. Conecte seu repositório GitHub
2. Configure build command: `npm run build`
3. Configure output directory: `build`
4. Adicione variável: `REACT_APP_API_URL`
5. Deploy automático

---

## 🔒 Parte 4: Configuração SSL (HTTPS)

### Com Certbot (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.seu-dominio.com -d app.seu-dominio.com
```

---

## ✅ Parte 5: Checklist Pós-Deploy

### Backend
- [ ] Variáveis de ambiente configuradas
- [ ] MongoDB acessível
- [ ] Chaves VAPID geradas
- [ ] CORS configurado corretamente
- [ ] SSL/HTTPS ativo
- [ ] Logs funcionando
- [ ] PM2/Docker rodando

### Frontend
- [ ] Build gerado sem erros
- [ ] API_URL apontando para backend
- [ ] Service Worker registrado
- [ ] HTTPS ativo
- [ ] Testes de notificações OK

### Testes
- [ ] Login funciona
- [ ] Criação de tenant funciona
- [ ] Criação de opt-in link funciona
- [ ] Página de opt-in carrega e permite inscrição
- [ ] Notificações são recebidas
- [ ] Dashboard exibe métricas

---

## 🔄 Parte 6: Atualizações Futuras

### Backend

```bash
cd webpush-saas-backend
git pull origin main
npm install
pm2 restart webpush-backend
```

### Frontend

```bash
cd webpush-saas-frontend
git pull origin main
npm install
npm run build
sudo cp -r build/* /var/www/frontend/build/
```

---

## 🐛 Troubleshooting

### Backend não inicia
- Verificar logs: `pm2 logs webpush-backend`
- Verificar conexão MongoDB
- Verificar variáveis de ambiente

### Frontend mostra erro de API
- Verificar REACT_APP_API_URL no .env
- Verificar CORS no backend
- Verificar se backend está rodando

### Push notifications não funcionam
- Verificar se HTTPS está ativo
- Verificar chaves VAPID
- Verificar registro do Service Worker no console

---

## 📞 Suporte

Em caso de dúvidas, consulte os READMEs individuais de cada repositório ou abra uma issue no GitHub.
