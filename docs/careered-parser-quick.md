# Careered.io Parser - Technical Reference

## Quick Start

```bash
# Run parser
cd backend
MAX_PAGES=1 pnpm tsx src/scripts/fetchAndSaveFromCareeredAPI.ts

# Check results
pnpm tsx -e "
import mongoose from './src/config/database.js';
await mongoose.connect(process.env.MONGO_URI);
const Vacancy = mongoose.model('Vacancy', new mongoose.Schema({}, { strict: false }));
const count = await Vacancy.countDocuments({ source: 'careered.io' });
console.log(\`Careered.io jobs: \${count}\`);
await mongoose.disconnect();
"
```

## Core Files

```
backend/src/scripts/fetchAndSaveFromCareeredAPI.ts    # Main parser script
backend/src/utils/http/adapters/CareeredClient.ts     # API client
backend/src/repositories/VacancyRepository.ts         # Source normalization
backend/src/config/backendStopWords.ts                # Filtering rules
```

## API Endpoints

| Endpoint | Purpose | Method |
|----------|---------|--------|
| `/admin/parse-careered` | Trigger parsing | POST |
| `https://careered.io/jobs?tags=...&offset=0` | Get job listings | GET |

## Data Flow

```
1. Playwright navigates to API URL
2. Intercepts JSON response
3. Extracts job IDs and features
4. For each job: loads full page description via Playwright
5. Checks for duplicates in MongoDB
6. Applies stop words filter (title only)
7. Saves valid jobs with full descriptions to database
8. Continues with pagination
```

## Configuration

### Environment Variables
```bash
MAX_PAGES=5                    # Max pages to parse
CAREERED_MODE=playwright      # Force Playwright mode
MONGO_URI=mongodb://mongodb:27017/jspulse
```

### Parser Constants
```typescript
const SOURCE = "careered.io";
const API_LIMIT = 20;
const CONFIDENCE = 0.95;
```

## Database Schema

```typescript
{
  externalId: "careered.io:${jobId}",
  title: string,
  company: string,
  location: string,
  url: "https://careered.io/jobs/${jobId}",
  source: "careered.io",
  salaryFrom?: number,
  salaryTo?: number,
  salaryCurrency?: string,
  publishedAt: Date,
  isRemote: boolean,
  confidence: 0.95
}
```

## Filtering Logic

```typescript
// ✅ CORRECT - Only check title
if (containsBackendStopWords(title.toLowerCase())) {
  throw new Error('Вакансия содержит стоп-слова');
}

// ❌ WRONG - Don't check description
// if (containsBackendStopWords(title + description)) { ... }
```

## Error Handling

| Error Type | Cause | Solution |
|------------|-------|----------|
| `Could not intercept API response` | Network/Playwright issue | Check connectivity |
| `E11000 duplicate key error` | Duplicate externalId | Review duplicate logic |
| `API job not found for ID` | Job ID mismatch | Check API response |

## Monitoring

### Key Metrics
- **Total API Jobs**: 217
- **Success Rate**: ~85% (improved with full descriptions)
- **Processing Speed**: 20 jobs/request (with 500ms delay)
- **Data Quality**: High (full HTML + API structured)
- **Description Length**: 16,000-21,000 chars (vs 300-500 previously)

### Log Patterns
```
✨ НОВАЯ: "Job Title" (https://careered.io/jobs/uuid)
📄 Получено полное описание для uuid (19404 символов)
🚫 ПРОПУЩЕНА (стоп-слова): "Job Title"
⚪ Существующий элемент пропущен
```

## Testing

```bash
# Test with limited scope
MAX_PAGES=1 LIMIT_PER_PAGE=3 pnpm tsx src/scripts/fetchAndSaveFromCareeredAPI.ts

# Check specific job
pnpm tsx -e "
const jobId = '4ebbf6db-d09c-4c0b-bb70-cbe28118517f';
console.log(\`https://careered.io/jobs/\${jobId}\`);
"
```

## Maintenance

### Regular Checks
1. API structure changes
2. Stop words effectiveness
3. Parsing performance
4. Data quality

### Common Issues
- **High skip rate**: Review stop words
- **No new jobs**: Check pagination logic
- **Duplicate errors**: Verify externalId generation

---

**Status**: ✅ Production Ready  
**Last Updated**: January 2025
