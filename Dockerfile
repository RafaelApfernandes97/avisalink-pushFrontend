# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

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
