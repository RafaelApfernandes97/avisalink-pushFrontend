#!/bin/bash

# ============================================
# Script de Teste do Dockerfile - Frontend
# ============================================
# Testa o build do Docker localmente antes do deploy

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "==========================================="
echo "  🐳 Testando Dockerfile do Frontend"
echo "==========================================="
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não está instalado!${NC}"
    echo "Instale o Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

echo -e "${GREEN}✅ Docker instalado${NC}"
echo ""

# Verificar se está na pasta correta
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}❌ Dockerfile não encontrado!${NC}"
    echo "Execute este script na pasta frontend/"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json não encontrado!${NC}"
    exit 1
fi

if [ ! -f "server.js" ]; then
    echo -e "${RED}❌ server.js não encontrado!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Arquivos necessários encontrados${NC}"
echo ""

# Definir variáveis
IMAGE_NAME="webpush-frontend-test"
CONTAINER_NAME="webpush-frontend-test-container"
VITE_API_URL="${VITE_API_URL:-http://localhost:3000/api}"
PORT="${PORT:-3001}"

echo -e "${BLUE}📋 Configuração do teste:${NC}"
echo "  Image: $IMAGE_NAME"
echo "  Container: $CONTAINER_NAME"
echo "  VITE_API_URL: $VITE_API_URL"
echo "  Port: $PORT"
echo ""

# Perguntar se quer continuar
echo -e "${YELLOW}Deseja continuar com o build? (S/n)${NC}"
read -r continue_build

if [[ "$continue_build" =~ ^[Nn]$ ]]; then
    echo -e "${YELLOW}⏭️  Build cancelado${NC}"
    exit 0
fi

# Remover container antigo se existir
if docker ps -a | grep -q "$CONTAINER_NAME"; then
    echo -e "${YELLOW}🧹 Removendo container antigo...${NC}"
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
fi

# Remover imagem antiga se existir
if docker images | grep -q "$IMAGE_NAME"; then
    echo -e "${YELLOW}🧹 Removendo imagem antiga...${NC}"
    docker rmi "$IMAGE_NAME" 2>/dev/null || true
fi

echo ""
echo -e "${BLUE}🔨 Iniciando build do Docker...${NC}"
echo "Isso pode levar alguns minutos..."
echo ""

# Build da imagem
docker build \
    --build-arg VITE_API_URL="$VITE_API_URL" \
    -t "$IMAGE_NAME" \
    .

echo ""
echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
echo ""

# Verificar tamanho da imagem
IMAGE_SIZE=$(docker images "$IMAGE_NAME" --format "{{.Size}}")
echo -e "${BLUE}📦 Tamanho da imagem: $IMAGE_SIZE${NC}"
echo ""

# Perguntar se quer executar
echo -e "${YELLOW}Deseja executar o container para testar? (S/n)${NC}"
read -r run_container

if [[ "$run_container" =~ ^[Nn]$ ]]; then
    echo -e "${YELLOW}⏭️  Container não será executado${NC}"
    echo ""
    echo "Para executar manualmente:"
    echo -e "${BLUE}docker run -p $PORT:$PORT --name $CONTAINER_NAME $IMAGE_NAME${NC}"
    exit 0
fi

# Executar container
echo ""
echo -e "${BLUE}🚀 Executando container...${NC}"
docker run -d \
    -p "$PORT:$PORT" \
    --name "$CONTAINER_NAME" \
    "$IMAGE_NAME"

echo ""
echo -e "${GREEN}✅ Container iniciado!${NC}"
echo ""

# Aguardar alguns segundos
echo -e "${BLUE}⏳ Aguardando servidor iniciar (5 segundos)...${NC}"
sleep 5

# Testar se está respondendo
echo ""
echo -e "${BLUE}🔍 Testando conexão...${NC}"

if curl -f http://localhost:$PORT > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Servidor respondendo!${NC}"
    echo ""
    echo -e "${GREEN}🎉 TESTE CONCLUÍDO COM SUCESSO!${NC}"
    echo ""
    echo "Acesse: http://localhost:$PORT"
    echo ""
    echo -e "${YELLOW}Ver logs do container:${NC}"
    echo "  docker logs $CONTAINER_NAME"
    echo ""
    echo -e "${YELLOW}Parar container:${NC}"
    echo "  docker stop $CONTAINER_NAME"
    echo ""
    echo -e "${YELLOW}Remover container:${NC}"
    echo "  docker rm -f $CONTAINER_NAME"
    echo ""
    echo -e "${YELLOW}Remover imagem:${NC}"
    echo "  docker rmi $IMAGE_NAME"
else
    echo -e "${RED}❌ Servidor não está respondendo!${NC}"
    echo ""
    echo -e "${YELLOW}Ver logs para diagnosticar:${NC}"
    echo "  docker logs $CONTAINER_NAME"
    echo ""
    echo -e "${YELLOW}Comandos úteis:${NC}"
    echo "  docker ps -a                    # Ver containers"
    echo "  docker logs $CONTAINER_NAME     # Ver logs"
    echo "  docker exec -it $CONTAINER_NAME sh  # Entrar no container"
    exit 1
fi

echo "==========================================="
echo -e "  ${GREEN}✨ Teste do Dockerfile concluído!${NC}"
echo "==========================================="
echo ""
echo "Próximos passos:"
echo "1. Se funcionar localmente, commitar o Dockerfile"
echo "2. Push para o repositório"
echo "3. Deploy no Easypanel (vai usar este mesmo Dockerfile)"
echo ""
