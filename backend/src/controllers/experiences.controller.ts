import { Response } from 'express';
import { prisma } from '../db';
import { z } from 'zod';
import { AuthedRequest } from '../middlewares/auth';

const experienceSchema = z.object({
  company: z.string().min(2).max(200),
  title: z.string().min(2).max(200),
  startDate: z.union([z.string(), z.date()]).transform((v) => new Date(v as any)),
  endDate: z
    .union([z.string(), z.date()])
    .optional()
    .nullable()
    .transform((v) => (v ? new Date(v as any) : null)),
  isCurrent: z.boolean().optional(),
  description: z.string().max(4000).optional(),
});

export async function listMyExperiences(req: AuthedRequest, res: Response) {
  const userId = req.user!.id;
  const items = await prisma.experience.findMany({
    where: { userId },
    orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
  });
  res.json({ experiences: items });
}

export async function createMyExperience(req: AuthedRequest, res: Response) {
  const userId = req.user!.id;
  const data = experienceSchema.parse(req.body);
  const exp = await prisma.experience.create({
    data: { ...data, userId },
  });
  res.status(201).json({ experience: exp });
}

export async function updateMyExperience(req: AuthedRequest, res: Response) {
  const userId = req.user!.id;
  const id = BigInt(req.params.id);
  const data = experienceSchema.partial().parse(req.body);

  const updated = await prisma.experience.updateMany({
    where: { id, userId },
    data,
  });
  if (!updated.count) return res.status(404).json({ message: 'Experiência não encontrada' });

  const exp = await prisma.experience.findUnique({ where: { id } });
  res.json({ experience: exp });
}

export async function deleteMyExperience(req: AuthedRequest, res: Response) {
  const userId = req.user!.id;
  const id = BigInt(req.params.id);
  const deleted = await prisma.experience.deleteMany({ where: { id, userId } });
  if (!deleted.count) return res.status(404).json({ message: 'Experiência não encontrada' });
  res.status(204).end();
}
