import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthedRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

export const getPosts = async (req: AuthedRequest, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const posts = await prisma.post.findMany({
      skip: parseInt(skip.toString()),
      take: parseInt(limit.toString()),
      orderBy: { createdAt: 'desc' },
      include: {
        likes: {
          where: { userId: req.user!.id },
          select: { id: true },
        },
        comments: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: { displayName: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
    });

    // Buscar dados do autor para cada post
    const postsWithAuthors = await Promise.all(
      posts.map(async (post: any) => {
        let author = null;

        try {
          if (post.authorType === 'USER') {
            author = await prisma.user.findUnique({
              where: { id: post.authorId },
              select: {
                id: true,
                email: true,
                profile: {
                  select: { displayName: true, avatarUrl: true },
                },
              },
            });
          } else if (post.authorType === 'COMPANY') {
            author = await prisma.company.findUnique({
              where: { id: post.authorId },
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            });
          }
        } catch (authorError) {
          console.warn('Erro ao buscar autor do post:', authorError);
          author = null;
        }

        return {
          ...post,
          id: post.id.toString(),
          authorId: post.authorId.toString(),
          author: author
            ? {
                ...author,
                id: author.id.toString(),
              }
            : null,
          isLiked: post.likes.length > 0,
          likesCount: Number(post.likesCount) || 0,
          commentsCount: Number(post.commentsCount) || 0,
          comments: post.comments.map((comment: any) => ({
            ...comment,
            id: comment.id.toString(),
            postId: comment.postId.toString(),
            userId: comment.userId.toString(),
            user: {
              ...comment.user,
              id: comment.user.id.toString(),
            },
          })),
        };
      })
    );

    res.json({ posts: postsWithAuthors });
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const createPost = async (req: AuthedRequest, res: Response) => {
  try {
    const { content, imageUrl, authorType = 'USER' } = req.body;

    console.log('Dados recebidos:', { content, imageUrl, authorType });

    // Validação de conteúdo
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: 'Conteúdo é obrigatório' });
    }

    // Validação de imageUrl
    let validImageUrl = null;
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
      const trimmedImageUrl = imageUrl.trim();

      if (trimmedImageUrl.startsWith('http://') || trimmedImageUrl.startsWith('https://')) {
        try {
          new URL(trimmedImageUrl);
          validImageUrl = trimmedImageUrl;
        } catch (urlError) {
          console.warn('URL inválida fornecida:', trimmedImageUrl);
          return res.status(400).json({ message: 'URL da imagem inválida' });
        }
      } else {
        return res.status(400).json({ message: 'A URL da imagem deve começar com http:// ou https://' });
      }
    }

    // Por enquanto, sempre usar o próprio usuário como autor
    const finalAuthorId = req.user!.id;
    const finalAuthorType = 'USER';

    console.log('Criando post com dados:', {
      content: content.trim(),
      imageUrl: validImageUrl,
      authorType: finalAuthorType,
      authorId: finalAuthorId,
    });

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        imageUrl: validImageUrl,
        authorType: finalAuthorType,
        authorId: finalAuthorId,
        likesCount: 0,
        commentsCount: 0,
      },
    });

    console.log('Post criado:', post);

    // Buscar o autor do post criado
    let author = null;
    try {
      author = await prisma.user.findUnique({
        where: { id: finalAuthorId },
        select: {
          id: true,
          email: true,
          profile: {
            select: { displayName: true, avatarUrl: true },
          },
        },
      });

      console.log('Autor encontrado:', author);
    } catch (authorError) {
      console.warn('Erro ao buscar autor após criar post:', authorError);
    }

    const responsePost = {
      ...post,
      id: post.id.toString(),
      authorId: post.authorId.toString(),
      author: author
        ? {
            ...author,
            id: author.id.toString(),
          }
        : null,
      likes: [],
      comments: [],
      isLiked: false,
      likesCount: 0,
      commentsCount: 0,
    };

    console.log('Retornando post:', responsePost);

    res.status(201).json({ post: responsePost });
  } catch (error) {
    console.error('Erro detalhado ao criar post:', error);

    // Verificar se é erro de schema do Prisma
    if (error instanceof Error) {
      if (error.message.includes('Invalid value provided')) {
        return res.status(400).json({ message: 'Dados inválidos fornecidos' });
      }
      if (error.message.includes('Foreign key constraint')) {
        return res.status(400).json({ message: 'Referência inválida nos dados' });
      }
    }

    res.status(500).json({
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};

export const toggleLike = async (req: AuthedRequest, res: Response) => {
  try {
    const postIdParam = req.params.id;
    const userId = req.user!.id;

    // Validar se o ID é um número válido
    if (!postIdParam || isNaN(Number(postIdParam))) {
      return res.status(400).json({ message: 'ID do post inválido' });
    }

    const postId = BigInt(postIdParam);

    // Verificar se o post existe
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado' });
    }

    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    });

    if (existingLike) {
      // Descurtir
      await prisma.postLike.delete({
        where: { id: existingLike.id },
      });

      await prisma.post.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      });

      res.json({ liked: false });
    } else {
      // Curtir
      await prisma.postLike.create({
        data: { postId, userId },
      });

      await prisma.post.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      });

      res.json({ liked: true });
    }
  } catch (error) {
    console.error('Erro ao curtir post:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getComments = async (req: AuthedRequest, res: Response) => {
  try {
    const postIdParam = req.params.id;
    const { page = 1, limit = 20 } = req.query;

    // Validar se o ID é um número válido
    if (!postIdParam || isNaN(Number(postIdParam))) {
      return res.status(400).json({ message: 'ID do post inválido' });
    }

    const postId = BigInt(postIdParam);
    const skip = (Number(page) - 1) * Number(limit);

    // Verificar se o post existe
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado' });
    }

    const comments = await prisma.postComment.findMany({
      where: { postId },
      skip: parseInt(skip.toString()),
      take: parseInt(limit.toString()),
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    const formattedComments = comments.map((comment: any) => ({
      ...comment,
      id: comment.id.toString(),
      postId: comment.postId.toString(),
      userId: comment.userId.toString(),
      user: {
        ...comment.user,
        id: comment.user.id.toString(),
      },
    }));

    res.json({ comments: formattedComments });
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const createComment = async (req: AuthedRequest, res: Response) => {
  try {
    const postIdParam = req.params.id;
    const { content } = req.body;

    // Validar se o ID é um número válido
    if (!postIdParam || isNaN(Number(postIdParam))) {
      return res.status(400).json({ message: 'ID do post inválido' });
    }

    const postId = BigInt(postIdParam);

    // Validação de conteúdo
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: 'Conteúdo do comentário é obrigatório' });
    }

    // Verificar se o post existe
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado' });
    }

    const comment = await prisma.postComment.create({
      data: {
        content: content.trim(),
        postId,
        userId: req.user!.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    await prisma.post.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } },
    });

    res.status(201).json({
      comment: {
        ...comment,
        id: comment.id.toString(),
        postId: comment.postId.toString(),
        userId: comment.userId.toString(),
        user: {
          ...comment.user,
          id: comment.user.id.toString(),
        },
      },
    });
  } catch (error) {
    console.error('Erro ao comentar:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const deletePost = async (req: AuthedRequest, res: Response) => {
  try {
    const postIdParam = req.params.id;

    // Validar se o ID é um número válido
    if (!postIdParam || isNaN(Number(postIdParam))) {
      return res.status(400).json({ message: 'ID do post inválido' });
    }

    const postId = BigInt(postIdParam);

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado' });
    }

    // Verificar se é o autor do post
    if (post.authorType === 'USER' && post.authorId !== req.user!.id) {
      return res.status(403).json({ message: 'Você não tem permissão para deletar este post' });
    }

    if (post.authorType === 'COMPANY') {
      const company = await prisma.company.findFirst({
        where: {
          id: post.authorId,
          ownerUserId: req.user!.id,
        },
      });

      if (!company) {
        return res.status(403).json({ message: 'Você não tem permissão para deletar este post' });
      }
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    res.json({ message: 'Post deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar post:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const deleteComment = async (req: AuthedRequest, res: Response) => {
  try {
    const commentIdParam = req.params.commentId;
    const postIdParam = req.params.postId;

    // Validar se os IDs são números válidos
    if (!commentIdParam || isNaN(Number(commentIdParam))) {
      return res.status(400).json({ message: 'ID do comentário inválido' });
    }

    if (!postIdParam || isNaN(Number(postIdParam))) {
      return res.status(400).json({ message: 'ID do post inválido' });
    }

    const commentId = BigInt(commentIdParam);
    const postId = BigInt(postIdParam);

    const comment = await prisma.postComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comentário não encontrado' });
    }

    // Verificar se é o autor do comentário
    if (comment.userId !== req.user!.id) {
      return res.status(403).json({ message: 'Você não tem permissão para deletar este comentário' });
    }

    await prisma.postComment.delete({
      where: { id: commentId },
    });

    await prisma.post.update({
      where: { id: postId },
      data: { commentsCount: { decrement: 1 } },
    });

    res.json({ message: 'Comentário deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar comentário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
