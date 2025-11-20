import { Router } from 'express';
import { getUser, updateMyProfile, suggestedPeople } from '../controllers/users.controller';
import { requireAuth } from '../middlewares/auth';

const r = Router();

r.get('/:id', getUser);
r.put('/me/profile', requireAuth, updateMyProfile);
r.get('/me/suggestions', requireAuth, suggestedPeople);

export default r;
