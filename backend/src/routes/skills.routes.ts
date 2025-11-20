import { Router } from 'express';
import { addMySkill, listMySkills, removeMySkill } from '../controllers/skills.controller';
import { requireAuth } from '../middlewares/auth';

const r = Router();

r.get('/me', requireAuth, listMySkills);
r.post('/me', requireAuth, addMySkill);
r.delete('/me/:skillId', requireAuth, removeMySkill);

export default r;
