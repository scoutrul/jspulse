FROM node:20-alpine

WORKDIR /app

# Установка pnpm
RUN npm install -g pnpm

# Копирование исходного кода (включая package.json и т.д.)
COPY . .

# Установка зависимостей ПОСЛЕ копирования всего кода
# Это гарантирует, что pnpm видит всю структуру воркспейса
RUN pnpm install 

# Устанавливаем рабочую директорию frontend
WORKDIR /app/frontend

# Запускаем dev скрипт из package.json с помощью pnpm run
CMD ["pnpm", "run", "dev", "--", "--host"]
