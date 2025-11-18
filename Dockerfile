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
COPY --from=builder /app/dist /usr/share/nginx/html

# Optional: remove default nginx config to keep defaults (custom config can be added later)

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
