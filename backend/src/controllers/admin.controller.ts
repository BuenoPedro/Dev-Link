import { Request, Response } from 'express';
import { prisma } from '../db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2).max(60).optional(),
});

export async function createAdmin(req: Request, res: Response) {
  try {
    const data = createAdminSchema.parse(req.body);

    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return res.status(409).json({ message: 'E-mail já cadastrado' });

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: 'ADMIN',
        profile: data.displayName ? { create: { displayName: data.displayName } } : undefined,
      },
    });

    return res.status(201).json({
      admin: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err: any) {
    if (err?.issues) {
      return res.status(400).json({ message: 'Dados inválidos', details: err.issues });
    }
    console.error('[createAdmin] error:', err);
    return res.status(500).json({ message: 'Erro ao criar admin' });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const id = BigInt(req.params.id);

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Usuário não encontrado' });

    await prisma.user.delete({ where: { id } });
    return res.status(204).end();
  } catch (err) {
    console.error('[deleteUser] error:', err);
    return res.status(500).json({ message: 'Erro ao remover usuário' });
  }
}

const updateRoleSchema = z.object({
  role: z.enum(['USER', 'COMPANY_ADMIN', 'ADMIN']),
});

export async function updateUserRole(req: Request, res: Response) {
  try {
    const id = BigInt(req.params.id);
    const { role } = updateRoleSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Usuário não encontrado' });

    const updated = await prisma.user.update({ where: { id }, data: { role } });
    return res.status(200).json({ user: { id: updated.id, email: updated.email, role: updated.role } });
  } catch (err: any) {
    if (err?.issues) {
      return res.status(400).json({ message: 'Dados inválidos', details: err.issues });
    }
    console.error('[updateUserRole] error:', err);
    return res.status(500).json({ message: 'Erro ao atualizar papel do usuário' });
  }
}
