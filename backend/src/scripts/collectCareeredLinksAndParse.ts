import { CareeredClient } from "../utils/http/adapters/CareeredClient.js";
import { containsBackendStopWords } from "../config/backendStopWords.js";
import * as cheerio from "cheerio";

function makeSlug(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function extractLinksFromHtml(html: string): Promise<string[]> {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  $('a[href*="/jobs/"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href) links.add(href.startsWith('http') ? href : `https://careered.io${href}`);
  });
  // Fallback: build slugs from card titles if no anchors
  if (links.size === 0) {
    $('.overflow-hidden.rounded-lg.border.bg-white span[title], .overflow-hidden.rounded-lg.border.bg-white span').each((_, el) => {
      const title = $(el).attr('title') || $(el).text();
      if (title && title.trim().length > 0) {
        const slug = makeSlug(title);
        links.add(`https://careered.io/jobs/${slug}`);
      }
    });
  }
  return Array.from(links);
}

async function run() {
  const mode = (process.env.CAREERED_MODE as any) || 'playwright';
  const maxPages = Number(process.env.MAX_PAGES || '3');
  const limitPerPage = Number(process.env.LIMIT_PER_PAGE || '0'); // 0 = all

  const client = new CareeredClient({ logging: true, mode });
  const allLinks: string[] = [];
  const keptLinks: string[] = [];

  for (let page = 1; page <= maxPages; page++) {
    console.log(`\n=== List page ${page}/${maxPages} ===`);
    const list = await client.getListPage({ page });
    let links = list.jobLinks;

    if (!links || links.length === 0) {
      console.log('No links from API/Playwright extraction; deriving from rendered HTML...');
      links = await extractLinksFromHtml(list.html);
    }

    console.log(`Found links: ${links.length}`);
    if (limitPerPage > 0) links = links.slice(0, limitPerPage);

    for (const url of links) {
      allLinks.push(url);
    }

    // Filter by stop-words using title-only heuristic (extract from URL slug)
    const filtered = links.filter(url => {
      const part = (url.split('/jobs/')[1] || url).replace(/[-_]/g, ' ');
      const titleLower = decodeURIComponent(part).toLowerCase();
      return !containsBackendStopWords(titleLower);
    });

    keptLinks.push(...filtered);
  }

  console.log(`\nTotal links collected: ${allLinks.length}`);
  console.log(`Links after stop-words (title-only) filter: ${keptLinks.length}`);

  // Fetch details for kept links
  let ok = 0, bad = 0;
  for (const url of keptLinks) {
    console.log(`\n--- Detail: ${url}`);
    const res = await client.getVacancyPage(url);
    const d = res.jobDetail;
    if (!d) {
      console.log('❌ No jobDetail');
      bad++;
      continue;
    }
    const missing: string[] = [];
    if (!d.title) missing.push('title');
    if (!d.company) missing.push('company');
    if (!d.location) missing.push('location');
    if (!d.description || d.description.length < 30) missing.push('description');
    if (!d.fullDescription || d.fullDescription.length < 100) missing.push('fullDescription');

    if (missing.length) {
      console.log(`⚠️ Missing/weak: ${missing.join(', ')}`);
      bad++;
    } else {
      console.log(`✅ OK: ${d.title} (${d.location})`);
      ok++;
    }
  }

  console.log(`\nSummary: ok=${ok}, bad=${bad}, kept=${keptLinks.length}, collected=${allLinks.length}`);
  process.exit(0);
}

run();
