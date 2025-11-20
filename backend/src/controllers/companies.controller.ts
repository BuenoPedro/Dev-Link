import { Response } from 'express';
import { prisma } from '../db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthedRequest, AuthedCompanyRequest } from '../middlewares/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'devlink-secret';

function signToken(user: { id: bigint; role: string }) {
  return (require('../controllers/auth.controller') as any).signToken
    ? (require('../controllers/auth.controller') as any).signToken(user)
    : jwt.sign({ role: user.role }, JWT_SECRET, { subject: user.id.toString(), expiresIn: '7d' });
}

// utils
const onlyDigits = (s: string) => s.replace(/\D+/g, '');

// -------- Schemas --------
const registerCompanySchema = z
  .object({
    name: z.string().min(2).max(140),
    foundedAt: z
      .union([z.string(), z.date()])
      .optional()
      .transform((v) => (v ? new Date(v as any) : undefined)),
    cnpj: z
      .string()
      .min(11)
      .max(32)
      .transform((s) => onlyDigits(s))
      .refine((s) => s.length === 14, 'CNPJ deve ter 14 dígitos'),
    email: z.string().email(),
    description: z.string(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  });

const updateCompanySchema = z.object({
  name: z.string().min(2).max(140).optional(),
  description: z.string().max(4000).optional(),
  siteUrl: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  foundedAt: z
    .union([z.string(), z.date()])
    .optional()
    .transform((v) => (v ? new Date(v as any) : undefined)),
  // cnpj normalmente não se altera; se quiser permitir, descomente com cuidado
  // cnpj: z.string().transform((s) => onlyDigits(s)).refine((s) => s.length === 14, 'CNPJ deve ter 14 dígitos').optional(),
});

// -------- Controllers --------

// POST /api/companies/register  -> cria usuário COMPANY_ADMIN + empresa e já autentica
export async function registerCompany(req: AuthedRequest, res: Response) {
  const data = registerCompanySchema.parse(req.body);

  const hash = await bcrypt.hash(data.password, 10);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: hash,
          role: 'COMPANY_ADMIN',
        },
      });

      const company = await tx.company.create({
        data: {
          name: data.name,
          cnpj: data.cnpj,
          description: data.description,
          foundedAt: data.foundedAt,
          ownerUserId: user.id,
        },
      });

      return { user, company };
    });

    const token = signToken({ id: result.user.id, role: result.user.role });
    return res.status(201).json({
      token,
      user: { id: result.user.id, email: result.user.email, role: result.user.role },
      company: result.company,
    });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      // unique constraint
      const target = Array.isArray(err?.meta?.target) ? err.meta.target.join(', ') : err?.meta?.target;
      const msg = target?.includes('email') ? 'E-mail já cadastrado' : target?.includes('cnpj') ? 'CNPJ já cadastrado' : 'Registro já existe';
      return res.status(409).json({ message: msg });
    }
    console.error('[registerCompany] error:', err);
    return res.status(500).json({ message: 'Erro ao cadastrar empresa' });
  }
}

// GET /api/companies  (público)
export async function listCompanies(_req: AuthedRequest, res: Response) {
  const list = await prisma.company.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json({ companies: list });
}

// GET /api/companies/:id (público)
export async function getCompany(req: AuthedCompanyRequest, res: Response) {
  try {
    const idParam = req.params.id;

    if (!idParam || isNaN(Number(idParam))) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const id = BigInt(idParam);

    const company = await prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }
    return res.json({ user: company });

  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

// PUT /api/companies/:id (owner ou ADMIN)
export async function updateCompany(req: AuthedRequest, res: Response) {
  const id = BigInt(req.params.id);
  const body = updateCompanySchema.parse(req.body);

  const current = await prisma.company.findUnique({ where: { id } });
  if (!current) return res.status(404).json({ message: 'Empresa não encontrada' });

  // permissão: ADMIN ou dono
  const isAdmin = req.user?.role === 'ADMIN';
  const isOwner = current.ownerUserId && req.user?.id === current.ownerUserId;
  if (!isAdmin && !isOwner) return res.status(403).json({ message: 'Sem permissão' });

  try {
    const updated = await prisma.company.update({
      where: { id },
      data: { ...body },
    });
    res.json({ company: updated });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return res.status(409).json({ message: 'Dados já cadastrados (provável conflito de CNPJ)' });
    }
    console.error('[updateCompany] error:', err);
    res.status(500).json({ message: 'Erro ao atualizar empresa' });
  }
}

// DELETE /api/companies/:id (somente ADMIN)
export async function deleteCompany(req: AuthedRequest, res: Response) {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: 'Sem permissão' });
  const id = BigInt(req.params.id);

  const existing = await prisma.company.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ message: 'Empresa não encontrada' });

  await prisma.company.delete({ where: { id } });
  res.status(204).end();
}

// GET /api/companies/mine (empresas do usuário logado)
export async function myCompanies(req: AuthedRequest, res: Response) {
  const userId = req.user!.id;
  const list = await prisma.company.findMany({
    where: { ownerUserId: userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ companies: list });
}
