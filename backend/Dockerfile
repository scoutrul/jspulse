FROM node:20-alpine

WORKDIR /app

# Установка pnpm
RUN npm install -g pnpm

# Копирование файлов package.json
COPY package.json pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/

# Установка зависимостей
RUN pnpm install

# Копирование исходного кода
COPY . .

# Сборка shared пакета
RUN cd shared && pnpm run build

# Запуск бэкенда
WORKDIR /app/backend
CMD ["pnpm", "run", "dev"]
