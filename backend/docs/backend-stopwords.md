# Стоп-слова для технологий бэкенда

## Описание

Система стоп-слов предназначена для фильтрации вакансий, которые содержат технологии бэкенда, не относящиеся к JavaScript/TypeScript экосистеме. Это помогает сосредоточиться на вакансиях, релевантных для фронтенд и Node.js разработчиков.

## Категории стоп-слов

### 1. Языки программирования (кроме JavaScript/TypeScript)
- **Python**: python, py, django, flask, fastapi, pandas, numpy
- **Java**: java, spring, springboot, spring boot, hibernate, maven, gradle
- **PHP**: php, laravel, symfony, codeigniter, yii, wordpress
- **C#**: c#, csharp, dotnet, .net, asp.net, entity framework
- **C++**: c++, cpp, qt, cmake
- **Go**: go, golang, gin, echo, fiber
- **Rust**: rust, cargo, actix, tokio
- **Swift**: swift, ios, xcode
- **Kotlin**: kotlin, android, jetpack
- **Ruby**: ruby, rails, ruby on rails, sinatra
- **Scala**: scala, akka, play framework
- **Erlang/Elixir**: erlang, elixir, phoenix
- **Другие**: haskell, clojure, lisp, perl, bash, shell, powershell

### 2. Фреймворки и библиотеки бэкенда
- **Python**: django, flask, fastapi, tornado, bottle
- **Java**: spring, springboot, spring boot, spring mvc, spring security
- **PHP**: laravel, symfony, codeigniter, yii, phalcon
- **C#**: asp.net, asp.net core, blazor, razor
- **Go**: gin, echo, fiber, beego, iris
- **Rust**: actix, rocket, warp, axum
- **Ruby**: rails, ruby on rails, sinatra, hanami
- **Scala**: akka, play framework, lift
- **Elixir**: phoenix, plug, cowboy

### 3. Базы данных
- **SQL**: mysql, postgresql, postgres, oracle, sql server, sqlserver, sqlite
- **NoSQL**: cassandra, couchdb, couchbase, riak
- **Graph**: neo4j, arangodb, orientdb
- **Time-series**: influxdb, timescaledb, clickhouse
- **Search**: elasticsearch, solr, lucene
- **Cache**: redis (может быть основным требованием)

### 4. Инфраструктура и DevOps
- **Containerization**: kubernetes, k8s, helm, istio, docker, dockerfile, docker compose
- **Infrastructure as Code**: terraform, ansible, puppet, chef
- **CI/CD**: jenkins, gitlab ci, github actions, azure devops
- **Cloud**: aws, amazon web services, ec2, s3, lambda, rds, azure, google cloud, gcp, gke
- **Web Servers**: nginx, apache, haproxy
- **Monitoring**: prometheus, grafana, elk stack, elastic stack
- **Service Discovery**: consul, etcd, zookeeper

### 5. Специфичные технологии бэкенда
- **Architecture**: microservices, microservice, soa, service oriented architecture
- **APIs**: rest api, graphql, grpc, soap, xml
- **Security**: jwt, oauth, oauth2, ldap, saml
- **Message Queues**: kafka, rabbitmq, activemq, apache kafka
- **Big Data**: apache spark, hadoop, hive, pig
- **ML/AI**: tensorflow, pytorch, scikit-learn, machine learning, ml
- **Blockchain**: blockchain, ethereum, bitcoin, solidity
- **Computer Vision**: opencv, computer vision, image processing

**Примечание**: Слова "backend" и "бэкенд" НЕ включены в стоп-слова, так как они часто используются в фронтенд вакансиях для обозначения работы с backend API.

### 6. Позиции
- **Data**: data scientist, data engineer, data analyst
- **DevOps**: devops engineer, site reliability engineer, sre
- **System Admin**: system administrator, sysadmin, linux administrator
- **DBA**: database administrator, dba
- **Security**: security engineer, cybersecurity, penetration tester
- **Mobile**: mobile developer, ios developer, android developer
- **Game**: game developer, unity, unreal engine
- **Embedded**: embedded developer, firmware developer
- **QA**: qa engineer, test engineer, automation engineer
- **Management**: business analyst, product manager, project manager
- **Other**: sales engineer, technical writer, technical support

### 7. Дополнительные ключевые слова
- **Legacy**: legacy, mainframe, cobol, fortran
- **Enterprise**: enterprise, corporate, banking, fintech
- **IoT**: iot, internet of things, embedded systems
- **Robotics**: robotics, automation, plc programming
- **ERP**: sap, oracle erp, salesforce, dynamics
- **BI**: bi, business intelligence, etl, data warehouse

## Использование

### В Telegram парсере
Стоп-слова автоматически проверяются при обработке сообщений из Telegram каналов. Сообщения, содержащие стоп-слова, отклоняются с соответствующим сообщением об ошибке.

### В HeadHunter парсере
При парсинге вакансий с HeadHunter API стоп-слова проверяются в названии и описании вакансии. Вакансии с стоп-словами пропускаются с логированием.

### В API фильтрации
При получении списка вакансий через API автоматически применяется фильтрация по стоп-словам на уровне domain service.

## Функции

### `containsBackendStopWords(text: string): boolean`
Проверяет, содержит ли текст стоп-слова.

### `findBackendStopWords(text: string): string[]`
Возвращает массив найденных стоп-слов в тексте.

### `filterByBackendStopWords(texts: string[]): string[]`
Фильтрует массив текстов, исключая те, что содержат стоп-слова.

## Особенности реализации

- **Поиск целых слов**: Для обычных слов используется поиск с границами слов (`\b`), чтобы избежать ложных срабатываний (например, "java" не срабатывает в "JavaScript").
- **Специальные символы**: Для слов с символами "#" и "." используется точный поиск без границ слов.
- **Регистронезависимый поиск**: Все сравнения выполняются в нижнем регистре.
- **Экранирование**: Специальные символы регулярных выражений автоматически экранируются.

## Статистика

- **Всего стоп-слов**: 249
- **Категории**: 7 основных категорий
- **Покрытие**: Основные технологии бэкенда, не относящиеся к JavaScript/TypeScript экосистеме

## Обновление

Для добавления новых стоп-слов отредактируйте файл `backend/src/config/backendStopWords.ts` и пересоберите проект командой `npm run build`.
