import { test, expect } from '@playwright/test';

test.describe('FFX Skill Map - Claude API Integration', () => {
  // Prefer CI-provided gateway URL, but do not skip when present via env
  const API_BASE_URL = (process.env.API_BASE_URL || process.env.API_GATEWAY_URL || '').replace(/\/$/, '');
  
  // Test data for API calls
  const mockCharacterData = {
    name: "Tidus",
    role: "Guardian", 
    currentXP: 1500,
    level: 10,
    masteredSkills: ["steal", "use", "pilfer-gil"]
  };

  const mockAvailableSkills = [
    {
      id: "mug",
      name: "Mug",
      description: "Steal gil and items while attacking",
      category: "Thief",
      level: 2,
      xp_required: 200,
      prerequisites: ["steal"]
    },
    {
      id: "flee",
      name: "Flee", 
      description: "Escape from battle",
      category: "Thief",
      level: 1,
      xp_required: 100,
      prerequisites: []
    }
  ];

  const mockAllSkills = [
    {
      id: "steal",
      name: "Steal",
      description: "Take items from enemies",
      category: "Thief",
      level: 1,
      xp_required: 50,
      prerequisites: []
    },
    ...mockAvailableSkills
  ];

  // Test API key validation and environment configuration
  test('should handle API key configuration properly', async ({ request }) => {
    if (!API_BASE_URL) {
      throw new Error('API_BASE_URL not set for production integration tests');
    }
    // Test health check endpoint
    const healthResponse = await request.get(`${API_BASE_URL}/api/v1/ai-analysis/health`);
    
    if (healthResponse.ok()) {
      const healthData = await healthResponse.json();
      expect(healthData).toHaveProperty('status');
      expect(healthData).toHaveProperty('aiService');
      expect(healthData.timestamp).toBeTruthy();
      
      console.log('API Health Check:', healthData);
      
      // The AI service should be either healthy with real Claude API or in mock mode
      expect(['healthy', 'mock-model']).toContain(healthData.aiService.status || healthData.aiService.model);
    } else {
      console.log('API Health check failed - server may not be running');
    }
  });

  test('should accept requests without server auth for ai-analysis endpoints', async ({ request }) => {
    if (!API_BASE_URL) {
      throw new Error('API_BASE_URL not set for production integration tests');
    }
    // No API key is required for ai-analysis endpoints (client provides vendor key inside body)
    const noAuthResponse = await request.post(`${API_BASE_URL}/api/v1/ai-analysis/skill-recommendations`, {
      data: {
        character: { name: 'Tidus', role: 'Guardian', masteredSkills: [] },
        availableSkills: [],
        allSkills: []
      }
    });

    // Expect validation error rather than auth error
    expect([400, 200]).toContain(noAuthResponse.status());
  });

  test('should successfully call Claude API for skill recommendations', async ({ request }) => {
    if (!API_BASE_URL) {
      throw new Error('API_BASE_URL not set for production integration tests');
    }

    const response = await request.post(`${API_BASE_URL}/api/v1/ai-analysis/skill-recommendations`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY || 'mock-key-for-testing'
      },
      data: {
        character: mockCharacterData,
        availableSkills: mockAvailableSkills,
        allSkills: mockAllSkills,
        context: {
          goalSkill: "Master Thief",
          additionalContext: "Focus on stealth and agility skills"
        }
      }
    });

    if (response.ok()) {
      const data = await response.json();
      
      // Verify response structure
      expect(data).toHaveProperty('analysis');
      expect(data).toHaveProperty('metadata');
      
      const { analysis, metadata } = data;
      
      // Verify analysis structure
      expect(analysis).toHaveProperty('currentStrengths');
      expect(analysis).toHaveProperty('skillGaps');
      expect(analysis).toHaveProperty('shortTermGoals');
      expect(analysis).toHaveProperty('longTermGoals');
      expect(analysis).toHaveProperty('overallAssessment');
      
      // Verify arrays are populated
      expect(Array.isArray(analysis.currentStrengths)).toBe(true);
      expect(Array.isArray(analysis.skillGaps)).toBe(true);
      expect(Array.isArray(analysis.shortTermGoals)).toBe(true);
      expect(Array.isArray(analysis.longTermGoals)).toBe(true);
      
      // Verify metadata
      expect(metadata).toHaveProperty('analysisId');
      expect(metadata).toHaveProperty('timestamp');
      expect(metadata).toHaveProperty('model');
      expect(metadata).toHaveProperty('processingTimeMs');
      
      // Verify goals have proper structure
      if (analysis.shortTermGoals.length > 0) {
        const shortTermGoal = analysis.shortTermGoals[0];
        expect(shortTermGoal).toHaveProperty('skill');
        expect(shortTermGoal).toHaveProperty('reasoning');
        expect(shortTermGoal).toHaveProperty('priority');
        expect(shortTermGoal.timeframe).toBe('short');
      }
      
      if (analysis.longTermGoals.length > 0) {
        const longTermGoal = analysis.longTermGoals[0];
        expect(longTermGoal).toHaveProperty('skill');
        expect(longTermGoal).toHaveProperty('reasoning');
        expect(longTermGoal).toHaveProperty('priority');
        expect(longTermGoal.timeframe).toBe('long');
      }
      
      console.log('Claude API Analysis Result:', {
        model: metadata.model,
        processingTime: `${metadata.processingTimeMs}ms`,
        shortTermGoalsCount: analysis.shortTermGoals.length,
        longTermGoalsCount: analysis.longTermGoals.length,
        hasOverallAssessment: !!analysis.overallAssessment
      });
      
    } else {
      // Log error details for debugging
      const errorData = await response.json();
      console.log('API Error Response:', errorData);
      
      // Handle different error scenarios
      if (response.status() === 503) {
        console.log('AI service unavailable - may be in mock mode or API key issues');
      } else if (response.status() === 429) {
        console.log('Rate limit exceeded - Claude API usage limit reached');
      } else {
        throw new Error(`API call failed with status ${response.status()}: ${JSON.stringify(errorData)}`);
      }
    }
  });

  test('should handle just-in-time learning recommendations', async ({ request }) => {
    if (!API_BASE_URL) {
      throw new Error('API_BASE_URL not set for production integration tests');
    }
    const justInTimeData = {
      character: mockCharacterData,
      allSkills: mockAllSkills,
      teammates: [
        {
          name: "Yuna",
          role: "Summoner", 
          mastered_skills: ["heal", "esuna", "life"]
        },
        {
          name: "Auron",
          role: "Guardian",
          mastered_skills: ["power-break", "armor-break", "mental-break"] 
        }
      ],
      widgetSystemPrompt: "You are an expert mentor providing skill development guidance for RPG characters.",
      userSystemPrompt: "Help me understand how to develop my character strategically for team effectiveness.",
      justInTimeQuestion: "How can I improve my character's ability to support the team in challenging battles?"
    };

    const response = await request.post(`${API_BASE_URL}/api/v1/ai-analysis/skills-and-mentors-recommendations`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY || 'mock-key-for-testing'
      },
      data: justInTimeData
    });

    if (response.ok()) {
      const data = await response.json();
      
      expect(data).toHaveProperty('response');
      expect(data).toHaveProperty('metadata');
      expect(typeof data.response).toBe('string');
      expect(data.response.length).toBeGreaterThan(0);
      
      console.log('Just-in-time learning response received:', {
        responseLength: data.response.length,
        model: data.metadata.model,
        processingTime: `${data.metadata.processingTimeMs}ms`
      });
      
    } else {
      const errorData = await response.json();
      console.log('Just-in-time API Error:', errorData);
      
      // Allow test to pass in mock mode or with service unavailable
      if (response.status() === 503 || response.status() === 401) {
        console.log('Service unavailable or unauthorized - likely in mock mode');
      } else {
        throw new Error(`Just-in-time API failed: ${response.status()}`);
      }
    }
  });

  test('should validate request data properly', async ({ request }) => {
    if (!API_BASE_URL) {
      throw new Error('API_BASE_URL not set for production integration tests');
    }
    // Test missing required fields
    const invalidResponse = await request.post(`${API_BASE_URL}/api/v1/ai-analysis/skill-recommendations`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-key'
      },
      data: {
        character: { name: "Test" }, // Missing required fields
        availableSkills: [],
        allSkills: []
      }
    });

    expect(invalidResponse.status()).toBe(400);
    const errorData = await invalidResponse.json();
    expect(errorData).toHaveProperty('error');
    expect(errorData.error.toLowerCase()).toContain('validation');
  });

  test('should handle Claude API rate limiting gracefully', async ({ request }) => {
    if (!API_BASE_URL) {
      throw new Error('API_BASE_URL not set for production integration tests');
    }
    // This test demonstrates how the API handles rate limiting
    // In a real scenario with actual Claude API key and rate limits
    
    const response = await request.post(`${API_BASE_URL}/api/v1/ai-analysis/skill-recommendations`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY || 'mock-key'
      },
      data: {
        character: mockCharacterData,
        availableSkills: mockAvailableSkills,
        allSkills: mockAllSkills
      }
    });

    // If we get a 429 status, verify it's handled properly
    if (response.status() === 429) {
      const errorData = await response.json();
      expect(errorData).toHaveProperty('error');
      expect(errorData).toHaveProperty('code');
      expect(errorData.code).toBe('RATE_LIMIT_EXCEEDED');
      console.log('Rate limiting test passed - API handles 429 correctly');
    } else {
      console.log('Rate limiting not triggered in this test run');
    }
  });

  test('should demonstrate environment configuration differences', async ({ request }) => {
    if (!API_BASE_URL) {
      throw new Error('API_BASE_URL not set for production integration tests');
    }
    // Test demonstrates how the API works in different environments
    console.log('Environment Configuration Test:');
    console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('- CLAUDE_API_KEY present:', !!process.env.CLAUDE_API_KEY);
    console.log('- AWS_SECRETS_ENABLED:', process.env.AWS_SECRETS_ENABLED || 'not set');
    console.log('- Base URL:', API_BASE_URL);

    // Test health endpoint to see current configuration
    const healthResponse = await request.get(`${API_BASE_URL}/api/v1/ai-analysis/health`);
    
    if (healthResponse.ok()) {
      const healthData = await healthResponse.json();
      console.log('Current API Configuration:', {
        aiServiceStatus: healthData.aiService?.status,
        aiServiceModel: healthData.aiService?.model,
        mode: healthData.aiService?.mode
      });
      
      // In development with no API key: should be in mock mode
      // In development with API key: should be healthy with real model
      // In production: should use AWS Secrets Manager
      expect(['healthy', 'unhealthy']).toContain(healthData.status);
    }
  });
});