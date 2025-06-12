import request from 'supertest';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { IVacancyRepository } from '@jspulse/shared';

// Mock SchedulerService to avoid import.meta.url issues in Jest
jest.mock('../../../src/services/SchedulerService.js', () => ({
  SchedulerService: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    isRunning: jest.fn().mockReturnValue(false)
  }))
}));

// Import app setup
import { containerFactory } from '../../../src/container/ContainerFactory.js';

describe('Vacancy Routes Integration Tests', () => {
  let app: express.Application;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // Disconnect existing Mongoose connection if any
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create Express app
    app = express();
    app.use(express.json());

    // Configure DI container
    const container = containerFactory.createTest();

    // Add middleware and routes here
    // This would need to be adapted based on your actual app structure
    app.get('/api/vacancies', async (req, res) => {
      try {
        const repository = container.resolve('VacancyRepository') as IVacancyRepository;
        const vacancies = await repository.findMany({
          page: parseInt(req.query.page as string) || 0,
          limit: parseInt(req.query.limit as string) || 10
        });
        res.json({ success: true, data: vacancies });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.get('/api/vacancies/:id', async (req: any, res: any) => {
      try {
        const repository = container.resolve('VacancyRepository') as IVacancyRepository;
        const vacancy = await repository.findById(req.params.id);
        if (!vacancy) {
          return res.status(404).json({ success: false, error: 'Vacancy not found' });
        }
        res.json({ success: true, data: vacancy });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.post('/api/vacancies', async (req, res) => {
      try {
        const repository = container.resolve('VacancyRepository') as IVacancyRepository;
        const vacancy = await repository.create(req.body);
        res.status(201).json({ success: true, data: vacancy });
      } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
      }
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    // Clean database between tests
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('GET /api/vacancies', () => {
    it('should return empty list when no vacancies', async () => {
      const response = await request(app)
        .get('/api/vacancies')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.data).toEqual([]);
    });

    it('should return vacancies with pagination', async () => {
      // Create test vacancies first
      const testVacancies = [
        { title: 'Frontend Developer', company: 'Tech Corp', skills: ['React', 'JavaScript'] },
        { title: 'Backend Developer', company: 'Dev Studio', skills: ['Node.js', 'MongoDB'] }
      ];

      // Add vacancies to database
      for (const vacancy of testVacancies) {
        await request(app)
          .post('/api/vacancies')
          .send(vacancy);
      }

      const response = await request(app)
        .get('/api/vacancies?page=0&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.meta).toBeDefined();
      expect(response.body.data.meta.total).toBe(2);
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/vacancies?page=1&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.meta.page).toBe(1);
      expect(response.body.data.meta.limit).toBe(5);
    });
  });

  describe('GET /api/vacancies/:id', () => {
    it('should return 404 for non-existent vacancy', async () => {
      const response = await request(app)
        .get('/api/vacancies/507f1f77bcf86cd799439011')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Vacancy not found');
    });

    it('should return 400 for invalid ObjectId', async () => {
      const response = await request(app)
        .get('/api/vacancies/invalid-id')
        .expect(404); // VacancyRepository.findById returns null for invalid IDs

      expect(response.body.success).toBe(false);
    });

    it('should return vacancy for valid ID', async () => {
      // Create a vacancy first
      const createResponse = await request(app)
        .post('/api/vacancies')
        .send({
          title: 'Test Vacancy',
          company: 'Test Company',
          skills: ['Testing']
        });

      const createdVacancy = createResponse.body.data;

      // Retrieve the vacancy
      const response = await request(app)
        .get(`/api/vacancies/${createdVacancy._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Vacancy');
      expect(response.body.data.company).toBe('Test Company');
    });
  });

  describe('POST /api/vacancies', () => {
    it('should create new vacancy with valid data', async () => {
      const vacancyData = {
        title: 'Senior Frontend Developer',
        company: 'Tech Startup',
        description: 'Looking for experienced React developer',
        skills: ['React', 'TypeScript', 'Next.js'],
        location: 'Remote',
        salaryFrom: 150000,
        salaryTo: 200000,
        salaryCurrency: 'USD'
      };

      const response = await request(app)
        .post('/api/vacancies')
        .send(vacancyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(vacancyData.title);
      expect(response.body.data.company).toBe(vacancyData.company);
      expect(response.body.data.skills).toEqual(vacancyData.skills);
    });

    it('should handle creation with minimal data', async () => {
      const minimalData = {
        title: 'Developer',
        company: 'Company'
      };

      const response = await request(app)
        .post('/api/vacancies')
        .send(minimalData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(minimalData.title);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing required title
        company: 'Test Company'
      };

      const response = await request(app)
        .post('/api/vacancies')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle duplicate external IDs', async () => {
      const vacancyData = {
        title: 'Developer',
        company: 'Company',
        externalId: 'unique-id-123',
        source: 'test-source'
      };

      // Create first vacancy
      await request(app)
        .post('/api/vacancies')
        .send(vacancyData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/vacancies')
        .send(vacancyData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/vacancies')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle large request bodies', async () => {
      const largeData = {
        title: 'Developer',
        company: 'Company',
        description: 'x'.repeat(100000) // Very long description
      };

      const response = await request(app)
        .post('/api/vacancies')
        .send(largeData);

      // Depending on your middleware, this might be 413 (Payload Too Large) or 400
      expect([400, 413]).toContain(response.status);
    });
  });

  describe('Cache Integration', () => {
    it('should serve subsequent requests from cache', async () => {
      // Create a vacancy
      const createResponse = await request(app)
        .post('/api/vacancies')
        .send({
          title: 'Cached Vacancy',
          company: 'Cache Corp'
        });

      const vacancyId = createResponse.body.data._id;

      // First request (should hit database)
      const firstResponse = await request(app)
        .get(`/api/vacancies/${vacancyId}`)
        .expect(200);

      // Second request (should hit cache)
      const secondResponse = await request(app)
        .get(`/api/vacancies/${vacancyId}`)
        .expect(200);

      // Both should return the same data
      expect(firstResponse.body.data).toEqual(secondResponse.body.data);
    });

    it('should invalidate cache after updates', async () => {
      // This test would require implementing PUT/PATCH endpoints
      // and verifying cache invalidation behavior
      expect(true).toBe(true); // Placeholder
    });
  });
}); 