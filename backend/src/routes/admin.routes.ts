import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth';
import { createAdmin, deleteUser, updateUserRole } from '../controllers/admin.controller';

const r = Router();

// Somente ADMIN pode acessar estas rotas
r.post('/users', requireAuth, requireRole('ADMIN'), createAdmin);
r.delete('/users/:id', requireAuth, requireRole('ADMIN'), deleteUser);
r.put('/users/:id/role', requireAuth, requireRole('ADMIN'), updateUserRole);

export default r;
