# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Build arguments for environment variables
ARG VITE_API_URL=https://mch-push-backend.ajjhi1.easypanel.host/api
ENV VITE_API_URL=$VITE_API_URL

# Install build dependencies
COPY package*.json ./
COPY package-lock*.json ./
RUN if [ -f package-lock.json ]; then \
      npm ci --silent; \
    else \
      npm install --silent; \
    fi

# Copy source and build
COPY . .
RUN npm run build

# Production stage: serve static files with nginx
FROM nginx:stable-alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
