import { Router } from 'express';
import { login, me, register, cme } from '../controllers/auth.controller';
import { requireAuth, requireAuthCompany } from '../middlewares/auth';

const r = Router();

r.post('/register', register);
r.post('/login', login);
r.get('/me', requireAuth, me);
r.get('/cme', requireAuthCompany, cme);
export default r;
