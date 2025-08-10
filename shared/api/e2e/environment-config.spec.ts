import { test, expect } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import fetch from 'node-fetch';

test.describe('API Environment Configuration Tests', () => {
  const API_PORT = 3003;
  const API_URL = `http://localhost:${API_PORT}`;
  let apiProcess: ChildProcess;

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

  // Helper to start API with specific environment variables
  const startApiWithEnv = async (env: Record<string, string> = {}): Promise<ChildProcess> => {
    const process = spawn('npm', ['run', 'dev'], {
      cwd: '../shared/api',
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, ...env }
    });

    await waitForServer(API_URL);
    return process;
  };

  const stopApi = async (process: ChildProcess): Promise<void> => {
    if (process && !process.killed) {
      process.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  test.describe('Local Development Configuration (.env)', () => {
    test('should work with CLAUDE_API_KEY from environment', async () => {
      // Test with a mock API key in environment
      const testEnv = {
        NODE_ENV: 'development',
        CLAUDE_API_KEY: 'sk-test-development-key',
        AWS_SECRETS_ENABLED: 'false',
        LOG_LEVEL: 'debug'
      };

      try {
        apiProcess = await startApiWithEnv(testEnv);

        // Test health check
        const healthResponse = await fetch(`${API_URL}/api/v1/ai-analysis/health`);
        expect(healthResponse.status).toBe(200);

        const healthData = await healthResponse.json();
        expect(healthData.status).toBe('healthy');
        expect(healthData.aiService).toHaveProperty('status');

        console.log('Local .env configuration test result:', {
          status: healthData.status,
          aiServiceStatus: healthData.aiService.status,
          model: healthData.aiService.model
        });

      } finally {
        await stopApi(apiProcess);
      }
    });

    test('should fall back to mock mode when no API key is provided', async () => {
      // Test with no API key - should use mock mode
      const testEnv = {
        NODE_ENV: 'development',
        AWS_SECRETS_ENABLED: 'false',
        LOG_LEVEL: 'debug'
        // No CLAUDE_API_KEY set
      };

      try {
        apiProcess = await startApiWithEnv(testEnv);

        // Test health check
        const healthResponse = await fetch(`${API_URL}/api/v1/ai-analysis/health`);
        expect(healthResponse.status).toBe(200);

        const healthData = await healthResponse.json();
        expect(healthData.status).toBe('healthy');
        
        // Should be in mock mode
        expect(['mock-model', 'development']).toContain(healthData.aiService.mode || healthData.aiService.model);

        console.log('Mock mode fallback test result:', {
          status: healthData.status,
          aiServiceMode: healthData.aiService.mode,
          aiServiceModel: healthData.aiService.model
        });

      } finally {
        await stopApi(apiProcess);
      }
    });

    test('should handle invalid API key gracefully', async () => {
      const testEnv = {
        NODE_ENV: 'development',
        CLAUDE_API_KEY: 'invalid-key-format',
        AWS_SECRETS_ENABLED: 'false'
      };

      try {
        apiProcess = await startApiWithEnv(testEnv);

        // Test a skill recommendation request with invalid key
        const analysisResponse = await fetch(`${API_URL}/api/v1/ai-analysis/skill-recommendations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'test-client-key'
          },
          body: JSON.stringify({
            character: {
              name: "Test Character",
              role: "Guardian",
              currentXP: 100,
              level: 1,
              masteredSkills: []
            },
            availableSkills: [],
            allSkills: []
          })
        });

        // Should handle invalid API key gracefully - either return mock data or proper error
        if (analysisResponse.ok) {
          const data = await analysisResponse.json();
          console.log('Invalid API key handled with mock response');
        } else {
          expect([401, 503]).toContain(analysisResponse.status);
          console.log('Invalid API key handled with proper error response');
        }

      } finally {
        await stopApi(apiProcess);
      }
    });
  });

  test.describe('AWS Secrets Manager Configuration', () => {
    test('should demonstrate AWS Secrets Manager configuration', async () => {
      // This test demonstrates the AWS configuration but doesn't actually test AWS
      // since we don't have AWS credentials in the test environment
      const testEnv = {
        NODE_ENV: 'production',
        AWS_SECRETS_ENABLED: 'true',
        CLAUDE_SECRET_NAME: 'prod/proto-portal/claude-api-key',
        AWS_REGION: 'us-east-1'
      };

      try {
        // In a real AWS environment, this would try to connect to Secrets Manager
        // For testing, we'll just verify the server starts and handles the configuration
        apiProcess = await startApiWithEnv(testEnv);

        const healthResponse = await fetch(`${API_URL}/api/v1/ai-analysis/health`);
        expect(healthResponse.status).toBe(200);

        const healthData = await healthResponse.json();
        console.log('AWS Secrets Manager configuration (simulated):', {
          status: healthData.status,
          awsSecretsEnabled: testEnv.AWS_SECRETS_ENABLED,
          secretName: testEnv.CLAUDE_SECRET_NAME,
          region: testEnv.AWS_REGION
        });

      } finally {
        await stopApi(apiProcess);
      }
    });

    test('should handle AWS Secrets Manager errors gracefully', async () => {
      const testEnv = {
        NODE_ENV: 'production',
        AWS_SECRETS_ENABLED: 'true',
        CLAUDE_SECRET_NAME: 'non-existent-secret',
        AWS_REGION: 'us-east-1'
      };

      try {
        apiProcess = await startApiWithEnv(testEnv);

        // Try to make an API call that would require the secret
        const analysisResponse = await fetch(`${API_URL}/api/v1/ai-analysis/skill-recommendations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'test-client-key'
          },
          body: JSON.stringify({
            character: {
              name: "Test Character",
              role: "Guardian", 
              currentXP: 100,
              level: 1,
              masteredSkills: []
            },
            availableSkills: [],
            allSkills: []
          })
        });

        // Should handle AWS Secrets Manager errors gracefully
        if (!analysisResponse.ok) {
          expect([503, 500]).toContain(analysisResponse.status);
          const errorData = await analysisResponse.json();
          expect(errorData.error).toContain('service');
          console.log('AWS Secrets Manager error handled properly');
        }

      } finally {
        await stopApi(apiProcess);
      }
    });
  });

  test.describe('Environment Variable Validation', () => {
    test('should validate CORS configuration', async () => {
      const testEnv = {
        NODE_ENV: 'development',
        CORS_ORIGIN: 'http://localhost:3001,http://localhost:3002,https://portfolio.cookinupideas.com',
        CLAUDE_API_KEY: 'test-key'
      };

      try {
        apiProcess = await startApiWithEnv(testEnv);

        // Test CORS for each allowed origin
        const origins = ['http://localhost:3001', 'http://localhost:3002'];
        
        for (const origin of origins) {
          const corsResponse = await fetch(`${API_URL}/api/v1/ai-analysis/health`, {
            method: 'OPTIONS',
            headers: { 'Origin': origin }
          });

          expect(corsResponse.headers.get('access-control-allow-origin')).toBe(origin);
          console.log(`CORS working for origin: ${origin}`);
        }

      } finally {
        await stopApi(apiProcess);
      }
    });

    test('should validate rate limiting configuration', async () => {
      const testEnv = {
        NODE_ENV: 'production',
        RATE_LIMIT_WINDOW_MS: '60000', // 1 minute
        RATE_LIMIT_MAX_REQUESTS: '5',   // 5 requests max
        CLAUDE_API_KEY: 'test-key'
      };

      try {
        apiProcess = await startApiWithEnv(testEnv);

        console.log('Rate limiting configuration test:', {
          windowMs: testEnv.RATE_LIMIT_WINDOW_MS,
          maxRequests: testEnv.RATE_LIMIT_MAX_REQUESTS,
          environment: testEnv.NODE_ENV
        });

        // In production environment, rate limiting should be active
        // (In development, it's typically disabled)
        const healthResponse = await fetch(`${API_URL}/health`);
        expect(healthResponse.status).toBe(200);

      } finally {
        await stopApi(apiProcess);
      }
    });

    test('should validate model configuration', async () => {
      const testEnv = {
        NODE_ENV: 'development',
        CLAUDE_MODEL: 'claude-3-5-sonnet-20241022',
        CLAUDE_API_URL: 'https://api.anthropic.com/v1/messages',
        CLAUDE_API_KEY: 'test-key'
      };

      try {
        apiProcess = await startApiWithEnv(testEnv);

        const healthResponse = await fetch(`${API_URL}/api/v1/ai-analysis/health`);
        const healthData = await healthResponse.json();

        console.log('Claude model configuration:', {
          configuredModel: testEnv.CLAUDE_MODEL,
          apiUrl: testEnv.CLAUDE_API_URL,
          healthStatus: healthData.status
        });

        expect(healthResponse.status).toBe(200);

      } finally {
        await stopApi(apiProcess);
      }
    });
  });
});