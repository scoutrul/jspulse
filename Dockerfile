FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json from each package
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/

# Install dependencies using pnpm
RUN pnpm install

# Копируем все исходники
COPY shared/ ./shared/
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Всегда собираем shared пакет
RUN pnpm --filter @jspulse/shared build

# Проверяем и собираем бэкенд только если локальная сборка не существует
RUN if [ ! -d "./backend/dist" ] || [ -z "$(ls -A ./backend/dist)" ]; then \
      echo "Building backend..." && \
      pnpm --filter @jspulse/backend build; \
    else \
      echo "Using local backend build"; \
    fi

# Проверяем и собираем фронтенд только если локальная сборка не существует
RUN if [ ! -d "./frontend/build" ] || [ -z "$(ls -A ./frontend/build)" ]; then \
      echo "Building frontend..." && \
      pnpm --filter @jspulse/frontend install ky && \
      pnpm --filter @jspulse/frontend build; \
    else \
      echo "Using local frontend build"; \
    fi

# Backend stage
FROM node:20-alpine AS backend-stage

WORKDIR /app

# Copy package files and workspace configuration
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Copy package.json files for all packages
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/shared/package.json ./shared/package.json

# Copy node_modules and built files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/shared/node_modules ./shared/node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/shared/dist ./shared/dist

# Set working directory to backend
WORKDIR /app/backend

# Expose port
EXPOSE 3001

# Start backend
CMD ["node", "dist/index.js"]

# Frontend stage
FROM node:20-alpine AS frontend-stage

WORKDIR /app

# Copy package files and workspace configuration
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Copy package.json files for all packages
COPY --from=builder /app/frontend/package.json ./frontend/package.json
COPY --from=builder /app/shared/package.json ./shared/package.json

# Copy node_modules and built files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=builder /app/shared/node_modules ./shared/node_modules
COPY --from=builder /app/frontend/build ./frontend/build
COPY --from=builder /app/shared/dist ./shared/dist

# Set working directory to frontend
WORKDIR /app/frontend

# Expose port
EXPOSE 3000

# Start frontend in production mode
CMD ["node", "build/index.js"]
