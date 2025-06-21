# JSPulse - Короткие команды для разработки

# 🚀 Development режим (hot-reload)
dev:
	docker-compose --profile dev up --build

# 🔧 Development в фоне (САМАЯ КОРОТКАЯ!)
d:
	docker-compose --profile dev up --build -d

# 🏭 Production режим
prod:
	docker-compose --profile prod up --build -d

# 🛑 Остановить все
down:
	docker-compose down

# 📋 Логи
logs:
	docker-compose logs -f

# 🧹 Очистить все
clean:
	docker-compose down -v
	docker system prune -f

# 📊 Статус
status:
	docker-compose ps

# 🔄 Перезапуск dev
restart: down d

.PHONY: up d down logs prod clean status restart 