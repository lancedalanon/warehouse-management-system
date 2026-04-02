# -----------------------------
# Stage 1: Backend dependencies
# -----------------------------
FROM node:22-bullseye-slim AS backend-deps

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

# -----------------------------
# Stage 2: Backend build
# -----------------------------
FROM node:22-bullseye-slim AS backend-builder

WORKDIR /app/backend

COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY backend/ ./
RUN npm run build

# -----------------------------
# Stage 3: Frontend dependencies
# -----------------------------
FROM node:22-bullseye-slim AS frontend-deps

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

# -----------------------------
# Stage 4: Frontend build
# -----------------------------
FROM node:22-bullseye-slim AS frontend-builder

WORKDIR /app/frontend

COPY --from=frontend-deps /app/frontend/node_modules ./node_modules
COPY frontend/ ./

ARG VITE_API_BASE_URL
RUN echo "VITE_API_BASE_URL=${VITE_API_BASE_URL}" > .env

RUN npm run build

# -----------------------------
# Stage 5: Runtime
# -----------------------------
FROM node:22-bullseye-slim

WORKDIR /app

# Backend runtime
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY backend/package*.json ./

# Frontend static files
# Copy it under /app/frontend/dist to match backend code expectation
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Storage directory
RUN mkdir -p storage && chmod -R 777 storage

# Entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]