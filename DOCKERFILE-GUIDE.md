# 🐳 Guia do Dockerfile - Frontend

Este Dockerfile usa **multi-stage build** para criar uma imagem otimizada e segura.

---

## 📋 Características

### ✨ Otimizações:
- ✅ **Multi-stage build** - Imagem final menor (~150MB vs ~500MB)
- ✅ **Alpine Linux** - Base leve e segura
- ✅ **Non-root user** - Maior segurança
- ✅ **Health check** - Monitoramento automático
- ✅ **Layer caching** - Builds mais rápidos
- ✅ **Production-ready** - Apenas deps necessárias

### 🏗️ Estrutura:

```dockerfile
Stage 1 (Builder):
├─ Node 18 Alpine
├─ Instala TODAS dependências
├─ Executa npm run build
└─ Gera pasta dist/

Stage 2 (Production):
├─ Node 18 Alpine (nova imagem limpa)
├─ Instala APENAS dependências de produção
├─ Copia dist/ do Stage 1
├─ Copia server.js
└─ Executa server.js
```

---

## 🚀 Como Usar no Easypanel

### Opção 1: Deploy Automático (Recomendado)

O Easypanel detecta o Dockerfile automaticamente!

```yaml
# Configuração no Easypanel:
Source: Git
Build Method: Dockerfile (auto-detectado)
Build Context: frontend/
Build Args:
  VITE_API_URL: https://seu-backend.easypanel.host/api
Port: 3001
```

### Opção 2: Build Manual Local (Teste)

```bash
# Build local (para testar)
cd frontend

# Build com API URL
docker build \
  --build-arg VITE_API_URL=http://localhost:3000/api \
  -t webpush-frontend:latest \
  .

# Run
docker run -p 3001:3001 webpush-frontend:latest

# Testar
curl http://localhost:3001
```

---

## ⚙️ Build Arguments

### VITE_API_URL (Obrigatório)

Esta variável define a URL do backend durante o **build time**.

```bash
# Desenvolvimento
VITE_API_URL=http://localhost:3000/api

# Produção (Easypanel)
VITE_API_URL=https://seu-backend.easypanel.host/api
```

⚠️ **IMPORTANTE:**
- Esta variável é "baked" no build
- Se mudar, precisa fazer **rebuild** (restart não basta!)
- No Easypanel, configure em **Build Args**, não em Environment Variables

---

## 📊 Tamanhos Esperados

```
Stage 1 (Builder): ~600MB (temporário, descartado)
Stage 2 (Final):   ~150MB (essa vai para produção)

Comparação:
- Sem multi-stage: ~500-800MB
- Com multi-stage: ~120-180MB
```

---

## 🔍 Verificar Build

### Durante o Build (Easypanel Logs):

```
[1/2] Building builder stage...
✔ Dependencies installed
✔ Build completed!
✔ Files in dist: 15 files

[2/2] Building production stage...
✔ Production deps installed
✔ Files copied from builder
✔ Non-root user created
✔ Health check configured
✔ Image ready!
```

### Após Deploy:

```bash
# Verificar se está rodando
curl https://seu-frontend.easypanel.host

# Verificar health check
curl https://seu-frontend.easypanel.host/health
# ou apenas verificar se retorna 200
```

---

## 🐛 Troubleshooting

### Build Falha: "Module not found"

**Causa:** Dependência faltando no package.json

**Solução:**
```bash
# Local
npm install [pacote-faltando]

# Commitar e push
git add package.json package-lock.json
git commit -m "fix: adicionar dependência"
git push
```

### Build Falha: "dist folder empty"

**Causa:** `npm run build` falhou ou `VITE_API_URL` não foi passado

**Solução:**
1. Verificar logs do build
2. Garantir que `VITE_API_URL` está nos Build Args
3. Testar build local primeiro

### Frontend carrega em branco

**Causa:** Arquivos estáticos não foram copiados corretamente

**Solução:**
1. Verificar logs: `ls -la dist/`
2. Verificar se `server.js` existe
3. Rebuild completo

### Erro: "Permission denied"

**Causa:** Problema com user nodejs (raro)

**Solução:**
```dockerfile
# Verificar se esta linha está no Dockerfile:
RUN chown -R nodejs:nodejs /app
```

---

## 🔧 Customizações Opcionais

### Adicionar Nginx (Alternativa)

Se preferir servir com Nginx em vez de Node:

```dockerfile
# Stage 3: Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Porém, a versão atual com `server.js` é mais simples e suficiente.

### Adicionar Variáveis de Ambiente Dinâmicas

Se precisar de variáveis runtime (não build time):

```dockerfile
# Adicionar após COPY server.js
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
```

Mas para este projeto, não é necessário.

---

## ✅ Checklist Pré-Deploy

Antes de fazer deploy:

- [ ] `Dockerfile` existe em `frontend/`
- [ ] `.dockerignore` configurado
- [ ] `server.js` existe e funciona
- [ ] `package.json` tem script `build`
- [ ] Testou build local (opcional mas recomendado)
- [ ] `VITE_API_URL` será configurado como Build Arg no Easypanel

---

## 📚 Arquivos Relacionados

- `frontend/Dockerfile` - Este arquivo Docker
- `frontend/.dockerignore` - Arquivos a ignorar no build
- `frontend/server.js` - Servidor de produção
- `frontend/package.json` - Dependências e scripts
- `DEPLOY-EASYPANEL.md` - Guia completo de deploy

---

## 🎯 Próximos Passos

1. **Testar local** (opcional):
   ```bash
   docker build --build-arg VITE_API_URL=http://localhost:3000/api -t test .
   docker run -p 3001:3001 test
   ```

2. **Commit e Push**:
   ```bash
   git add frontend/Dockerfile frontend/.dockerignore
   git commit -m "feat: adicionar Dockerfile otimizado para frontend"
   git push
   ```

3. **Deploy no Easypanel**:
   - Seguir [QUICK-START-DEPLOY.md](../QUICK-START-DEPLOY.md)
   - Configurar Build Arg: `VITE_API_URL`

---

**Última atualização:** 2025-11-24
**Versão:** 1.0.0
**Status:** ✅ Pronto para produção
