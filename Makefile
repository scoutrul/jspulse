# JSPulse - Короткие команды для разработки

# 🌍 Автоматическое определение операционной системы
UNAME_S := $(shell uname -s 2>/dev/null || echo Windows)
ifeq ($(UNAME_S),Windows_NT)
    OS_TYPE = windows
else ifeq ($(UNAME_S),Darwin)
    OS_TYPE = macos
else ifeq ($(UNAME_S),Linux)
    OS_TYPE = linux
else
    # Для Windows без uname (обычный случай)
    OS_TYPE = windows
endif

# 🚀 УНИВЕРСАЛЬНАЯ команда запуска (автоматически выбирает конфигурацию)
start:
ifeq ($(OS_TYPE),windows)
	@echo "🪟 Запуск на Windows..."
	docker-compose -f docker-compose.windows.yml up --build -d
else
	@echo "🍎 Запуск на macOS/Linux..."
	docker-compose --profile dev up --build -d
endif

# 🛑 УНИВЕРСАЛЬНАЯ команда остановки
stop:
ifeq ($(OS_TYPE),windows)
	docker-compose -f docker-compose.windows.yml down
else
	docker-compose down
endif

# 📋 УНИВЕРСАЛЬНЫЕ логи
logs:
ifeq ($(OS_TYPE),windows)
	docker-compose -f docker-compose.windows.yml logs -f
else
	docker-compose logs -f
endif

# 📊 УНИВЕРСАЛЬНЫЙ статус
status:
ifeq ($(OS_TYPE),windows)
	docker-compose -f docker-compose.windows.yml ps
else
	docker-compose ps
endif

# 🧹 УНИВЕРСАЛЬНАЯ очистка
clean:
ifeq ($(OS_TYPE),windows)
	docker-compose -f docker-compose.windows.yml down -v
	docker system prune -f
else
	docker-compose down -v
	docker system prune -f
endif

# 📊 УНИВЕРСАЛЬНАЯ инициализация данных
init:
	@echo "🚀 Инициализация данных..."
	node init-data.js

# 🎯 УНИВЕРСАЛЬНЫЙ ЗАПУСК (без автоматического парсинга)
up: start

# 🎯 ПОЛНЫЙ ЗАПУСК с данными (с парсингом)
full: start init

# ===============================================
# СТАРЫЕ КОМАНДЫ (для совместимости)
# ===============================================

# 🚀 Development режим (hot-reload) - macOS/Linux
dev:
	docker-compose --profile dev up --build

# 🔧 Development в фоне (САМАЯ КОРОТКАЯ!)
d:
	docker-compose --profile dev up --build -d

# 🏭 Production режим
prod:
	docker-compose --profile prod up --build -d

# 🪟 Windows development режим (специальная версия для Windows)
win:
	docker-compose -f docker-compose.windows.yml up --build

# 🪟 Windows development в фоне
winbg:
	docker-compose -f docker-compose.windows.yml up --build -d

# 🛑 Остановить все
down:
	docker-compose down

# 🛑 Остановить Windows версию
windown:
	docker-compose -f docker-compose.windows.yml down

# 📋 Логи Windows версии
winlogs:
	docker-compose -f docker-compose.windows.yml logs -f

# 🧹 Очистить Windows версию
winclean:
	docker-compose -f docker-compose.windows.yml down -v
	docker system prune -f

# 📊 Статус Windows версии
winstatus:
	docker-compose -f docker-compose.windows.yml ps

# 🔄 Перезапуск dev
restart: down d

# 🔄 Перезапуск Windows
winrestart: windown winbg

# Переменные
COMPOSE_FILE = docker-compose.yml

# Показать все доступные команды  
help:
	@echo "Доступные команды:"
	@echo "  up       - Запустить проект с нуля (очистка + сборка + запуск + данные)"
	@echo "  d        - Запустить в dev режиме"
	@echo "  down     - Остановить все контейнеры" 
	@echo "  clean    - Удалить все volumes и контейнеры"
	@echo "  logs     - Показать логи"
	@echo "  restart  - Перезапустить контейнеры"
	@echo "  seed     - Добавить тестовые данные"
	@echo "  parse    - Парсинг реальных данных с HeadHunter"
	@echo "  reparse  - Очистить базу и парсить заново"
	@echo "  test-e2e - Запустить E2E тесты с Playwright"
	@echo "  test-ui  - Запустить Playwright в UI режиме"

# ГЛАВНАЯ КОМАНДА - запустить проект с нуля на любой машине
up:
	@echo "🚀 Запускаем JSPulse с нуля..."
	@echo "🧹 Очищаем старые контейнеры и volumes..."
	docker-compose down -v --remove-orphans 2>/dev/null || true
	docker system prune -f --volumes 2>/dev/null || true
	@echo "🏗️ Собираем и запускаем контейнеры..."
	docker-compose --profile dev up -d --build --force-recreate
	@echo "⏳ Ждем запуска backend (30 сек)..."
	sleep 30
	@echo "🧹 Очищаем БД и запускаем парсинг реальных данных..."
	$(MAKE) reparse
	@echo "✅ Проект запущен!"
	@echo "🌐 Frontend: http://localhost:3000"
	@echo "🔧 Backend API: http://localhost:3001"
	@echo "🗄️ MongoDB: localhost:27017"

# Разработка
d:
	docker-compose up -d --build

# Остановить все
down:
	docker-compose down

# Полная очистка
clean:
	docker-compose down -v --remove-orphans
	docker system prune -f --volumes

# Логи
logs:
	docker-compose logs -f

# Перезапуск
restart:
	docker-compose restart

# Добавить тестовые данные (оставлено для совместимости)
seed:
	@echo "ℹ️ seed: добавление тестовых данных больше не используется по умолчанию"
	@echo "ℹ️ Используйте 'make parse' для загрузки реальных данных"

# Парсинг реальных данных с HeadHunter
parse:
	@echo "🕷️ Запускаем парсинг вакансий с HeadHunter..."
	docker-compose exec -T backend-dev npx tsx src/scripts/fetchAndSaveFromHH.ts

# Очистить базу и запарсить заново
reparse:
	@echo "🧹 Очищаем старые данные..."
	docker-compose exec -T mongodb mongosh jspulse --eval "db.vacancies.deleteMany({}); console.log('🗑️ Database cleared');"
	@echo "🕷️ Парсим реальные данные..."
	$(MAKE) parse

# E2E тестирование с Playwright
test-e2e:
	@echo "🎭 Запускаем E2E тесты с Playwright..."
	pnpm test:e2e

# Playwright UI режим (интерактивный)
test-ui:
	@echo "🎭 Запускаем Playwright в UI режиме..."
	pnpm test:e2e:ui

.PHONY: start stop logs status clean init up full dev d down prod restart win winbg windown winlogs winclean winstatus winrestart help test-e2e test-ui parse reparse seed 

# 🏭 Полный production билд и запуск
deploy:
	@echo "🏗️ Production сборка и запуск JSPulse..."
	docker-compose down -v --remove-orphans 2>/dev/null || true
	docker system prune -f --volumes 2>/dev/null || true
	docker compose --profile prod build
	docker compose --profile prod up -d
	@echo "✅ Production окружение успешно запущено!"
	@echo "🌐 Frontend: http://localhost:3000"
	@echo "🔧 Backend API: http://localhost:5000"