import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { registerCompany, listCompanies, getCompany, updateCompany, deleteCompany, myCompanies } from '../controllers/companies.controller';

const r = Router();

// público
r.get('/', listCompanies);
r.get('/:id', getCompany);

// auth
r.post('/register', registerCompany); // cadastro empresa + owner (não exige token)
r.get('/mine', requireAuth, myCompanies);
r.put('/:id', requireAuth, updateCompany);
r.delete('/:id', requireAuth, deleteCompany);

export default r;
