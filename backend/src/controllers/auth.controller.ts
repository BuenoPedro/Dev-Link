import { Request, Response } from 'express';
import { prisma } from '../db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthedRequest, AuthedUserCompanyRequest } from '../middlewares/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'devlink-secret';

const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    displayName: z.string().min(2).max(60).optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  });

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export function signToken(user: { id: bigint; role: string }) {
  return jwt.sign({ role: user.role }, JWT_SECRET, {
    subject: user.id.toString(),
    expiresIn: '7d',
  });
}

export async function register(req: Request, res: Response) {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return res.status(409).json({ message: 'E-mail já cadastrado' });

    const hash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hash,
        profile: data.displayName ? { create: { displayName: data.displayName } } : undefined,
      },
    });

    const token = signToken({ id: user.id, role: user.role });
    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return res.status(401).json({ message: 'Credenciais inválidas' });

    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Credenciais inválidas' });

    const token = signToken({ id: user.id, role: user.role });
    return res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

export async function me(req: AuthedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        skills: { include: { skill: true } },
        experiences: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

export async function cme(req: AuthedUserCompanyRequest, res: Response) {
  try {
    const ownerUserId = req.company!.ownerUserId;

    let company = await prisma.company.findFirst({
      where: { ownerUserId: ownerUserId }
    });

    if (!company) {
      company = await prisma.company.findFirst({
          where: { id: 1 }
        });
    }

    return res.json({ user: company });
  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}