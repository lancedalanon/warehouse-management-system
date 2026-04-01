# Stage 1: Backend builder
FROM node:22-bullseye-slim AS backend-builder

WORKDIR /app

# Copy package files and install production deps
COPY package*.json ./
RUN npm install --production

# Copy backend source code
COPY . .

# Build backend (TypeScript)
RUN npm run build

# Stage 2: Frontend builder
FROM node:22-bullseye-slim AS frontend-builder

WORKDIR /app

# Copy frontend source
COPY frontend/package*.json ./
RUN npm install --production

COPY frontend ./

# Use env from GitHub Actions secrets by creating .env file dynamically
# This will be baked into build
ARG VITE_API_BASE_URL
RUN echo "VITE_API_BASE_URL=${VITE_API_BASE_URL}" > .env

# Build frontend
RUN npm run build

# Stage 3: Final runtime
FROM node:22-bullseye-slim AS runtime

WORKDIR /app

# Copy backend artifacts
COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package*.json ./

# Copy frontend build into public folder
COPY --from=frontend-builder /app/dist ./public

# Create storage folder (committed but contents ignored)
RUN mkdir -p storage && chmod -R 777 storage

# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]