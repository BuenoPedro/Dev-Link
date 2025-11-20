import { Request, Response } from 'express';
import { prisma } from '../db';
import { z } from 'zod';
import { AuthedCompanyRequest, AuthedRequest } from '../middlewares/auth';
// CORREÇÃO: Importar os Enums gerados pelo Prisma para tipagem correta
import { EmploymentType, Seniority, LocationType } from '@prisma/client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "mude-isto-para-um-segredo-bem-grande";

// Schema de validação alinhado com os Enums do Prisma
const jobSchema = z.object({
  title: z.string().min(3, 'Título muito curto'),
  description: z.string().min(10, 'Descrição muito curta'),
  // CORREÇÃO: Usar z.nativeEnum para validar e tipar corretamente
  employmentType: z.nativeEnum(EmploymentType), 
  seniority: z.nativeEnum(Seniority),
  locationType: z.nativeEnum(LocationType),
  locationCity: z.string().optional().nullable(),
  salaryMin: z.number().optional().nullable(),
  salaryMax: z.number().optional().nullable(),
  isActive: z.boolean().default(true),
});

// Schema parcial para atualizações (todos os campos opcionais)
const jobUpdateSchema = jobSchema.partial();

export async function createJob(req: AuthedCompanyRequest, res: Response) {
  try {
    const ownerUserId = req.company!.id;

    // 1. Identificar a empresa do usuário logado
    const company = await prisma.company.findFirst({
      where: { ownerUserId: ownerUserId }
    });

    if (!company) {
      return res.status(403).json({ message: 'Você precisa ter um perfil de empresa para publicar vagas.' });
    }

    // 2. Validar dados com o schema que usa os Enums
    const data = jobSchema.parse(req.body);

    // 3. Criar vaga vinculada à empresa
    const job = await prisma.job.create({
      data: {
        ...data,
        companyId: company.id,
        // Agora o TypeScript aceita 'data.employmentType' pois é do tipo EmploymentType
      },
    });

    return res.status(201).json({ job });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    console.error('Erro ao criar vaga:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

export async function listJobs(req: Request, res: Response) {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const authorId = req.query.authorId;

    // Tenta identificar o usuário logado (opcionalmente) para saber se ele já aplicou
    let currentUserId: bigint | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const payload = jwt.verify(token, JWT_SECRET) as any;
        currentUserId = BigInt(payload.sub);
      } catch {} // Se token inválido/expirado, apenas segue como visitante
    }

    const where: any = { isActive: true };

    // ... (Lógica de filtros de authorId mantida igual) ...
    if (authorId === 'me' && currentUserId) {
        const company = await prisma.company.findFirst({ where: { ownerUserId: currentUserId } });
        if (!company) return res.json({ jobs: [] });
        where.companyId = company.id;
        delete where.isActive;
    } else if (authorId && !isNaN(Number(authorId))) {
        where.companyId = BigInt(authorId as string);
    }
    // ...

    const jobs = await prisma.job.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: { id: true, name: true, logoUrl: true, ownerUserId: true }
        },
        // Inclui aplicações APENAS do usuário atual para verificar status
        applications: currentUserId ? {
            where: { userId: currentUserId },
            select: { id: true, status: true }
        } : false
      }
    });

    // Formata a resposta para adicionar o booleano hasApplied
    const jobsWithStatus = jobs.map(job => {
        const app = job.applications && job.applications[0];
        return {
            ...job,
            hasApplied: !!app, // true se tiver aplicação
            applicationId: app?.id || null,
            applications: undefined // Remove o array para limpar o JSON
        };
    });

    return res.json({ jobs: jobsWithStatus });
  } catch (error) {
    console.error('Erro ao listar vagas:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

export async function applyJob(req: AuthedRequest, res: Response) {
    try {
        const userId = req.user!.id;
        const jobId = BigInt(req.params.id);

        // Verifica Role
        if (req.user!.role !== 'USER') {
            return res.status(403).json({ message: 'Apenas usuários registrados como candidatos podem se aplicar para vagas.' });
        }

        // Verifica se vaga existe
        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job) return res.status(404).json({ message: 'Vaga não encontrada' });

        // Verifica se já aplicou
        const existing = await prisma.jobApplication.findFirst({
            where: { userId, jobId }
        });

        if (existing) {
            return res.status(409).json({ message: 'Você já se candidatou para esta vaga.' });
        }

        // Cria aplicação
        await prisma.jobApplication.create({
            data: {
                userId,
                jobId,
                status: 'APPLIED', // Status inicial
                coverNote: req.body.coverNote || null
            }
        });

        return res.status(201).json({ message: 'Candidatura realizada com sucesso!' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao aplicar para vaga' });
    }
}

export async function cancelJobApplication(req: AuthedRequest, res: Response) {
    try {
        const userId = req.user!.id;
        const jobId = BigInt(req.params.id);

        // Deleta a aplicação onde user e job coincidem
        const deleted = await prisma.jobApplication.deleteMany({
            where: {
                userId: userId,
                jobId: jobId
            }
        });

        if (deleted.count === 0) {
            return res.status(404).json({ message: 'Candidatura não encontrada.' });
        }

        return res.status(200).json({ message: 'Candidatura cancelada.' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao cancelar candidatura' });
    }
}

export async function getJob(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const job = await prisma.job.findUnique({
      where: { id: BigInt(id) },
      include: {
        company: true
      }
    });

    if (!job) {
      return res.status(404).json({ message: 'Vaga não encontrada' });
    }

    return res.json({ job });
  } catch (error) {
    console.error('Erro ao buscar vaga:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

export async function updateJob(req: AuthedCompanyRequest, res: Response) {
  try {
    const { id } = req.params;
    const ownerUserId = req.company!.id;

    // Usa o schema parcial para validar apenas campos enviados
    const data = jobUpdateSchema.parse(req.body);

    const job = await prisma.job.findUnique({
      where: { id: BigInt(id) },
    });

    if (!job) return res.status(404).json({ message: 'Vaga não encontrada' });

    const userCompany = await prisma.company.findFirst({
      where: { ownerUserId: ownerUserId }
    });

    // Verifica se a empresa do usuário é a dona da vaga
    if (!userCompany || userCompany.id !== job.companyId) {
      return res.status(403).json({ message: 'Sem permissão para editar esta vaga' });
    }

    const updated = await prisma.job.update({
      where: { id: BigInt(id) },
      data // Aqui também o TS aceitará os Enums corretamente
    });

    return res.json({ job: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    console.error('Erro ao atualizar vaga:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

export async function deleteJob(req: AuthedCompanyRequest, res: Response) {
  try {
    const { id } = req.params;
    const ownerUserId = req.company!.id;

    const job = await prisma.job.findUnique({
      where: { id: BigInt(id) },
    });

    if (!job) return res.status(404).json({ message: 'Vaga não encontrada' });

    const userCompany = await prisma.company.findFirst({
      where: { ownerUserId: ownerUserId }
    });

    if (!userCompany || userCompany.id !== job.companyId) {
      return res.status(403).json({ message: 'Sem permissão para excluir esta vaga' });
    }

    await prisma.job.delete({
      where: { id: BigInt(id) }
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir vaga:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}