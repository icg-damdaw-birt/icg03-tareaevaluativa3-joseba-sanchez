/**
 * TESTS DE FAVORITOS
 * Prueba que un usuario puede marcar/desmarcar películas como favoritas
 */

const request = require('supertest');

// ============================================
// CONFIGURACIÓN DE MOCKS
// ============================================

// Mock del módulo prisma ANTES de importar el servidor
const mockPrisma = {
  movie: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('../lib/prisma', () => mockPrisma);

// Mock del middleware de autenticación
// Simula que el usuario está autenticado con userId 'user-123'
jest.mock('../middleware/authMiddleware', () => {
  return (req, res, next) => {
    req.user = { userId: 'user-123' };
    next();
  };
});

const app = require('../server');

describe('Favoritos - POST /api/movies/:id/favorite', () => {
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Debe marcar una película como favorita', async () => {
    const movieId = 'movie-123';
    
    // Mock: película encontrada, isFavorite=false
    mockPrisma.movie.findFirst.mockResolvedValue({
      id: movieId,
      title: 'Inception',
      isFavorite: false,
      ownerId: 'user-123',
    });

    // Mock: actualización a isFavorite=true
    mockPrisma.movie.update.mockResolvedValue({
      id: movieId,
      title: 'Inception',
      isFavorite: true,
      ownerId: 'user-123',
    });

    const res = await request(app)
      .post(`/api/movies/${movieId}/favorite`)
      .expect(200);

    expect(res.body.isFavorite).toBe(true);
    expect(mockPrisma.movie.findFirst).toHaveBeenCalledWith({
      where: { id: movieId, ownerId: 'user-123' },
    });
  });

  test('Debe desmarcar una película como favorita', async () => {
    const movieId = 'movie-123';
    
    // Mock: película encontrada, isFavorite=true
    mockPrisma.movie.findFirst.mockResolvedValue({
      id: movieId,
      title: 'Inception',
      isFavorite: true,
      ownerId: 'user-123',
    });

    // Mock: actualización a isFavorite=false
    mockPrisma.movie.update.mockResolvedValue({
      id: movieId,
      title: 'Inception',
      isFavorite: false,
      ownerId: 'user-123',
    });

    const res = await request(app)
      .post(`/api/movies/${movieId}/favorite`)
      .expect(200);

    expect(res.body.isFavorite).toBe(false);
  });

  test('Debe devolver 404 si la película no existe', async () => {
    const movieId = 'movie-no-existe';
    
    // Mock: película no encontrada
    mockPrisma.movie.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/movies/${movieId}/favorite`)
      .expect(404);

    expect(res.body.error).toBe('Película no encontrada');
  });

  test('Debe rechazar si la película no pertenece al usuario', async () => {
    const movieId = 'movie-otro-usuario';
    
    // Mock: película no encontrada para este usuario
    mockPrisma.movie.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/movies/${movieId}/favorite`)
      .expect(404);

    // Verifica que se filtró por ownerId
    expect(mockPrisma.movie.findFirst).toHaveBeenCalledWith({
      where: { id: movieId, ownerId: 'user-123' },
    });
  });
});
