FROM node:20-alpine

WORKDIR /app

# Установка pnpm
RUN npm install -g pnpm

# Копирование файлов package.json (оставим для возможного кэширования слоя)
COPY package.json pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/
# Если есть frontend/package.json, его тоже можно добавить для полноты, но не обязательно для backend
# COPY frontend/package.json ./frontend/ 

# Копирование ВСЕГО исходного кода проекта
COPY . .

# Установка ВСЕХ зависимостей (включая devDependencies для tsc)
RUN pnpm install --prod=false

# Сборка shared пакета перед сборкой backend
RUN pnpm --filter @jspulse/shared build

# Переход в директорию backend
WORKDIR /app/backend

# Сборка самого backend (используя tsc -p tsconfig.json)
RUN pnpm run build

# Запуск бэкенда напрямую (БЕЗ nodemon)
CMD ["node", "dist/index.js"]
