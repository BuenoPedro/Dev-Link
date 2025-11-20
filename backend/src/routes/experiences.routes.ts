import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { listMyExperiences, createMyExperience, updateMyExperience, deleteMyExperience } from '../controllers/experiences.controller';

const r = Router();

r.get('/me', requireAuth, listMyExperiences);
r.post('/me', requireAuth, createMyExperience);
r.put('/:id', requireAuth, updateMyExperience);
r.delete('/:id', requireAuth, deleteMyExperience);

export default r;
