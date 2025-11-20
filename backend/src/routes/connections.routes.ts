import { Router } from 'express';
import { myConnections, myRequests, requestConnection, respondConnection } from '../controllers/connections.controller';
import { requireAuth } from '../middlewares/auth';

const r = Router();

// Solicitar conexão
r.post('/request', requireAuth, requestConnection);

// Responder a uma solicitação de conexão
r.post('/respond', requireAuth, respondConnection);

// Listar minhas conexões
r.get('/my', requireAuth, myConnections);

// Listar solicitações pendentes recebidas
r.get('/requests', requireAuth, myRequests);

export default r;
