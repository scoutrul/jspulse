// backend/scripts/cron-runner.js
// Standalone scheduler that runs all parsers directly (no admin endpoints)
// Usage: node backend/scripts/cron-runner.js

import 'dotenv/config';
import cron from 'node-cron';
import { spawn } from 'node:child_process';

const TZ = process.env.TZ || 'Europe/Moscow';

function log(msg, ...rest) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [CRON-RUNNER] ${msg}`, ...rest);
}

function runNode(cmd, args = [], opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      env: { ...process.env },
      cwd: process.cwd(),
      ...opts
    });
    child.on('exit', (code) => resolve(code ?? 0));
  });
}

// Prevent concurrent runs per job
const running = new Map();
async function safeRun(id, fn) {
  if (running.get(id)) {
    log(`⚠️  Job already running, skip: ${id}`);
    return;
  }
  running.set(id, true);
  log(`▶️  Start: ${id}`);
  const started = Date.now();
  try {
    const code = await fn();
    const ms = Date.now() - started;
    if (code === 0) log(`✅ Done: ${id} in ${ms}ms`);
    else log(`❌ Exit code ${code}: ${id} in ${ms}ms`);
  } catch (e) {
    log(`❌ Error in ${id}:`, e?.message || e);
  } finally {
    running.set(id, false);
  }
}

// Jobs definitions
const jobs = [
  // Careered API (every 4m, offset 0)
  { id: 'careered-api', name: 'Careered API Parser', schedule: '*/4 * * * *', run: () => runNode('node', ['backend/parse-careered-api.js']) },

  // Habr (every 4m, offset 1)
  { id: 'habr', name: 'Habr Parser', schedule: '1-59/4 * * * *', run: () => runNode('node', ['backend/dist/scripts/fetchAndSaveFromHabr.js']) },

  // HH (every 4m, offset 2)
  { id: 'hh', name: 'HeadHunter Parser', schedule: '2-59/4 * * * *', run: () => runNode('node', ['backend/dist/scripts/fetchAndSaveFromHH.js']) },

  // Telegram parse channel first (test: every 4m)
  // { id: 'telegram-parse', name: 'Telegram Channel Parser', schedule: '*/4 * * * *', run: () => runNode('node', ['backend/dist/scripts/parseTelegramUlbi.js']) },
  // // Then enrich after 2m offset
  // { id: 'telegram-enrich', name: 'Telegram Enrich/Incremental', schedule: '2-59/4 * * * *', run: () => runNode('node', ['backend/dist/scripts/enrichTelegramTelegraph.js']) }
];

// Register cron tasks
for (const job of jobs) {
  cron.schedule(job.schedule, () => safeRun(job.id, job.run), { timezone: TZ });
  log(`🗓️  Registered: ${job.name} (${job.id}) @ ${job.schedule} [${TZ}]`);
}

log('🚀 Cron runner started');

// Keep process alive
process.stdin.resume();
