import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from '../services/auth';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware to require authentication
 * Extracts JWT from Authorization header and validates it
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Invalid authorization format. Use: Bearer <token>' });
    }

    const token = parts[1];
    const payload = AuthService.verifyToken(token);

    // Attach user info to request
    req.user = payload;

    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional auth middleware - doesn't fail if no token
 * Useful for routes that work differently for logged-in users
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const parts = authHeader.split(' ');

      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const payload = AuthService.verifyToken(token);
        req.user = payload;
      }
    }

    next();
  } catch {
    // Token invalid, but continue without user
    next();
  }
}

export default requireAuth;
