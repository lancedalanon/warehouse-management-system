# Stage 1: Backend builder
FROM node:22-bullseye-slim AS backend-builder

WORKDIR /app/backend

# Copy backend package files and install dependencies
COPY backend/package*.json ./
RUN npm install --production

# Copy backend source code
COPY backend/ ./

# Build backend (TypeScript)
RUN npm run build

# Stage 2: Frontend builder
FROM node:22-bullseye-slim AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files and install dependencies
COPY frontend/package*.json ./
RUN npm install --production

# Copy frontend source code
COPY frontend/ ./

# Use env from GitHub Actions secrets
ARG VITE_API_BASE_URL
RUN echo "VITE_API_BASE_URL=${VITE_API_BASE_URL}" > .env

# Build frontend
RUN npm run build

# Stage 3: Final runtime
FROM node:22-bullseye-slim AS runtime

WORKDIR /app

# Copy backend build artifacts
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/package*.json ./

# Copy frontend build into public folder
COPY --from=frontend-builder /app/frontend/dist ./public

# Ensure backend/storage exists
RUN mkdir -p ./storage && chmod -R 777 ./storage

# Copy entrypoint from backend folder in context
COPY backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]