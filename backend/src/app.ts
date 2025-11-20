import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users.routes';
import skillRoutes from './routes/skills.routes';
import connectionRoutes from './routes/connections.routes';
import experienceRoutes from './routes/experiences.routes';
import companyRoutes from './routes/companies.routes';
import postRoutes from './routes/posts.routes';
import jobsRoutes from './routes/jobs.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use(
  rateLimit({
    windowMs: 60_000,
    max: 120,
  })
);

// BigInt -> string no JSON
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/experiences', experienceRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
