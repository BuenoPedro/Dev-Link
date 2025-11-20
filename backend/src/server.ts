import app from './app';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

const PORT = Number(process.env.PORT || 3000);

async function ensureDefaultAdmin() {
  try {
    const hasAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!hasAdmin) {
      const passwordHash = await bcrypt.hash('123123', 10);
      await prisma.user.create({
        data: {
          email: 'adm@devlink.local',
          passwordHash,
          role: 'ADMIN',
          profile: { create: { displayName: 'adm' } },
        },
      });
      console.log('[seed] Usuário admin padrão criado: adm@devlink.local / 123123');
    }
  } catch (e) {
    console.error('[seed] Falha ao garantir admin padrão', e);
  }
}

ensureDefaultAdmin().finally(() => {
  app.listen(PORT, () => {
    console.log(`DevLink API rodando em http://localhost:${PORT}`);
  });
});
