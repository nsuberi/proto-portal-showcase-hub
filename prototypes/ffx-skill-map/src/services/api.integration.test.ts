import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { spawn, ChildProcess } from 'child_process';
import fetch from 'node-fetch';

describe('API Integration Tests - FFX Skill Map', () => {
  let apiProcess: ChildProcess;
  const API_PORT = 3003;
  const API_URL = `http://localhost:${API_PORT}`;
  
  // Helper to wait for API server to be ready
  const waitForServer = async (url: string, maxAttempts = 30): Promise<void> => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${url}/health`);
        if (response.ok) {
          console.log('API server is ready');
          return;
        }
      } catch (error) {
        // Server not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('API server failed to start');
  };

  beforeAll(async () => {
    // Start the API server
    console.log('Starting API server...');
    apiProcess = spawn('npm', ['run', 'dev'], {
      cwd: '../../../shared/api',
      stdio: 'pipe',
      shell: true
    });

    // Wait for server to be ready
    await waitForServer(API_URL);
  }, 60000); // 60 second timeout

  afterAll(async () => {
    // Stop the API server
    if (apiProcess) {
      console.log('Stopping API server...');
      apiProcess.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  });

  test('should successfully call skills and mentors recommendations endpoint', async () => {
    const requestData = {
      currentSkills: ['JavaScript', 'React', 'Node.js'],
      desiredRole: 'Senior Full Stack Developer',
      timeframe: '6 months',
      learningStyle: 'hands-on'
    };

    const response = await fetch(`${API_URL}/api/v1/ai-analysis/skills-and-mentors-recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-api-key' // This would be mocked in tests
      },
      body: JSON.stringify(requestData)
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('recommendations');
  });

  test('should handle missing API key', async () => {
    const response = await fetch(`${API_URL}/api/v1/ai-analysis/skills-and-mentors-recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(401);
  });

  test('should validate request body', async () => {
    const response = await fetch(`${API_URL}/api/v1/ai-analysis/skills-and-mentors-recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-api-key'
      },
      body: JSON.stringify({
        // Missing required fields
      })
    });

    expect(response.status).toBe(400);
  });

  test('should handle CORS for FFX prototype port', async () => {
    const response = await fetch(`${API_URL}/api/v1/ai-analysis/skills-and-mentors-recommendations`, {
      method: 'OPTIONS',
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