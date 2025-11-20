import { Response } from 'express';
import { prisma } from '../db';
import { AuthedRequest } from '../middlewares/auth';

export async function requestConnection(req: AuthedRequest, res: Response) {
  try {
    const requesterId = req.user!.id; // bigint
    const { addresseeId } = req.body;

    if (!addresseeId) {
      return res.status(400).json({ error: 'addresseeId é obrigatório' });
    }

    const addressee = BigInt(addresseeId);
    if (addressee === requesterId) {
      return res.status(400).json({ error: 'Não é possível conectar consigo mesmo' });
    }

    // Verificar se o usuário de destino existe
    const targetUser = await prisma.user.findUnique({
      where: { id: addressee },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se já existe uma conexão
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId: addressee },
          { requesterId: addressee, addresseeId: requesterId },
        ],
      },
    });

    if (existingConnection) {
      return res.status(400).json({ error: 'Conexão já existe' });
    }

    // Criar nova solicitação
    const connection = await prisma.connection.create({
      data: {
        requesterId,
        addresseeId: addressee,
        status: 'PENDING',
      },
      include: {
        requester: {
          include: { profile: true },
        },
        addressee: {
          include: { profile: true },
        },
      },
    });

    res.status(201).json({ connection });
  } catch (error) {
    console.error('Erro ao solicitar conexão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function respondConnection(req: AuthedRequest, res: Response) {
  try {
    const userId = req.user!.id; // bigint
    const { connectionId, action } = req.body; // ACCEPTED | REJECTED | BLOCKED

    if (!connectionId || !action) {
      return res.status(400).json({ error: 'connectionId e action são obrigatórios' });
    }

    if (!['ACCEPTED', 'REJECTED', 'BLOCKED'].includes(action)) {
      return res.status(400).json({ error: 'Ação inválida' });
    }

    // Encontrar a conexão onde o usuário atual é o destinatário
    const connection = await prisma.connection.findFirst({
      where: {
        id: BigInt(connectionId),
        addresseeId: userId,
        status: 'PENDING',
      },
    });

    if (!connection) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }

    // Atualizar status
    const updatedConnection = await prisma.connection.update({
      where: { id: connection.id },
      data: { status: action, actedAt: new Date() },
      include: {
        requester: {
          include: { profile: true },
        },
        addressee: {
          include: { profile: true },
        },
      },
    });

    res.json({ connection: updatedConnection });
  } catch (error) {
    console.error('Erro ao responder conexão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function myConnections(req: AuthedRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const connections = await prisma.connection.findMany({
      where: {
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: {
          include: { profile: true },
        },
        addressee: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(connections);
  } catch (error) {
    console.error('Erro ao buscar conexões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function myRequests(req: AuthedRequest, res: Response) {
  try {
    const userId = req.user!.id;

    // Buscar apenas solicitações recebidas pendentes
    const requests = await prisma.connection.findMany({
      where: {
        addresseeId: userId,
        status: 'PENDING',
      },
      include: {
        requester: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(requests);
  } catch (error) {
    console.error('Erro ao buscar solicitações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
