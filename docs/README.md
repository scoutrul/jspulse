# JSPulse Documentation

This directory contains technical documentation for the JSPulse job parsing system.

## Available Documentation

### Parsers

- **[Careered.io Parser](./careered-parser.md)** - Complete documentation for the Careered.io API-based parser
- **[Careered.io Parser - Quick Reference](./careered-parser-quick.md)** - Technical reference for developers

### Overview

The JSPulse system consists of multiple job parsers that extract job listings from various sources:

- **Careered.io** - API-based parser with full page description scraping using Playwright
- **HeadHunter** - HTML scraping parser
- **Habr Career** - HTML scraping parser
- **Telegram** - Channel monitoring parser

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Job Sources   │───▶│   Parsers        │───▶│   MongoDB       │
│                 │    │                  │    │   Database      │
│ • Careered.io   │    │ • API-based      │    │                 │
│ • HeadHunter    │    │ • HTML scraping  │    │                 │
│ • Habr Career   │    │ • Playwright     │    │                 │
│ • Telegram      │    │ • HTTP clients   │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Quick Start

### Running Parsers

```bash
# Careered.io parser
cd backend
MAX_PAGES=1 pnpm tsx src/scripts/fetchAndSaveFromCareeredAPI.ts

# Via admin panel
curl -X POST http://localhost:3001/admin/parse-careered
```

### Checking Results

```bash
# Count jobs by source
cd backend && pnpm tsx -e "
import mongoose from './src/config/database.js';
await mongoose.connect(process.env.MONGO_URI);
const Vacancy = mongoose.model('Vacancy', new mongoose.Schema({}, { strict: false }));
const sources = await Vacancy.aggregate([
  { \$group: { _id: '\$source', count: { \$sum: 1 } } },
  { \$sort: { count: -1 } }
]);
console.log(sources);
await mongoose.disconnect();
"
```

## Configuration

### Environment Variables

```bash
# Database
MONGO_URI=mongodb://mongodb:27017/jspulse

# Parser Settings
MAX_PAGES=5
CAREERED_MODE=playwright

# Logging
NODE_ENV=production
```

### Parser Sources

| Source | Parser Script | Database Source | Status |
|--------|---------------|-----------------|--------|
| Careered.io | `fetchAndSaveFromCareeredAPI.ts` | `careered.io` | ✅ Active |
| HeadHunter | `fetchAndSaveFromHH.ts` | `hh.ru` | ✅ Active |
| Habr Career | `fetchAndSaveFromHabr.ts` | `habr` | ✅ Active |
| Telegram | `parseTelegramUlbi.ts` | `telegram` | ✅ Active |

## Data Structure

### Common Fields

All job records share these common fields:

```typescript
interface Vacancy {
  externalId: string;        // Unique identifier: "source:jobId"
  title: string;            // Job title
  company: string;          // Company name
  location: string;         // Job location
  url: string;              // Original job URL
  publishedAt: Date;        // Publication date
  source: string;           // Source identifier
  description: string;      // Job description (truncated)
  fullDescription?: {       // Full description object
    raw: string;
    preview: string;
    processed: string;
    textOnly: string;
  };
  skills: string[];          // Extracted skills
  salaryFrom?: number;      // Salary range start
  salaryTo?: number;        // Salary range end
  salaryCurrency?: string;  // Currency code
  isRemote: boolean;        // Remote work flag
  confidence: number;       // Parsing confidence (0-1)
  parsedAt: Date;          // Processing timestamp
}
```

## Filtering Rules

### Stop Words

Stop words are applied **only to job titles**, not descriptions:

```typescript
// ✅ CORRECT
if (containsBackendStopWords(title.toLowerCase())) {
  // Skip job
}

// ❌ WRONG
if (containsBackendStopWords(title + description)) {
  // This would skip too many jobs
}
```

### Source Normalization

Sources are normalized in `VacancyRepository.ts`:

```typescript
if (["careered", "careered.ru", "careered.io"].includes(s)) return "careered.io";
if (["hh", "hh.ru", "headhunter"].includes(s)) return "hh.ru";
if (["habr", "habr.com", "career.habr.com"].includes(s)) return "habr";
if (["tg", "telegram", "telegraph"].includes(s)) return "telegram";
```

## Monitoring

### Key Metrics

- **Total Jobs**: Sum across all sources
- **Success Rate**: Percentage of successfully parsed jobs
- **Processing Speed**: Jobs per minute
- **Data Quality**: Confidence scores and validation

### Logging

All parsers use consistent logging patterns:

```
✨ НОВАЯ: "Job Title" (URL)
🔄 ОБНОВЛЕНО: "Job Title" (URL)
🚫 ПРОПУЩЕНА (стоп-слова): "Job Title"
⚪ Существующий элемент пропущен
❌ Ошибка парсинга: Error message
```

## Troubleshooting

### Common Issues

1. **No new jobs found**
   - Check if all jobs already exist in database
   - Verify pagination logic
   - Check for API changes

2. **High skip rate**
   - Review stop words list
   - Check filtering logic
   - Verify data quality

3. **Duplicate key errors**
   - Ensure proper externalId generation
   - Check duplicate detection logic
   - Verify source normalization

### Debug Commands

```bash
# Check database connection
cd backend && pnpm tsx -e "
import mongoose from './src/config/database.js';
await mongoose.connect(process.env.MONGO_URI);
console.log('✅ Connected');
await mongoose.disconnect();
"

# Check specific source
cd backend && pnpm tsx -e "
import mongoose from './src/config/database.js';
await mongoose.connect(process.env.MONGO_URI);
const Vacancy = mongoose.model('Vacancy', new mongoose.Schema({}, { strict: false }));
const count = await Vacancy.countDocuments({ source: 'careered.io' });
console.log(\`Careered.io jobs: \${count}\`);
await mongoose.disconnect();
"
```

## Development

### Adding New Parsers

1. Create parser script in `backend/src/scripts/`
2. Add source normalization in `VacancyRepository.ts`
3. Update admin routes in `adminRoutes.ts`
4. Add documentation
5. Test thoroughly

### Testing

```bash
# Test specific parser
cd backend
MAX_PAGES=1 pnpm tsx src/scripts/fetchAndSaveFromCareeredAPI.ts

# Run all tests
pnpm test
```

---

**Last Updated**: January 2025  
**Maintainer**: Development Team  
**Status**: ✅ Production Ready
