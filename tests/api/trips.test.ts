import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Trip API Tests', () => {
  test.describe('GET /api/discover', () => {
    test('should return public trips', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/discover`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('trips');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.trips)).toBe(true);
    });

    test('should filter by city', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/discover?city=Paris`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('trips');
      expect(Array.isArray(data.trips)).toBe(true);
    });

    test('should filter by travel type', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/discover?travelType=Fun`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('trips');
    });

    test('should support pagination', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/discover?page=1&limit=5`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.pagination).toHaveProperty('page');
      expect(data.pagination).toHaveProperty('limit');
      expect(data.pagination).toHaveProperty('total');
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(5);
    });

    test('should support different sort orders', async ({ request }) => {
      const sortOptions = ['recent', 'popular', 'likes'];

      for (const sortBy of sortOptions) {
        const response = await request.get(`${API_BASE_URL}/api/discover?sortBy=${sortBy}`);
        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('trips');
      }
    });
  });

  test.describe('POST /api/generate', () => {
    test('should require authentication', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/generate`, {
        data: {
          startDate: '2025-12-01',
          endDate: '2025-12-05',
          numPeople: 2,
          travelType: ['Fun', 'Sightseeing']
        }
      });

      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should validate required fields', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/generate`, {
        data: {
          // Missing required fields
        }
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('should validate date format', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/generate`, {
        data: {
          startDate: 'invalid-date',
          endDate: '2025-12-05',
          numPeople: 2,
          travelType: ['Fun']
        }
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('GET /api/admin/models', () => {
    test('should return list of AI models', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/admin/models`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('models');
      expect(Array.isArray(data.models)).toBe(true);

      if (data.models.length > 0) {
        const model = data.models[0];
        expect(model).toHaveProperty('id');
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('display_name');
        expect(model).toHaveProperty('provider');
        expect(model).toHaveProperty('is_active');
      }
    });
  });

  test.describe('GET /api/admin/stats', () => {
    test('should return platform statistics', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/admin/stats`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('total_users');
      expect(data).toHaveProperty('total_trips');
      expect(data).toHaveProperty('total_cost');
      expect(data).toHaveProperty('total_tokens');

      expect(typeof data.total_users).toBe('string');
      expect(typeof data.total_trips).toBe('string');
    });
  });

  test.describe('GET /api/admin/model-performance', () => {
    test('should return model performance metrics', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/admin/model-performance`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('performance');
      expect(Array.isArray(data.performance)).toBe(true);

      if (data.performance.length > 0) {
        const perf = data.performance[0];
        expect(perf).toHaveProperty('model_name');
        expect(perf).toHaveProperty('usage_count');
      }
    });
  });

  test.describe('GET /api/admin/queries', () => {
    test('should return recent queries', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/admin/queries?limit=10`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('queries');
      expect(Array.isArray(data.queries)).toBe(true);

      // Should respect limit
      expect(data.queries.length).toBeLessThanOrEqual(10);
    });

    test('should support custom limit', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/admin/queries?limit=5`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.queries.length).toBeLessThanOrEqual(5);
    });
  });
});
