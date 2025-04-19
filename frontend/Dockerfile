FROM node:20-alpine

WORKDIR /app

# Установка pnpm
RUN npm install -g pnpm

# Копирование файлов package.json
COPY package.json pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/

# Установка зависимостей
RUN pnpm install

# Копирование исходного кода
COPY . .

# Сборка shared пакета
RUN cd shared && pnpm run build

# Запуск фронтенда
WORKDIR /app/frontend
CMD ["pnpm", "run", "dev", "--host"]
