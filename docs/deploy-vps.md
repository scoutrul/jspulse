## Деплой JSPulse на VPS (Ubuntu 24.04, nginx)

### 1) Что понадобится (обязательно)
- VPS: 1 vCPU, 1 GB RAM, 10 GB SSD (достаточно, при росте можно увеличить)
- Домен: `jspulse.ru` указывает на IP `81.177.140.151`
- Доступ: SSH и веб-консоль
- ПО: Docker + Docker Compose plugin, nginx (уже есть), Node.js 20 (не обязателен для Docker)

Ссылка на репозиторий: https://github.com/scoutrul/jspulse

---

### 2) Установка Docker и firewall (обязательно)
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 80,443/tcp
sudo ufw enable
```
Перезайдите в SSH-сессию, чтобы вступила в силу группа docker.

---

### 3) Клонирование проекта (обязательно)
```bash
git clone https://github.com/scoutrul/jspulse.git
cd jspulse
```

---

### 4) Конфигурация .env (обязательно)
Создайте файл `.env` в корне проекта:
```bash
# Общие
NODE_ENV=production
TZ=Europe/Moscow

# Mongo (аутентификация включена)
MONGO_INITDB_ROOT_USERNAME=jspulse
MONGO_INITDB_ROOT_PASSWORD=<сильный_пароль>
MONGO_DB=jspulse
MONGO_URI=mongodb://jspulse:<сильный_пароль>@mongodb:27017/jspulse?authSource=admin

# Backend
PORT=3001
HH_API_BASE_URL=https://api.hh.ru

# Scheduler (крон внутри backend)
SCHEDULER_HH_PARSER_ENABLED=true
SCHEDULER_HH_PARSER_SCHEDULE=0 */8 * * *
SCHEDULER_CLEANUP_ENABLED=true
SCHEDULER_CLEANUP_SCHEDULE=0 2 * * 0
SCHEDULER_CLEANUP_DAYS_THRESHOLD=30
SCHEDULER_HEALTH_CHECK_ENABLED=true
SCHEDULER_HEALTH_CHECK_SCHEDULE=*/30 * * * *
SCHEDULER_MAX_RETRIES=3
SCHEDULER_RETRY_DELAY=60000
SCHEDULER_ENABLE_NOTIFICATIONS=true
SCHEDULER_LOG_TO_FILE=true

# Frontend
PORT_FRONTEND=3000
ORIGIN=https://jspulse.ru
VITE_PUBLIC_BACKEND_URL=https://jspulse.ru/api
INTERNAL_BACKEND_URL=http://backend:3001
```

---

### 5) Важные моменты Docker Compose (обязательно)
- Запускать с профилем prod: `--profile prod`
- Не публиковать порт Mongo наружу (без `27017:27017`)
- Убедиться, что у `frontend` `NODE_ENV=production`
- `VITE_PUBLIC_BACKEND_URL` должен быть публичным `https://jspulse.ru/api`

Если требуется, поправьте `docker-compose.yml` согласно этим правилам перед запуском.

---

### 6) nginx как reverse proxy (обязательно)
Оставляем наружу только nginx (80/443). Проксируем внутрь Docker-сети на `frontend:3000` и `/api` на `backend:3001`.

Пример `server`-блока (замените в вашем `/etc/nginx/sites-available/default` или в отдельном конфиге):
```
server {
    listen 80;
    server_name jspulse.ru;

    # Если есть TLS-терминация через отдельный конфиг/сертификаты, добавьте 443-блок
    # и переадресацию с 80 на 443.

    location /api/ {
        proxy_pass http://backend:3001/; # внутреннее имя сервиса Docker через сеть
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://backend:3001/health;
    }

    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Что такое TLS-терминация (просто)
- **TLS/HTTPS** = шифрование трафика между браузером и сервером (замочек в адресной строке).
- **Терминация TLS** = nginx принимает HTTPS, расшифровывает и проксирует дальше в вашу внутреннюю сеть (к контейнерам по HTTP).
- Если вы не уверены, есть ли у вас HTTPS сейчас — скорее всего нет. Это нормально: можно запуститься на HTTP, а затем включить HTTPS за 5–10 минут.

#### Как быстро включить HTTPS для nginx (Let’s Encrypt / Certbot)
1. Убедитесь, что DNS-домен `jspulse.ru` указывает на ваш IP `81.177.140.151`.
2. Установите certbot для nginx:
   ```bash
   sudo apt update
   sudo apt install -y certbot python3-certbot-nginx
   ```
3. Проверьте, что сайт отдает HTTP на 80 порту (nginx запущен, конфиг с server_name `jspulse.ru` и прокси на ваши контейнеры работает).
4. Выпустите и подключите сертификат автоматически:
   ```bash
   sudo certbot --nginx -d jspulse.ru --redirect --agree-tos -m you@example.com
   ```
   - `--redirect` автоматически добавит 301 с 80→443.
   - Certbot сам добавит 443-блок в конфиг и настроит автообновление сертификата.
5. Проверка:
   ```bash
   curl -I https://jspulse.ru
   ```

Если вы хотите сделать конфиг 443 вручную, ориентируйтесь на такой пример:
```
server {
    listen 443 ssl http2;
    server_name jspulse.ru;

    ssl_certificate /etc/letsencrypt/live/jspulse.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jspulse.ru/privkey.pem;

    location /api/ {
        proxy_pass http://backend:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://backend:3001/health;
    }

    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name jspulse.ru;
    return 301 https://$host$request_uri;
}
```

Просто: если вы не знаете, есть ли у вас TLS — запускайтесь по HTTP (раздел выше), убедитесь, что сайт доступен, и затем выполните команду certbot из шага 4. Это самый быстрый путь получить HTTPS.

Важно: nginx должен быть в той же Docker-сети, что и сервисы (или используйте `proxy_pass http://127.0.0.1:3000`/`3001` при наружных портах). Рекомендуется запускать nginx в том же `docker compose` либо подключить его к сети compose.

---

### 7) Сборка и запуск (обязательно)
```bash
docker compose --profile prod up -d --build
```
Проверка:
```bash
docker compose ps
docker compose logs -f backend frontend mongodb
curl -I https://jspulse.ru
```

---

### 8) Крон-парсер вакансий (обязательно)
- Крон встроен в бэкенд и запускается автоматически при старте сервера.
- Управление расписанием через переменные `SCHEDULER_*` в `.env`.
- Оставьте один инстанс backend, чтобы избежать дублей задач.
- Таймзона расписаний — `TZ`.

Проверка: `GET /health` и `GET /api/scheduler/*` (через nginx: `https://jspulse.ru/health`).

---

### 9) Обновления и релизы (обязательно)
```bash
git pull
docker compose --profile prod up -d --build
```

---

### 10) Бэкапы Mongo (желательно)
```bash
docker exec -t $(docker ps -qf name=mongodb) \
  mongodump --username $MONGO_INITDB_ROOT_USERNAME \
            --password $MONGO_INITDB_ROOT_PASSWORD \
            --authenticationDatabase admin \
            --db $MONGO_DB \
            --archive=/dump.archive.gz
docker cp $(docker ps -qf name=mongodb):/dump.archive.gz ./backups/jspulse-$(date +%F-%H%M%S).archive.gz
```

---

### 11) Безопасность (обязательно)
- Снаружи открыты только 80/443.
- Mongo и внутренние сервисы доступны только в Docker-сети (без публикации портов).
- Секреты храним в `.env` на сервере, не коммитим.
- При желании — запуск контейнеров от пользователя `node`.

---

### 12) Траблшутинг (полезно)
- Фронтенд в dev-режиме → проверьте `NODE_ENV=production` у `frontend`.
- CORS/ошибки API → проверьте `ORIGIN` и `VITE_PUBLIC_BACKEND_URL`.
- Парсер не срабатывает → проверьте `SCHEDULER_*` и `TZ`, смотрите `/health`.
- Mongo не стартует → проверьте логин/пароль и что порт 27017 не публикуется наружу.
- Ничего не открывается снаружи → проверьте nginx-конфиг и DNS.


