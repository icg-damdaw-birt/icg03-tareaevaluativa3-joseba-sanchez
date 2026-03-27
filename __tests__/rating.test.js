/**
 * TESTS DE RATING
 * Prueba el endpoint PATCH /api/movies/:id/rating
 */

const request = require('supertest');

// Mock del módulo prisma ANTES de importar el servidor
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  movie: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('../lib/prisma', () => mockPrisma);

// Mock del middleware de autenticación
jest.mock('../middleware/authMiddleware', () => {
  return (req, res, next) => {
    req.user = { userId: 'user-123' };
    next();
  };
});

const app = require('../server');
const prisma = require('../lib/prisma');

describe('API de Rating', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Debe actualizar el rating correctamente', async () => {
    const movieId = 'movie-123';

    mockPrisma.movie.findFirst.mockResolvedValue({
      id: movieId,
      title: 'Inception',
      ownerId: 'user-123',
      rating: 2,
    });

    mockPrisma.movie.update.mockResolvedValue({
      id: movieId,
      title: 'Inception',
      ownerId: 'user-123',
      rating: 4,
    });

    const res = await request(app)
      .patch(`/api/movies/${movieId}/rating`)
      .send({ rating: 4 })
      .expect(200);

    expect(res.body.rating).toBe(4);
    expect(mockPrisma.movie.findFirst).toHaveBeenCalledWith({
      where: { id: movieId, ownerId: 'user-123' },
    });
    expect(mockPrisma.movie.update).toHaveBeenCalledWith({
      where: { id: movieId },
      data: { rating: 4 },
    });
  });

  test('Debe devolver 400 para rating mayor a 5', async () => {
    const movieId = 'movie-123';

    const res = await request(app)
      .patch(`/api/movies/${movieId}/rating`)
      .send({ rating: 6 })
      .expect(400);

    expect(res.body.error).toMatch(/Rating inválido/);
    expect(mockPrisma.movie.findFirst).not.toHaveBeenCalled();
    expect(mockPrisma.movie.update).not.toHaveBeenCalled();
  });

  test('Debe devolver 400 para rating negativo', async () => {
    const movieId = 'movie-123';

    const res = await request(app)
      .patch(`/api/movies/${movieId}/rating`)
      .send({ rating: -1 })
      .expect(400);

    expect(res.body.error).toMatch(/Rating inválido/);
    expect(mockPrisma.movie.findFirst).not.toHaveBeenCalled();
    expect(mockPrisma.movie.update).not.toHaveBeenCalled();
  });

  test('Debe devolver 400 si no se envía rating', async () => {
    const movieId = 'movie-123';

    const res = await request(app)
      .patch(`/api/movies/${movieId}/rating`)
      .send({})
      .expect(400);

    expect(res.body.error).toMatch(/Rating inválido/);
    expect(mockPrisma.movie.findFirst).not.toHaveBeenCalled();
    expect(mockPrisma.movie.update).not.toHaveBeenCalled();
  });
});