import { Router, Request, Response } from 'express';
import { AdminController } from '../presentation/controllers/AdminController.js';
import { GetSystemStatsUseCase } from '../application/use-cases/GetSystemStatsUseCase.js';
import { ClearCacheUseCase } from '../application/use-cases/ClearCacheUseCase.js';
import { DeleteVacancyUseCase } from '../application/use-cases/DeleteVacancyUseCase.js';
import { parsingLogService, type ParsingSource } from '../services/ParsingLogService.js';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const router: Router = Router();

// ESM-safe __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirnameResolved = path.dirname(__filename);

let cronProcess: ChildProcess | null = null;
let cronStartedAt: number | null = null;

function resolveParserCommand(source: ParsingSource): { cmd: string; args: string[]; label: string; scriptPath: string } | null {
  // Compiled runtime: this file is at backend/dist/routes
  const distScriptsDir = path.resolve(__dirnameResolved, '..', 'scripts'); // backend/dist/scripts

  const labelMap: Record<ParsingSource, string> = {
    'habr': 'Habr',
    'hh': 'HeadHunter',
    'telegram-parse': 'Telegram Parse',
    'telegram-enrich': 'Telegram Enrich',
    'careered-api': 'Careered API',
    'cron': 'Cron Runner'
  } as const;

  const baseName: Record<ParsingSource, string> = {
    'habr': 'fetchAndSaveFromHabr',
    'hh': 'fetchAndSaveFromHH',
    'telegram-parse': 'parseTelegramUlbi',
    'telegram-enrich': 'enrichTelegramTelegraph',
    'careered-api': 'fetchAndSaveFromCareered',
    'cron': ''
  } as const;

  if (source === 'cron') return null;

  const js = path.join(distScriptsDir, `${baseName[source]}.js`);

  if (fs.existsSync(js)) {
    return { cmd: 'node', args: [js], label: labelMap[source], scriptPath: js };
  }

  return null;
}

const createAdminController = (req: Request): AdminController => {
  const getSystemStatsUseCase = req.resolve<GetSystemStatsUseCase>('GetSystemStatsUseCase');
  const clearCacheUseCase = req.resolve<ClearCacheUseCase>('ClearCacheUseCase');
  const deleteVacancyUseCase = req.resolve<DeleteVacancyUseCase>('DeleteVacancyUseCase');
  return new AdminController(getSystemStatsUseCase, clearCacheUseCase, deleteVacancyUseCase);
};

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const adminController = createAdminController(req);
    await adminController.getSystemStats(req, res);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 500, message: 'Internal server error' } });
  }
});

router.post('/clear-cache', async (req: Request, res: Response) => {
  try {
    const adminController = createAdminController(req);
    await adminController.clearCache(req, res);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 500, message: 'Internal server error' } });
  }
});

router.delete('/vacancy/:id', async (req: Request, res: Response) => {
  try {
    const adminController = createAdminController(req);
    await adminController.deleteVacancy(req, res);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 500, message: 'Internal server error' } });
  }
});

// Cron-runner management
router.post('/cron/start', async (req: Request, res: Response) => {
  try {
    if (cronProcess && !cronProcess.killed) {
      res.json({ success: true, data: { running: true, pid: cronProcess.pid, startedAt: cronStartedAt } });
      return;
    }
    const candidates = [
      path.resolve(__dirnameResolved, '..', '..', 'scripts', 'cron-runner.js'),     // backend/scripts/cron-runner.js
      path.resolve(__dirnameResolved, '..', 'scripts', 'cron-runner.js')            // backend/dist/scripts/cron-runner.js
    ];
    const cronScript = candidates.find(p => fs.existsSync(p));
    if (!cronScript) {
      res.status(404).json({ success: false, error: { code: 404, message: 'cron-runner.js not found (looked in backend/scripts and backend/dist/scripts)' } });
      return;
    }
    cronProcess = spawn('node', [cronScript], { cwd: path.resolve(__dirnameResolved, '..', '..') });
    cronStartedAt = Date.now();
    parsingLogService.addLog('cron', '🚀 Cron runner started', 'success');
    cronProcess.stdout?.on('data', (d: Buffer) => parsingLogService.addLog('cron', d.toString().trim(), 'info'));
    cronProcess.stderr?.on('data', (d: Buffer) => parsingLogService.addLog('cron', d.toString().trim(), 'error'));
    cronProcess.on('close', (code) => {
      parsingLogService.addLog('cron', `Cron runner exited with code ${code}`, code === 0 ? 'success' : 'error');
      cronProcess = null;
      cronStartedAt = null;
    });
    res.json({ success: true, data: { running: true, pid: cronProcess.pid, startedAt: cronStartedAt } });
  } catch (e: any) {
    res.status(500).json({ success: false, error: { code: 500, message: e?.message || 'Failed to start cron' } });
  }
});

router.post('/cron/stop', async (req: Request, res: Response) => {
  try {
    if (!cronProcess || cronProcess.killed) {
      res.json({ success: true, data: { running: false } });
      return;
    }
    const ok = cronProcess.kill('SIGTERM');
    if (ok) parsingLogService.addLog('cron', '🛑 Cron runner stopped', 'info');
    res.json({ success: true, data: { running: false, stopped: ok } });
  } catch (e: any) {
    res.status(500).json({ success: false, error: { code: 500, message: e?.message || 'Failed to stop cron' } });
  }
});

router.get('/cron/status', async (_req: Request, res: Response) => {
  res.json({ success: true, data: { running: !!cronProcess && !cronProcess.killed, pid: cronProcess?.pid || null, startedAt: cronStartedAt } });
});

// Ingest external logs (e.g., from cron-runner)
router.post('/parsing-logs/ingest', async (req: Request, res: Response) => {
  try {
    const { source = 'cron', message, type = 'info' } = req.body || {};
    if (!message || typeof message !== 'string') {
      res.status(400).json({ success: false, error: { code: 400, message: 'message is required' } });
      return;
    }
    const src = (source as ParsingSource) || 'cron';
    parsingLogService.addLog(src, message, type === 'error' ? 'error' : type === 'success' ? 'success' : 'info');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 500, message: 'Failed to ingest log' } });
  }
});

router.post('/parse/:source', async (req: Request, res: Response) => {
  try {
    const source = req.params.source as ParsingSource;

    const resolved = resolveParserCommand(source);
    if (!resolved) {
      const baseName: Record<ParsingSource, string> = {
        'habr': 'fetchAndSaveFromHabr',
        'hh': 'fetchAndSaveFromHH',
        'telegram-parse': 'parseTelegramUlbi',
        'telegram-enrich': 'enrichTelegramTelegraph',
        'careered-api': 'fetchAndSaveFromCareered',
        'cron': ''
      } as const;

      const expectedFile = baseName[source] ? `${baseName[source]}.js` : `${source}.js`;
      const msg = `Parser script not found for '${source}'. Ensure backend is built and file exists in backend/dist/scripts/${expectedFile}.`;
      parsingLogService.addLog(source, msg, 'error');
      res.status(404).json({ success: false, error: { code: 404, message: msg } });
      return;
    }

    const { cmd, args, label, scriptPath } = resolved;
    parsingLogService.addLog(source, `Starting ${label} parser... (${scriptPath})`, 'info');

    const child = spawn(cmd, args, { cwd: path.resolve(__dirnameResolved, '..', '..') });

    child.stdout.on('data', (data: Buffer) => {
      const texts = (data.toString().split(/\r?\n/)).filter(Boolean).map(s => s.trim()).slice(0, 5);
      texts.forEach((t) => t && parsingLogService.addLog(source, t, 'info'));
    });
    child.stderr.on('data', (data: Buffer) => {
      const texts = (data.toString().split(/\r?\n/)).filter(Boolean).map(s => s.replace(/\s*\(file:\/\/[^)]+\)/g, '').split(' at ')[0].trim()).slice(0, 5);
      texts.forEach((t) => t && parsingLogService.addLog(source, t, 'error'));
    });
    child.on('error', (err) => {
      parsingLogService.addLog(source, `Failed to start ${label} parser: ${err.message}`, 'error');
    });
    child.on('close', (code) => {
      if (code === 0) {
        parsingLogService.addLog(source, `${label} parser finished successfully`, 'success');
      } else {
        parsingLogService.addLog(source, `${label} parser exited with code ${code}`, 'error');
      }
    });

    res.json({ success: true, data: { started: true, pid: child.pid, script: scriptPath } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 500, message: error?.message || 'Failed to start parser' } });
  }
});

router.get('/parsing-logs', async (req: Request, res: Response) => {
  try {
    const source = req.query.source as ParsingSource | undefined;
    const logs = parsingLogService.getLogs(source);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 500, message: 'Failed to get parsing logs' } });
  }
});

router.post('/parse-habr', async (req: Request, res: Response) => {
  req.params.source = 'habr' as ParsingSource;
  // @ts-ignore
  return router.handle(req, res, () => { });
});

router.post('/parse-hh', async (req: Request, res: Response) => {
  req.params.source = 'hh' as ParsingSource;
  // @ts-ignore
  return router.handle(req, res, () => { });
});

router.post('/parse-telegram', async (req: Request, res: Response) => {
  req.params.source = 'telegram-parse' as ParsingSource;
  // @ts-ignore
  return router.handle(req, res, () => { });
});

router.post('/parse-careered', async (req: Request, res: Response) => {
  req.params.source = 'careered-api' as ParsingSource;
  // @ts-ignore
  return router.handle(req, res, () => { });
});

export default router;
