# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Build arguments for environment variables
ARG VITE_API_URL=https://mch-push-backendv1.ajjhi1.easypanel.host/api
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

# Production stage: serve with simple Node server
FROM node:18-alpine
WORKDIR /app

# Install serve package globally
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Serve the static files with SPA support
CMD ["serve", "-s", "dist", "-l", "3000"]
