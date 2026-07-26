import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'milkmania_super_secret_liquid_fluid_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    name: string;
    role: string;
  };
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'No authentication token provided.' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Malformed authorization header.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      username: string;
      name: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return res.status(403).json({ message: 'Invalid or expired session token.' });
  }
}
