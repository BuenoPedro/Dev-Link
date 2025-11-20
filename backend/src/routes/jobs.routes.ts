import { Router } from 'express';
import { createJob, listJobs, getJob, updateJob, deleteJob, applyJob , cancelJobApplication } from '../controllers/jobs.controller';
import { requireAuthCompany, requireAuth } from '../middlewares/auth';

const r = Router();

// Rotas públicas (ou que tratam auth internamente dependendo do filtro)
r.get('/', listJobs);      // Lista vagas (com filtros ?authorId=me, ?limit=, etc)
r.get('/:id', getJob);     // Detalhe da vaga


r.post('/:id/apply', requireAuth, applyJob);
r.delete('/:id/apply', requireAuth, cancelJobApplication);

// Rotas protegidas
r.post('/', requireAuthCompany, createJob);       // Criar vaga
r.put('/:id', requireAuthCompany, updateJob);     // Editar vaga
r.delete('/:id', requireAuthCompany, deleteJob);  // Deletar vaga

export default r;