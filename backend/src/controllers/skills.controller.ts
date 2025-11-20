import { Response } from 'express';
import { prisma } from '../db';
import { z } from 'zod';
import { AuthedRequest } from '../middlewares/auth';

const addSkillSchema = z.object({
  name: z.string().min(1).max(60),
  proficiency: z.number().min(1).max(5).optional(),
  yearsExp: z.number().min(0).max(60).optional(),
});

export async function addMySkill(req: AuthedRequest, res: Response) {
  const { name, proficiency, yearsExp } = addSkillSchema.parse(req.body);
  const userId = req.user!.id;

  const skill = await prisma.skill.upsert({
    where: { name },
    create: { name },
    update: {},
  });

  const link = await prisma.userSkill.upsert({
    where: { userId_skillId: { userId, skillId: skill.id } },
    create: { userId, skillId: skill.id, proficiency: proficiency ?? 3, yearsExp: yearsExp ?? 0 },
    update: { proficiency: proficiency ?? 3, yearsExp: yearsExp ?? 0 },
  });

  return res.status(201).json({ skill: { ...skill, link } });
}

export async function listMySkills(req: AuthedRequest, res: Response) {
  const userId = req.user!.id;
  const skills = await prisma.userSkill.findMany({
    where: { userId },
    include: { skill: true },
  });
  return res.json({ skills });
}

export async function removeMySkill(req: AuthedRequest, res: Response) {
  const skillId = BigInt(req.params.skillId);
  const userId = req.user!.id;

  await prisma.userSkill.delete({
    where: { userId_skillId: { userId, skillId } },
  });

  return res.json({ removed: true });
}
