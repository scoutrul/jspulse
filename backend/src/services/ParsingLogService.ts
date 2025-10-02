import { EventEmitter } from 'events';

export type ParsingSource = 'careered-api' | 'habr' | 'hh' | 'telegram-parse' | 'telegram-enrich';

export interface ParsingLogEntry {
  id: string;
  source: ParsingSource;
  message: string;
  type: 'info' | 'error' | 'success';
  timestamp: string; // ISO string
}

/**
 * In-memory storage for parsing logs with simple pub/sub.
 * Not persistent; suitable for development/admin dashboard live view.
 */
export class ParsingLogService extends EventEmitter {
  private logsBySource: Map<ParsingSource, ParsingLogEntry[]> = new Map();
  private maxEntriesPerSource = 500;

  addLog(source: ParsingSource, message: string, type: 'info' | 'error' | 'success' = 'info'): void {
    const entry: ParsingLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      source,
      message,
      type,
      timestamp: new Date().toISOString()
    };
    const list = this.logsBySource.get(source) ?? [];
    list.push(entry);
    // trim
    if (list.length > this.maxEntriesPerSource) {
      list.splice(0, list.length - this.maxEntriesPerSource);
    }
    this.logsBySource.set(source, list);
    this.emit('log', entry);
  }

  getLogs(source?: ParsingSource): ParsingLogEntry[] {
    if (!source) {
      // Flatten all sources (limited)
      const all = Array.from(this.logsBySource.values()).flat();
      return all.slice(-this.maxEntriesPerSource);
    }
    return this.logsBySource.get(source) ?? [];
  }

  clear(source?: ParsingSource): void {
    if (!source) {
      this.logsBySource.clear();
      return;
    }
    this.logsBySource.delete(source);
  }
}

export const parsingLogService = new ParsingLogService();
