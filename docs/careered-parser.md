# Careered.io Parser Documentation

## Overview

The Careered.io parser is an API-based job scraping system that extracts JavaScript/TypeScript job listings from careered.io using Playwright for network interception and structured JSON data processing. **The parser now fetches full job descriptions from individual job pages** to provide complete vacancy information instead of just API summaries.

## Table of Contents

- [Architecture](#architecture)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Data Structure](#data-structure)
- [Filtering Rules](#filtering-rules)
- [Usage](#usage)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Architecture

### Core Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Careered.io   │───▶│  Playwright      │───▶│   MongoDB       │
│   API Endpoint  │    │  Network         │    │   Database      │
│                 │    │  Interception    │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │  CareeredClient  │
                        │  + Full Page     │
                        │    Scraping      │
                        │  + Data          │
                        │    Processing   │
                        └──────────────────┘
```

### Technology Stack

- **Runtime**: Node.js with TypeScript
- **Browser Automation**: Playwright
- **Database**: MongoDB with Mongoose
- **HTTP Client**: Custom HttpClient
- **Data Processing**: Cheerio for HTML parsing (fallback)

## Configuration

### Environment Variables

```bash
# Parser Configuration
MAX_PAGES=5                    # Maximum pages to parse
LIMIT_PER_PAGE=20             # Jobs per page limit
CAREERED_MODE=playwright      # Force Playwright mode

# Database
MONGO_URI=mongodb://mongodb:27017/jspulse

# Logging
NODE_ENV=production
```

### Parser Settings

```typescript
const SOURCE = "careered.io";
const API_LIMIT = 20;         // Records per request
const CONFIDENCE = 0.95;      // High confidence for API data
const TIMEOUT = 30000;        // Request timeout (ms)
```

## API Reference

### Endpoint

```
GET https://careered.io/jobs?tags=a7f11f28-d502-4b8f-8432-5a1862cc99fa&offset=0
```

**Parameters:**
- `tags`: JavaScript/TypeScript tag ID (`a7f11f28-d502-4b8f-8432-5a1862cc99fa`)
- `offset`: Pagination offset (increments by 20)

### Response Structure

```json
{
  "entries": [
    {
      "id": "4ebbf6db-d09c-4c0b-bb70-cbe28118517f",
      "kind": "job",
      "tag": {
        "id": "a7f11f28-d502-4b8f-8432-5a1862cc99fa",
        "name": "JavaScript / TypeScript"
      },
      "features": [
        {
          "key": "name",
          "value": "Frontend Engineer (React, Project/Freelance)"
        },
        {
          "key": "company",
          "value": "dexcelerate.com"
        },
        {
          "key": "location",
          "value": "Remote"
        },
        {
          "key": "summary",
          "value": "Job description..."
        },
        {
          "key": "salary_from",
          "value": "160000"
        },
        {
          "key": "salary_to",
          "value": "480000"
        },
        {
          "key": "salary_currency",
          "value": "RUB"
        }
      ],
      "links": [
        {
          "key": "telegram",
          "value": "https://t.me/letsweb"
        }
      ],
      "mode": "preview",
      "posted_at": 1760103961
    }
  ],
  "recommended_entry": null,
  "offset": 0,
  "limit": 20,
  "total": 217
}
```

## Data Structure

### Database Schema

```typescript
interface Vacancy {
  externalId: string;           // "careered.io:4ebbf6db-d09c-4c0b-bb70-cbe28118517f"
  title: string;               // "Frontend Engineer (React, Project/Freelance)"
  company: string;             // "dexcelerate.com"
  location: string;            // "Remote"
  url: string;                 // "https://careered.io/jobs/4ebbf6db-d09c-4c0b-bb70-cbe28118517f"
  publishedAt: Date;           // Parsed from posted_at timestamp
  source: string;              // "careered.io"
  description: string;         // Truncated summary (500 chars)
  fullDescription: {
    raw: string;               // Full summary
    preview: string;          // Truncated version
    processed: string;        // Processed HTML
    textOnly: string;         // Plain text
  };
  skills: string[];           // Extracted from title + description
  salaryFrom?: number;        // Parsed from salary_from
  salaryTo?: number;          // Parsed from salary_to
  salaryCurrency?: string;    // Parsed from salary_currency
  isRemote: boolean;          // Derived from location
  sourceId: string;           // Job ID from API
  sourceUrl: string;          // Full job URL
  confidence: number;         // 0.95 (high confidence for API data)
  parsedAt: Date;             // Processing timestamp
}
```

### Field Mapping

| API Field | Database Field | Transformation |
|-----------|----------------|----------------|
| `id` | `sourceId`, `externalId` | `careered.io:${id}` |
| `features.name` | `title` | Direct mapping |
| `features.company` | `company` | Direct mapping |
| `features.location` | `location` | Direct mapping |
| `features.summary` | `description`, `fullDescription` | Truncated to 500 chars |
| `features.salary_from` | `salaryFrom` | Parse to number |
| `features.salary_to` | `salaryTo` | Parse to number |
| `features.salary_currency` | `salaryCurrency` | Direct mapping |
| `posted_at` | `publishedAt` | Convert from Unix timestamp |

## Filtering Rules

### Stop Words Filter

**Important**: Stop words are checked **ONLY** in the job title, not in the description.

```typescript
// ✅ CORRECT - Only title is checked
if (containsBackendStopWords(title.toLowerCase())) {
  console.log(`🚫 ПРОПУЩЕНА (стоп-слова): "${title}"`);
  throw new Error('Вакансия содержит стоп-слова');
}

// ❌ WRONG - Don't check description
// if (containsBackendStopWords(title + " " + description)) { ... }
```

### Examples of Filtered Jobs

| Title | Reason |
|-------|--------|
| `"n8n Developer (Automation & AI Integrations)"` | Contains "n8n" |
| `"React Native (iOS) Developer"` | Contains "native" |
| `"Backend Developer (Middle/Senior, Node.js, AWS)"` | Contains "backend" |

### Skills Extraction

Skills are extracted from both title and description:

```typescript
const skills = extractSkills(title + " " + description);
// Returns: ["javascript", "react", "typescript", ...]
```

## Usage

### Running the Parser

```bash
# Development
cd backend
MAX_PAGES=1 LIMIT_PER_PAGE=3 pnpm tsx src/scripts/fetchAndSaveFromCareeredAPI.ts

# Production (via admin panel)
POST /admin/parse-careered
```

### Admin Panel Integration

The parser is integrated into the admin panel:

```typescript
// adminRoutes.ts
router.post('/parse-careered', async (req: Request, res: Response) => {
  const source = 'careered-api' as ParsingSource;
  const resolved = resolveParserCommand(source);
  // ... execution logic
});
```

### Programmatic Usage

```typescript
import { CareeredClient } from '../utils/http/adapters/CareeredClient.js';

const client = new CareeredClient({
  logging: true,
  mode: 'playwright'
});

try {
  const response = await client.getJobListingsFromAPI(0, 20);
  console.log(`Found ${response.entries.length} jobs`);
} finally {
  await client.close();
}
```

## Monitoring

### Key Metrics

- **Total Jobs in API**: 217 (as of last check)
- **Success Rate**: ~85% (improved with full descriptions)
- **Processing Speed**: ~20 jobs per request (with 500ms delay between full descriptions)
- **Data Quality**: High (full HTML content + structured API data)
- **Description Length**: 16,000-21,000 characters (vs 300-500 previously)

### Logging Output

```
🚀 Запускаю импорт с Careered.io API…
✅ MongoDB подключен
📄 Страница API 1/5 (offset: 0)
[CareeredClient] API request via Playwright: https://careered.io/jobs?tags=...
✅ Playwright browser launched
[CareeredClient] API response: 20 jobs, total: 217
📊 API ответ: 20 вакансий, всего: 217
[CareeredClient] Getting full description for job: 4ebbf6db-d09c-4c0b-bb70-cbe28118517f
🔍 Loading job detail: https://careered.io/jobs/4ebbf6db-d09c-4c0b-bb70-cbe28118517f
✅ Extracted job detail: Frontend Engineer (React, Project/Freelance)
  📄 Получено полное описание для 4ebbf6db-d09c-4c0b-bb70-cbe28118517f (19404 символов)
  ✨ НОВАЯ: "Frontend Engineer (React, Project/Freelance)" (https://careered.io/jobs/4ebbf6db-d09c-4c0b-bb70-cbe28118517f)
📄 Страница 1 итог: ✨17 новых, 🔄0 обновлено, ❌3 пропущено
🎯 ИТОГ Careered.io API:
📊 Получено: 17
✨ Новых: 17
🔄 Обновлено: 0
❌ Пропущено: 3
```

### Performance Monitoring

```typescript
// Track processing time
const startTime = Date.now();
// ... processing ...
const duration = Date.now() - startTime;
console.log(`Processing completed in ${duration}ms`);
```

## Troubleshooting

### Common Issues

#### 1. No Jobs Found
```
❌ Error: Could not intercept API response
```
**Solution**: Check Playwright installation and network connectivity.

#### 2. Duplicate Key Errors
```
❌ MongoServerError: E11000 duplicate key error collection: jspulse.vacancies index: externalId_1
```
**Solution**: Ensure proper duplicate checking logic is in place.

#### 3. Stop Words False Positives
```
🚫 ПРОПУЩЕНА (стоп-слова): "Frontend Developer"
```
**Solution**: Review stop words list in `backendStopWords.ts`.

### Debug Mode

Enable detailed logging:

```typescript
const client = new CareeredClient({
  logging: true,  // Enable detailed logs
  mode: 'playwright'
});
```

### Health Checks

```bash
# Check database connection
cd backend && pnpm tsx -e "
import mongoose from './src/config/database.js';
await mongoose.connect(process.env.MONGO_URI);
console.log('✅ Database connected');
await mongoose.disconnect();
"

# Check API endpoint
curl "https://careered.io/jobs?tags=a7f11f28-d502-4b8f-8432-5a1862cc99fa&offset=0"
```

## Maintenance

### Regular Tasks

1. **Monitor API Changes**: Check for structure updates
2. **Update Stop Words**: Review and refine filtering rules
3. **Performance Optimization**: Monitor parsing speed
4. **Data Quality**: Verify extracted data accuracy

### Backup Strategy

```bash
# Export current data
mongodump --db jspulse --collection vacancies --query '{"source": "careered.io"}'
```

### Version History

- **v1.0**: Initial HTML scraping implementation
- **v2.0**: API-based parsing with Playwright
- **v2.1**: Improved error handling and logging
- **v2.2**: Consolidated source naming (`careered.io`)
- **v2.3**: **Full page description scraping** - Now fetches complete job descriptions from individual pages

---

**Last Updated**: January 2025  
**Maintainer**: Development Team  
**Status**: ✅ Production Ready
