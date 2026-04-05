# -----------------------------
# Stage 1: Build
# -----------------------------
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .

RUN npm run build

# remove dev dependencies
RUN npm prune --omit=dev


# -----------------------------
# Stage 2: Runtime
# -----------------------------
FROM node:22-alpine

WORKDIR /app

# copy production node_modules
COPY --from=builder /app/node_modules ./node_modules

# copy compiled output
COPY --from=builder /app/dist ./dist

COPY package.json ./package.json
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

# storage dir
RUN mkdir -p /app/storage

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]