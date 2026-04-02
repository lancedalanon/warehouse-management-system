# -----------------------------
# Stage 1: Dependencies
# -----------------------------
FROM node:22-bullseye-slim AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# -----------------------------
# Stage 2: Build
# -----------------------------
FROM node:22-bullseye-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# -----------------------------
# Stage 3: Runtime
# -----------------------------
FROM node:22-bullseye-slim AS runtime

ENV NODE_ENV=production

WORKDIR /app

# Only production node_modules
COPY --from=deps /app/node_modules ./node_modules

# Compiled output
COPY --from=builder /app/dist ./dist

# Minimal package.json (needed for module resolution)
COPY package.json ./package.json

# Persistent storage directory
RUN mkdir -p storage && chmod -R 777 storage

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]