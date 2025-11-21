import { Request, Response } from 'express';
import { prisma } from '../db';
import { z } from 'zod';
import { AuthedRequest, AuthedCompanyRequest } from '../middlewares/auth';
import { EmploymentType, Seniority, LocationType } from '@prisma/client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'devlink-secret';

const jobSchema = z.object({
  title: z.string().min(3, 'Título muito curto'),
  description: z.string().min(10, 'Descrição muito curta'),
  employmentType: z.nativeEnum(EmploymentType), 
  seniority: z.nativeEnum(Seniority),
  locationType: z.nativeEnum(LocationType),
  locationCity: z.string().optional().nullable(),
  salaryMin: z.number().optional().nullable(),
  salaryMax: z.number().optional().nullable(),
  isActive: z.boolean().default(true),
});

const jobUpdateSchema = jobSchema.partial();

// --- FUNÇÕES DE EMPRESA ---

export async function createJob(req: AuthedCompanyRequest, res: Response) {
  try {
    const ownerUserId = req.company!.id;
    const company = await prisma.company.findFirst({ where: { ownerUserId: ownerUserId } });

    if (!company) return res.status(403).json({ message: 'Perfil de empresa necessário.' });

    const data = jobSchema.parse(req.body);
    const job = await prisma.job.create({
      data: { ...data, companyId: company.id },
    });
    return res.status(201).json({ job });
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno' });
  }
}

export async function updateJob(req: AuthedCompanyRequest, res: Response) {
  try {
    const { id } = req.params;
    const ownerUserId = req.company!.id;
    const jobId = BigInt(id);
    const data = jobUpdateSchema.parse(req.body);

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ message: 'Vaga não encontrada' });

    const company = await prisma.company.findFirst({ where: { ownerUserId: ownerUserId } });
    if (!company || company.id !== job.companyId) return res.status(403).json({ message: 'Sem permissão' });

    const updated = await prisma.job.update({ where: { id: jobId }, data });
    return res.json({ job: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno' });
  }
}

export async function deleteJob(req: AuthedCompanyRequest, res: Response) {
  try {
    const { id } = req.params;
    const ownerUserId = req.company!.id;
    const jobId = BigInt(id);

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ message: 'Vaga não encontrada' });

    const company = await prisma.company.findFirst({ where: { ownerUserId: ownerUserId } });
    if (!company || company.id !== job.companyId) return res.status(403).json({ message: 'Sem permissão' });

    await prisma.job.delete({ where: { id: jobId } });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno' });
  }
}

// --- FUNÇÕES DE LEITURA E CANDIDATURA ---

export async function listJobs(req: Request, res: Response) {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const authorId = req.query.authorId; 
    
    let currentUserId: bigint | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const payload = jwt.verify(token, JWT_SECRET) as any;
        currentUserId = BigInt(payload.sub);
      } catch {}
    }

    const where: any = { isActive: true };

    if (authorId === 'me' && currentUserId) {
      const company = await prisma.company.findFirst({ where: { ownerUserId: currentUserId } });
      if (!company) return res.json({ jobs: [] });
      where.companyId = company.id;
      delete where.isActive;
    } else if (authorId && !isNaN(Number(authorId))) {
      const targetUserCompany = await prisma.company.findFirst({ where: { ownerUserId: BigInt(authorId as string) } });
      if (targetUserCompany) where.companyId = targetUserCompany.id;
      else where.companyId = BigInt(authorId as string);
    }

    const jobs = await prisma.job.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, name: true, logoUrl: true, ownerUserId: true } },
        applications: currentUserId ? { where: { userId: currentUserId }, select: { id: true, status: true } } : false
      }
    });

    // MODIFICADO: Retorna applicationStatus
    const jobsWithStatus = jobs.map(job => {
        const app = job.applications && job.applications[0];
        return {
            ...job,
            hasApplied: !!app,
            applicationId: app?.id || null,
            applicationStatus: app?.status || null, // Novo campo
            applications: undefined 
        };
    });

    return res.json({ jobs: jobsWithStatus });
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno' });
  }
}

export async function getJob(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const jobId = BigInt(id);

    let currentUserId: bigint | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const payload = jwt.verify(token, JWT_SECRET) as any;
        currentUserId = BigInt(payload.sub);
      } catch {}
    }

    const jobInfo = await prisma.job.findUnique({
      where: { id: jobId },
      include: { company: true }
    });

    if (!jobInfo) return res.status(404).json({ message: 'Vaga não encontrada' });

    const isOwner = currentUserId && jobInfo.company.ownerUserId === currentUserId;

    const includeApplications = isOwner 
      ? {
          include: { 
            user: { 
              select: { 
                id: true, 
                email: true, 
                profile: { select: { displayName: true, avatarUrl: true, headline: true } } 
              } 
            } 
          },
          orderBy: { createdAt: 'desc' }
        }
      : (currentUserId ? {
          where: { userId: currentUserId },
          select: { id: true, status: true }
        } : false);

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: { select: { id: true, name: true, logoUrl: true, ownerUserId: true } },
        applications: includeApplications as any
      }
    });

    if (!job) return res.status(404).json({ message: 'Vaga não encontrada' });

    // MODIFICADO: Retorna applicationStatus para o candidato
    const userApp = !isOwner && Array.isArray(job.applications) ? job.applications[0] : null;

    const responseJob = {
      ...job,
      hasApplied: !!userApp,
      applicationStatus: userApp?.status || null, // Novo campo
      applications: isOwner ? job.applications : undefined 
    };

    return res.json({ job: responseJob });
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno' });
  }
}

export async function applyJob(req: AuthedRequest, res: Response) {
    try {
        const userId = req.user!.id;
        const jobId = BigInt(req.params.id);

        if (req.user!.role !== 'USER') return res.status(403).json({ message: 'Apenas candidatos.' });

        const existing = await prisma.jobApplication.findFirst({ where: { userId, jobId } });
        if (existing) return res.status(409).json({ message: 'Já aplicado.' });

        await prisma.jobApplication.create({
            data: { userId, jobId, status: 'APPLIED', coverNote: req.body.coverNote || null }
        });
        return res.status(201).json({ message: 'Sucesso!' });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao aplicar' });
    }
}

export async function cancelJobApplication(req: AuthedRequest, res: Response) {
    try {
        const userId = req.user!.id;
        const jobId = BigInt(req.params.id);

        // MODIFICADO: Impedir cancelamento se já foi REJEITADO (opcional, mas boa prática)
        const app = await prisma.jobApplication.findFirst({ where: { userId, jobId } });
        if (app?.status === 'REJECTED') {
             return res.status(400).json({ message: 'Não é possível cancelar uma candidatura recusada.' });
        }

        const deleted = await prisma.jobApplication.deleteMany({ where: { userId, jobId } });
        if (deleted.count === 0) return res.status(404).json({ message: 'Candidatura não encontrada.' });

        return res.status(200).json({ message: 'Cancelada.' });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao cancelar' });
    }
}

export async function rejectJobApplication(req: AuthedCompanyRequest, res: Response) {
  try {
    const { id, applicationId } = req.params;
    const ownerUserId = req.company!.id;
    const jobId = BigInt(id);
    const appId = BigInt(applicationId);

    const job = await prisma.job.findUnique({ where: { id: jobId }, include: { company: true } });
    if (!job) return res.status(404).json({ message: 'Vaga não encontrada' });

    const company = await prisma.company.findFirst({ where: { ownerUserId } });
    if (!company || company.id !== job.companyId) return res.status(403).json({ message: 'Sem permissão' });

    await prisma.jobApplication.update({
        where: { id: appId },
        data: { status: 'REJECTED' }
    });

    return res.json({ message: 'Candidato recusado.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno' });
  }

  
}

export async function approveJobApplication(req: AuthedCompanyRequest, res: Response) {
  try {
    const { id, applicationId } = req.params; 
    const ownerUserId = req.company!.id;
    const jobId = BigInt(id);
    const appId = BigInt(applicationId);

    // 1. Verifica propriedade da vaga
    const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { company: true }
    });

    if (!job) return res.status(404).json({ message: 'Vaga não encontrada' });

    const company = await prisma.company.findFirst({ where: { ownerUserId } });
    
    if (!company || company.id !== job.companyId) {
        return res.status(403).json({ message: 'Sem permissão' });
    }

    // 2. Atualiza status para APPROVED
    await prisma.jobApplication.update({
        where: { id: appId },
        data: { status: 'APPROVED' }
    });

    return res.json({ message: 'Candidato aprovado com sucesso!' });

  } catch (error) {
    console.error('Erro ao aprovar:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}