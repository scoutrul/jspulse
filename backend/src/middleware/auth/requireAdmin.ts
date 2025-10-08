import { type Request, type Response, type NextFunction } from 'express';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const allow = process.env.ADMIN_ALLOW_EMAILS || '';
  const allowList = allow.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const email = (((req as any).authUser?.email) || '').toLowerCase();
  if (!email || !allowList.includes(email)) {
    return res.status(403).json({ success: false, error: { code: 403, message: 'Forbidden' } });
  }
  return next();
}
