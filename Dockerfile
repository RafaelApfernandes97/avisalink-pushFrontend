# ============================================
# Stage 1: Build Stage
# ============================================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Build argument for API URL (IMPORTANTE!)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# List build output (for debugging)
RUN echo "Build completed! Files in dist:" && ls -la dist/

# ============================================
# Stage 2: Production Stage
# ============================================
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies (express)
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy production server
COPY server.js ./

# Verify files
RUN echo "Production files:" && \
    ls -la && \
    echo "Dist contents:" && \
    ls -la dist/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the server
CMD ["node", "server.js"]
