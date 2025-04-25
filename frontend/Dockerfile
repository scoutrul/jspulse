FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/

RUN pnpm install --frozen-lockfile --verbose

RUN pnpm add @skeletonlabs/skeleton@^3.1.2 -w --force --verbose

COPY . .

WORKDIR /app/frontend

CMD ["pnpm", "run", "dev", "--", "--host"]
