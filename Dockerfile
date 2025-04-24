FROM node:20-alpine

WORKDIR /app

# Копируем файлы pnpm для установки зависимостей всего воркспейса
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Копируем package.json и исходный код для shared и backend
COPY shared/package.json ./shared/package.json
COPY shared/src ./shared/src
COPY shared/tsconfig.json ./shared/tsconfig.json
COPY backend/package.json ./backend/package.json
COPY backend/src ./backend/src
COPY backend/tsconfig.json ./backend/tsconfig.json

# Устанавливаем все зависимости (включая dev для сборки)
# Используем --frozen-lockfile для воспроизводимости
RUN npm install -g pnpm@8
RUN pnpm install --frozen-lockfile

# Собираем shared пакет
RUN pnpm --filter @jspulse/shared build

# Собираем backend пакет
RUN pnpm --filter @jspulse/backend build

# --- Опциональный этап для уменьшения размера образа ---
# Можно создать новый образ только с production зависимостями и dist папками
# FROM node:20-alpine
# WORKDIR /app
# COPY --from=0 /app/pnpm-lock.yaml ./
# COPY --from=0 /app/package.json ./
# COPY --from=0 /app/backend/package.json ./backend/package.json
# COPY --from=0 /app/shared/package.json ./shared/package.json
# RUN npm install -g pnpm@8
# RUN pnpm install --prod --frozen-lockfile
# COPY --from=0 /app/shared/dist ./shared/dist
# COPY --from=0 /app/backend/dist ./backend/dist
# -------------------------------------------------------

# Устанавливаем рабочую директорию для запуска бэкенда
WORKDIR /app/backend

# Открываем порт, который слушает приложение
EXPOSE 3000

# Команда для запуска приложения
# Путь к главному файлу после сборки
CMD ["node", "dist/src/index.js"]