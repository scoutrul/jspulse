import { type Request, type Response, type NextFunction } from 'express';
import { getFirebaseAdminAuth } from '../../config/firebase.js';

export function firebaseAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const raw = (req.headers['authorization'] || req.headers['Authorization']) as string | undefined;
    if (!raw) {
      res.status(401).json({ success: false, error: { code: 401, message: 'Missing Authorization header' } });
      return;
    }
    const parts = raw.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ success: false, error: { code: 401, message: 'Invalid Authorization header' } });
      return;
    }
    const token = parts[1];
    if (!token) {
      res.status(401).json({ success: false, error: { code: 401, message: 'Empty bearer token' } });
      return;
    }

    const auth = getFirebaseAdminAuth();
    auth.verifyIdToken(token)
      .then((decoded: any) => {
        (req as any).authUser = { uid: decoded.uid, email: decoded.email ?? null };
        next();
      })
      .catch(() => {
        res.status(401).json({ success: false, error: { code: 401, message: 'Unauthorized' } });
      });
  } catch {
    res.status(401).json({ success: false, error: { code: 401, message: 'Unauthorized' } });
  }
}
