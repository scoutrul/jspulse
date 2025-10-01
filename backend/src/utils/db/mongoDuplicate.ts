export function isMongoDuplicateError(error: unknown): boolean {
  if (!error) return false;
  const anyErr: any = error as any;
  if (anyErr?.code === 11000) return true;
  const msg = String(anyErr?.errmsg || anyErr?.message || anyErr || '');
  return /E11000 duplicate key/i.test(msg);
}

export function formatDuplicateMessage(context: {
  entity?: string;
  externalId?: string;
  title?: string;
  source?: string;
} = {}): string {
  const parts: string[] = [];
  parts.push('↩️ Skipped duplicate');
  if (context.entity) parts.push(context.entity);
  if (context.title) parts.push(`"${context.title}"`);
  if (context.externalId) parts.push(`(${context.externalId})`);
  if (context.source) parts.push(`[${context.source}]`);
  return parts.join(' ');
}

export function logDuplicateSkip(context?: {
  entity?: string;
  externalId?: string;
  title?: string;
  source?: string;
}): void {
  console.log(formatDuplicateMessage(context));
}
