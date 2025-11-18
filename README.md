# WebPush SaaS Platform - Frontend

Interface web para plataforma SaaS de notificações push.

## 🚀 Tecnologias

- **React** - Biblioteca JavaScript para interfaces
- **Material-UI (MUI)** - Componentes UI
- **React Router** - Roteamento
- **Axios** - Cliente HTTP
- **Notistack** - Notificações toast
- **date-fns** - Manipulação de datas
- **Service Worker** - Push notifications

## 📋 Pré-requisitos

- Node.js 16.x ou superior
- npm ou yarn

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/webpush-saas-frontend.git
cd webpush-saas-frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com a URL do seu backend
```

## 🎯 Configuração

### Variáveis de Ambiente

Edite o arquivo `.env`:

```env
REACT_APP_API_URL=https://seu-backend.com/api
NODE_ENV=production
```

## 🚀 Executando

### Desenvolvimento
```bash
npm start
```

A aplicação estará disponível em `http://localhost:3001`

### Build para Produção
```bash
npm run build
```

Os arquivos otimizados estarão na pasta `build/`

## 📁 Estrutura do Projeto

```
src/
├── components/      # Componentes React
│   ├── admin/      # Componentes administrativos
│   ├── tenant/     # Componentes de tenant
│   └── Layout.jsx  # Layout principal
├── pages/          # Páginas da aplicação
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx
│   └── OptInPage.jsx  # Página pública de opt-in
├── services/       # Serviços e APIs
│   └── api.js     # Cliente axios configurado
├── contexts/       # Contexts do React
│   └── AuthContext.jsx
├── routes/         # Configuração de rotas
└── public/
    └── sw.js      # Service Worker para push notifications
```

## 🔐 Autenticação

A aplicação utiliza JWT armazenado no localStorage. O token é automaticamente incluído em todas as requisições através do interceptor do Axios.

## 📱 Funcionalidades Principais

### Para Tenants
- **Dashboard** - Visão geral de métricas
- **Links de Opt-in** - Criar e gerenciar links personalizados
- **Clientes** - Visualizar e gerenciar base de clientes
- **Notificações** - Enviar notificações push
- **Créditos** - Gerenciar créditos de envio

### Para Administradores
- **Tenants** - Gerenciar tenants
- **Usuários** - Gerenciar usuários
- **Logs de Auditoria** - Visualizar logs do sistema

### Páginas Públicas
- **Opt-in Page** - Página customizável para opt-in de clientes

## 🎨 Personalização

### Service Worker (Push Notifications)

O arquivo `public/sw.js` gerencia as notificações push. Personalize conforme necessário:

```javascript
self.addEventListener('push', function(event) {
  const data = event.data.json();
  const options = {
    body: data.message,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-96x96.png',
    data: data.data
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
```

## 📦 Deploy

### Vercel
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
npm run build
# Faça upload da pasta build/ no Netlify
```

### Nginx
```bash
npm run build
# Copie os arquivos de build/ para /var/www/html
```

Configuração Nginx:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass https://seu-backend.com;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Docker
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

## 🔧 Scripts Disponíveis

- `npm start` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm test` - Executa testes
- `npm run eject` - Ejeta configuração do Create React App

## 🌐 Suporte a Navegadores

- Chrome/Edge (últimas 2 versões)
- Firefox (últimas 2 versões)
- Safari (últimas 2 versões)

**Nota**: Push notifications requerem HTTPS em produção

## 📝 Licença

Este projeto está sob a licença MIT.
