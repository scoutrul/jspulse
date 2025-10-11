import { type Request, type Response, type NextFunction } from 'express';
import { getFirebaseAdminAuth } from '../../config/firebase.js';

export function firebaseAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    console.log('Firebase Auth Middleware: Processing request to', req.url);
    console.log('Firebase Auth Middleware: Headers:', req.headers);

    const raw = (req.headers['authorization'] || req.headers['Authorization']) as string | undefined;
    console.log('Firebase Auth Middleware: Raw authorization header:', raw);

    if (!raw) {
      console.log('Firebase Auth Middleware: No authorization header');
      res.status(401).json({ success: false, error: { code: 401, message: 'Missing Authorization header' } });
      return;
    }
    const parts = raw.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.log('Firebase Auth Middleware: Invalid authorization header format');
      res.status(401).json({ success: false, error: { code: 401, message: 'Invalid Authorization header' } });
      return;
    }
    const token = parts[1];
    if (!token) {
      console.log('Firebase Auth Middleware: Empty bearer token');
      res.status(401).json({ success: false, error: { code: 401, message: 'Empty bearer token' } });
      return;
    }

    console.log('Firebase Auth Middleware: Token preview:', token.substring(0, 50) + '...');

    const auth = getFirebaseAdminAuth();
    auth.verifyIdToken(token)
      .then((decoded: any) => {
        console.log('Firebase Auth Middleware: Token verified successfully for user:', decoded.uid);
        (req as any).authUser = { uid: decoded.uid, email: decoded.email ?? null };
        next();
      })
      .catch((error) => {
        console.error('Firebase Auth Middleware: Token verification failed:', error.message);
        res.status(401).json({ success: false, error: { code: 401, message: 'Unauthorized' } });
      });
  } catch (error) {
    console.error('Firebase Auth Middleware: Unexpected error:', error);
    res.status(401).json({ success: false, error: { code: 401, message: 'Unauthorized' } });
  }
}
