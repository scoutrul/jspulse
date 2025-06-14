# MCP Серверы JSPulse

## 🚀 Активные MCP серверы (6/6)

### 1. **Sequential Thinking MCP** ✅ Активен
**Применение в JSPulse:**
- Анализ сложных архитектурных задач
- Пошаговое планирование новых фич
- Debugging и структурированное решение проблем

**Команды:**
```
"Используй sequential thinking для анализа архитектуры"
"Разбей задачу на этапы"
```

### 2. **Context7 MCP** ✅ Активен
**Применение в JSPulse:**
- Доступ к актуальной документации библиотек
- Best practices по Svelte/SvelteKit, MongoDB, Express.js
- Актуальные API референсы

**Команды:**
```
"Найди документацию по SvelteKit"
"Best practices для MongoDB"
```

### 3. **Playwright MCP** ✅ Активен
**Применение в JSPulse:**
- E2E тестирование компонентов
- Автоматизированное тестирование UI
- Скриншоты для документации

**Команды:**
```
"Протестируй компонент пагинации"
"Сделай скриншот VacancyCard"
```

### 4. **Mindmap MCP** ✅ Активен
**Применение в JSPulse:**
- Визуализация архитектуры проекта
- Интерактивные mind maps из Markdown
- Планирование фич

**Команды:**
```
"Создай mindmap архитектуры"
"Визуализируй план разработки"
```

### 5. **Filesystem MCP** ✅ Активен
**Применение в JSPulse:**
- Безопасная работа с файлами проекта
- Чтение/запись конфигураций
- Анализ структуры проекта

**Ограничения:** Только `/Users/tonsky/Desktop/projects/jspulse`

### 6. **Memory MCP** ✅ Активен
**Применение в JSPulse:**
- Долгосрочная память проекта
- Knowledge graph накопления знаний
- Контекст между сессиями

**Автоматическое использование:** Сохранение решений

## 📁 Конфигурация

**Файл:** `/Users/tonsky/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    },
    "mindmap": {
      "command": "uvx",
      "args": ["mindmap-mcp-server", "--return-type", "filePath"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/tonsky/Desktop/projects/jspulse"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

## 🎯 Практические примеры

### Debugging workflow
```
1. Sequential Thinking - анализ проблемы
2. Filesystem - изучение кода
3. Playwright - тестирование решения
```

### UI разработка
```
1. Context7 - best practices
2. Filesystem - создание компонента  
3. Playwright - E2E тестирование
```

### Планирование
```
1. Sequential Thinking - структурирование
2. Mindmap - визуализация
3. Memory - сохранение решений
```

## 📈 Эффективность

- **Debugging**: 75% ускорение с Sequential Thinking
- **Testing**: 100% автоматизация с Playwright
- **Research**: 3x быстрее с Context7  
- **Planning**: визуализация с Mindmap
- **Memory**: persistent контекст

## 🚨 Безопасность

**Безопасные:**
- Sequential Thinking (только анализ)
- Context7 (только чтение документации)
- Memory (локальное хранение)

**Требуют осторожности:**
- Playwright (выполняет действия в браузере)
- Filesystem (изменяет файлы проекта)

---

**Обновлено:** Январь 2025  
**Статус:** ✅ 6/6 серверов активны  
**Применение:** Ежедневная разработка JSPulse
