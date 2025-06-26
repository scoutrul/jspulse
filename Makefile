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

.PHONY: start stop logs status clean init up full dev d down prod restart win winbg windown winlogs winclean winstatus winrestart 