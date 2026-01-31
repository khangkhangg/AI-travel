import { test, expect } from '@playwright/test';

// Uses baseURL from playwright.config.ts (http://localhost:2002)

test.describe('User Platform API Tests', () => {
  test.describe('GET /api/itineraries', () => {
    test('should return public itineraries', async ({ request }) => {
      const response = await request.get(`/api/itineraries`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('itineraries');
      expect(Array.isArray(data.itineraries)).toBe(true);
    });

    test('should filter by destination', async ({ request }) => {
      const response = await request.get(`/api/itineraries?destination=Tokyo`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('itineraries');
      expect(Array.isArray(data.itineraries)).toBe(true);
    });

    test('should filter by visibility', async ({ request }) => {
      const response = await request.get(`/api/itineraries?visibility=public`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('itineraries');
    });

    test('should support pagination', async ({ request }) => {
      const response = await request.get(`/api/itineraries?limit=5&offset=0`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('itineraries');
      expect(data.itineraries.length).toBeLessThanOrEqual(5);
    });
  });

  test.describe('POST /api/itineraries', () => {
    test('should require authentication', async ({ request }) => {
      const response = await request.post(`/api/itineraries`, {
        data: {
          title: 'Test Trip',
          destinationCity: 'Paris',
          destinationCountry: 'France',
        }
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('GET /api/users', () => {
    test('should require authentication for profile', async ({ request }) => {
      const response = await request.get(`/api/users`);

      expect(response.status()).toBe(401);
    });
  });

  test.describe('GET /api/users/social-links', () => {
    test('should require authentication', async ({ request }) => {
      const response = await request.get(`/api/users/social-links`);

      expect(response.status()).toBe(401);
    });
  });

  test.describe('POST /api/users/social-links', () => {
    test('should require authentication', async ({ request }) => {
      const response = await request.post(`/api/users/social-links`, {
        data: {
          platform: 'instagram',
          value: '@testuser',
        }
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('GET /api/users/payment-links', () => {
    test('should require authentication', async ({ request }) => {
      const response = await request.get(`/api/users/payment-links`);

      expect(response.status()).toBe(401);
    });
  });

  test.describe('POST /api/users/payment-links', () => {
    test('should require authentication', async ({ request }) => {
      const response = await request.post(`/api/users/payment-links`, {
        data: {
          platform: 'paypal',
          value: 'test@example.com',
        }
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('GET /api/users/travel-history', () => {
    test('should require authentication', async ({ request }) => {
      const response = await request.get(`/api/users/travel-history`);

      expect(response.status()).toBe(401);
    });
  });

  test.describe('POST /api/users/travel-history', () => {
    test('should require authentication', async ({ request }) => {
      const response = await request.post(`/api/users/travel-history`, {
        data: {
          city: 'Tokyo',
          country: 'Japan',
          year: 2024,
        }
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('GET /api/tour-guides', () => {
    test('should return list of tour guides', async ({ request }) => {
      const response = await request.get(`/api/tour-guides`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('guides');
      expect(Array.isArray(data.guides)).toBe(true);
    });

    test('should filter by city', async ({ request }) => {
      const response = await request.get(`/api/tour-guides?city=Tokyo`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('guides');
    });
  });

  test.describe('GET /api/tours', () => {
    test('should return list of tours', async ({ request }) => {
      const response = await request.get(`/api/tours`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('tours');
      expect(Array.isArray(data.tours)).toBe(true);
    });

    test('should filter by city', async ({ request }) => {
      const response = await request.get(`/api/tours?city=Tokyo`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('tours');
    });
  });

  test.describe('GET /api/tours/tags', () => {
    test('should return list of tour tags', async ({ request }) => {
      const response = await request.get(`/api/tours/tags`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('tags');
      expect(Array.isArray(data.tags)).toBe(true);
    });
  });

  test.describe('GET /api/hotels', () => {
    test('should return list of hotels', async ({ request }) => {
      const response = await request.get(`/api/hotels`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('hotels');
      expect(Array.isArray(data.hotels)).toBe(true);
    });

    test('should filter by city', async ({ request }) => {
      const response = await request.get(`/api/hotels?city=Tokyo`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('hotels');
    });
  });

  test.describe('GET /api/hotels/search', () => {
    test('should search hotels by location', async ({ request }) => {
      const response = await request.get(`/api/hotels/search?location=Tokyo`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('hotels');
      expect(Array.isArray(data.hotels)).toBe(true);
    });
  });

  test.describe('POST /api/business-offers', () => {
    test('should require authentication', async ({ request }) => {
      const response = await request.post(`/api/business-offers`, {
        data: {
          businessType: 'guide',
          businessId: 'test-id',
          itineraryId: 'test-itinerary',
          offerDetails: { message: 'Test offer' },
        }
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('GET /api/business-offers', () => {
    test('should require authentication', async ({ request }) => {
      const response = await request.get(`/api/business-offers`);

      expect(response.status()).toBe(401);
    });
  });

  test.describe('POST /api/follow', () => {
    test('should require authentication', async ({ request }) => {
      const response = await request.post(`/api/follow`, {
        data: {
          followingId: 'test-user-id',
        }
      });

      expect(response.status()).toBe(401);
    });
  });
});

test.describe('Itinerary Collaboration API Tests', () => {
  test.describe('GET /api/itineraries/[id]/collaborators', () => {
    test('should require valid itinerary ID format', async ({ request }) => {
      const response = await request.get(`/api/itineraries/invalid-uuid/collaborators`);

      // Should return error status for invalid ID (500 if UUID validation fails at DB level)
      expect([400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('GET /api/itineraries/[id]/comments', () => {
    test('should require valid itinerary ID', async ({ request }) => {
      const response = await request.get(`/api/itineraries/invalid-uuid/comments`);

      // Comments endpoint may be public, but invalid ID should fail
      expect([400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('GET /api/itineraries/[id]/suggestions', () => {
    test('should require authentication', async ({ request }) => {
      const response = await request.get(`/api/itineraries/test-id/suggestions`);

      // Should require auth or fail on invalid ID
      expect([400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('POST /api/itineraries/[id]/clone', () => {
    test('should require authentication', async ({ request }) => {
      const response = await request.post(`/api/itineraries/test-id/clone`);

      expect(response.status()).toBe(401);
    });
  });

  test.describe('POST /api/itineraries/[id]/votes', () => {
    test('should require authentication', async ({ request }) => {
      const response = await request.post(`/api/itineraries/test-id/votes`, {
        data: {
          targetType: 'activity',
          targetId: 'test-activity',
          vote: 'up',
        }
      });

      expect(response.status()).toBe(401);
    });
  });
});
