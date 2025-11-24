# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Build arguments
ARG VITE_API_URL=https://mch-push-backendv1.ajjhi1.easypanel.host/api
ENV VITE_API_URL=$VITE_API_URL

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Set environment
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies (including express)
RUN npm install --omit=dev

# Copy built files and server script
COPY --from=builder /app/dist ./dist
COPY server.js ./

# Expose port
EXPOSE 3000

# Start custom server
CMD ["node", "server.js"]
