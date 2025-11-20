import { Router } from 'express';
import { requireAuth } from '../middlewares/auth'; // ← Usar requireAuth em vez de auth
import { getPosts, createPost, toggleLike, getComments, createComment, deletePost, deleteComment } from '../controllers/posts.controller';

const router = Router();

// GET /api/posts - Listar posts do feed
router.get('/', requireAuth, getPosts);

// POST /api/posts - Criar novo post
router.post('/', requireAuth, createPost);

// POST /api/posts/:id/like - Curtir/descurtir post
router.post('/:id/like', requireAuth, toggleLike);

// GET /api/posts/:id/comments - Buscar comentários de um post
router.get('/:id/comments', requireAuth, getComments);

// POST /api/posts/:id/comments - Comentar no post
router.post('/:id/comments', requireAuth, createComment);

// DELETE /api/posts/:id - Deletar post
router.delete('/:id', requireAuth, deletePost);

// DELETE /api/posts/:postId/comments/:commentId - Deletar comentário
router.delete('/:postId/comments/:commentId', requireAuth, deleteComment);

export default router;
