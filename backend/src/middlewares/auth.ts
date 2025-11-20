import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'devlink-secret';

export type Role = 'USER' | 'COMPANY_ADMIN' | 'ADMIN';

export interface AuthedRequest extends Request {
  user?: { id: bigint; role: Role };
}

export interface AuthedCompanyRequest extends Request {
  company?: { id: bigint; };
}

export interface AuthedUserCompanyRequest extends Request {
  company?: { ownerUserId: bigint };
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'Token ausente' + Object.values(req)
   });

  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = { id: BigInt(payload.sub), role: payload.role };
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

export function requireAuthCompany(req: AuthedUserCompanyRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'Token ausente' });

  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.company = { ownerUserId: BigInt(payload.sub) };
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Não autenticado' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Sem permissão' });
    next();
  };
}
