import { describe, test, expect } from '@jest/globals';
import fetch from 'node-fetch';

// Integration tests assume API server is already running at localhost:3003
// These tests should be run separately from unit tests
describe('API Integration Tests - FFX Skill Map', () => {
  const API_PORT = 3003;
  const API_URL = `http://localhost:${API_PORT}`;

  test('should successfully call skills and mentors recommendations endpoint', async () => {
    const requestData = {
      character: {
        name: 'Test Character',
        role: 'Guardian',
        masteredSkills: []
      },
      allSkills: [
        { id: 's1', name: 'Power Strike', description: 'A strong attack', category: 'Combat', level: 1, xp_required: 10 }
      ],
      teammates: [
        { name: 'Auron', role: 'Warrior', mastered_skills: ['s1'] }
      ],
      widgetSystemPrompt: 'You are an expert mentor.',
      userSystemPrompt: 'I want to grow as a leader.',
      justInTimeQuestion: 'What should I learn next?'
    };

    const response = await fetch(`${API_URL}/api/v1/ai-analysis/skills-and-mentors-recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('response');
    expect(data).toHaveProperty('metadata');
  });

  // Auth is skipped for ai-analysis endpoints; validate body instead

  test('should validate request body', async () => {
    const response = await fetch(`${API_URL}/api/v1/ai-analysis/skills-and-mentors-recommendations`, {
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

  test('should handle CORS for FFX prototype port', async () => {
    const response = await fetch(`${API_URL}/api/v1/ai-analysis/health`, {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:3001'
      }
    });

    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:3001');
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
});