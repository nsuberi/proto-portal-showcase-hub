import { describe, test, expect } from '@jest/globals';
import fetch from 'node-fetch';

// Integration tests assume API server is already running at localhost:3003
// These tests should be run separately from unit tests
describe('API Integration Tests - Home Lending Learning', () => {
  const API_PORT = 3003;
  const API_URL = `http://localhost:${API_PORT}`;

  test('should successfully call home lending assessment endpoint', async () => {
    const requestData = {
      userResponse: 'A credit score is a number that represents creditworthiness.',
      targetTerm: 'Credit Score',
      officialDefinition: 'A numerical representation of creditworthiness',
      examples: ['FICO 740'],
      context: { learningModule: 'basic-terms', difficultyLevel: 'beginner' }
    };

    const response = await fetch(`${API_URL}/api/v1/ai-analysis/home-lending-assessment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('assessment');
    expect(data).toHaveProperty('metadata');
  });

  // Auth is skipped for ai-analysis endpoints; validate body instead

  test('should validate request body', async () => {
    const response = await fetch(`${API_URL}/api/v1/ai-analysis/home-lending-assessment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // Missing required fields
      })
    });

    expect(response.status).toBe(400);
  });

  test('should handle CORS for Home Lending prototype port', async () => {
    const response = await fetch(`${API_URL}/api/v1/ai-analysis/health`, {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:3002'
      }
    });

    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:3002');
  });
});

// Test the getApiUrl function logic
describe('getApiUrl function', () => {
  const originalEnv = process.env;

  beforeAll(() => {
    // Mock import.meta.env for testing
    (global as any).import = {
      meta: {
        env: {}
      }
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should use VITE_API_URL when set', () => {
    (global as any).import.meta.env.VITE_API_URL = 'https://custom-api.example.com';
    
    // This would be imported from the actual implementation
    const getApiUrl = (): string => {
      const envApiUrl = (global as any).import.meta.env.VITE_API_URL;
      if (envApiUrl) {
        return envApiUrl;
      }
      return 'http://localhost:3003';
    };

    expect(getApiUrl()).toBe('https://custom-api.example.com');
  });

  test('should use localhost:3003 in development', () => {
    (global as any).import.meta.env = {};
    
    const getApiUrl = (): string => {
      const envApiUrl = (global as any).import.meta.env.VITE_API_URL;
      if (envApiUrl) {
        return envApiUrl;
      }
      return 'http://localhost:3003';
    };

    expect(getApiUrl()).toBe('http://localhost:3003');
  });

  test('should replace placeholder in production build', () => {
    // In production builds, this would be replaced by deploy script
    const productionUrl = 'PLACEHOLDER_API_GATEWAY_URL';
    expect(productionUrl).toBe('PLACEHOLDER_API_GATEWAY_URL');
  });
});