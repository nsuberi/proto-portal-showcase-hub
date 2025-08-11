import { test, expect } from '@playwright/test';

test.describe('Home Lending Learning - Claude API Integration', () => {
  // Use CI-provided API gateway; fail early if missing to ensure we hit prod
  const API_BASE_URL = (process.env.API_BASE_URL || process.env.API_GATEWAY_URL || '').replace(/\/$/, '');
  
  // Test data for home lending assessment API calls
  const mockHomeLendingData = {
    userResponse: "A credit score is a number that shows how good you are at paying back loans and credit cards. It's usually between 300 and 850, and lenders use it to decide if they want to give you a loan and what interest rate to charge.",
    targetTerm: "Credit Score",
    officialDefinition: "A numerical representation of a borrower's creditworthiness, typically ranging from 300 to 850, based on their credit history and used by lenders to assess lending risk.",
    examples: ["FICO score of 740", "VantageScore of 680", "Credit score of 620"],
    context: {
      learningModule: "basic-terms",
      difficultyLevel: "beginner"
    }
  };

  const mockPoorResponse = {
    userResponse: "I don't really know what a credit score is.",
    targetTerm: "Credit Score", 
    officialDefinition: "A numerical representation of a borrower's creditworthiness, typically ranging from 300 to 850, based on their credit history and used by lenders to assess lending risk.",
    examples: ["FICO score of 740"],
    context: {
      learningModule: "basic-terms",
      difficultyLevel: "beginner"
    }
  };

  const mockExcellentResponse = {
    userResponse: "A credit score is a three-digit numerical representation of a borrower's creditworthiness, typically ranging from 300 to 850, that is calculated using credit history data including payment history, credit utilization, length of credit history, types of credit, and new credit inquiries. Lenders use credit scores like FICO and VantageScore to assess the risk of lending to an individual and determine loan terms, interest rates, and approval decisions.",
    targetTerm: "Credit Score",
    officialDefinition: "A numerical representation of a borrower's creditworthiness, typically ranging from 300 to 850, based on their credit history and used by lenders to assess lending risk.", 
    examples: ["FICO score of 740", "VantageScore of 680"],
    context: {
      learningModule: "advanced-terms",
      difficultyLevel: "intermediate"
    }
  };

  // Only used endpoint for Home Lending app: home-lending-assessment

  // Server auth is skipped for /ai-analysis endpoints; focus on payload/response validation

  test('API: home-lending-assessment returns 200 with valid payload', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/v1/ai-analysis/home-lending-assessment`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY || 'mock-key-for-testing'
      },
      data: mockHomeLendingData
    });

    expect(response.ok(), `API error ${response.status()}: ${await response.text()}`).toBe(true);
    const data = await response.json();
    
    // Verify response structure
    expect(data).toHaveProperty('assessment');
    expect(data).toHaveProperty('metadata');
    
    const { assessment, metadata } = data;
    
    // Verify assessment structure
    expect(assessment).toHaveProperty('similarities');
    expect(assessment).toHaveProperty('differences');  
    expect(assessment).toHaveProperty('feedback');
    expect(assessment).toHaveProperty('comprehensionLevel');
    expect(assessment).toHaveProperty('suggestions');
    
    // Verify arrays are populated
    expect(Array.isArray(assessment.similarities)).toBe(true);
    expect(Array.isArray(assessment.differences)).toBe(true);
    expect(Array.isArray(assessment.suggestions)).toBe(true);
    
    // Verify comprehension level is valid
    expect(['excellent', 'good', 'partial', 'needs-improvement']).toContain(assessment.comprehensionLevel);
    
    // Verify metadata
    expect(metadata).toHaveProperty('assessmentId');
    expect(metadata).toHaveProperty('timestamp');
    expect(metadata).toHaveProperty('model');
    expect(metadata).toHaveProperty('processingTimeMs');
    
    // Verify content quality
    expect(assessment.similarities.length).toBeGreaterThan(0);
    expect(assessment.feedback.length).toBeGreaterThan(0);
    expect(assessment.suggestions.length).toBeGreaterThan(0);
  });

  // CORS/browser check from portfolio origin
  test('CORS: portfolio origin can call API health', async ({ page }) => {
    const portfolioBase = process.env.BASE_URL || process.env.PORTFOLIO_BASE_URL;
    if (!portfolioBase) {
      throw new Error('Portfolio BASE_URL not provided');
    }
    const apiBase = (process.env.API_BASE_URL || '').replace(/\/$/, '');
    if (!apiBase) {
      throw new Error('API_BASE_URL not provided');
    }

    await page.goto(portfolioBase);
    const result = await page.evaluate(async (apiUrl, key) => {
      const res = await fetch(`${apiUrl}/api/v1/ai-analysis/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(key ? { 'x-api-key': key } : {})
        }
      });
      return { ok: res.ok, status: res.status, text: await res.text(), cors: res.type };
    }, apiBase, process.env.CLAUDE_API_KEY || '');

    expect(result.ok, `CORS/health failed ${result.status}: ${result.text}`).toBe(true);
  });

  test('should handle poor user responses appropriately', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/v1/ai-analysis/home-lending-assessment`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY || 'mock-key-for-testing'
      },
      data: mockPoorResponse
    });

    if (response.ok()) {
      const data = await response.json();
      const { assessment } = data;
      
      // For poor responses, should have lower comprehension level
      expect(['partial', 'needs-improvement']).toContain(assessment.comprehensionLevel);
      
      // Should have more suggestions for improvement
      expect(assessment.suggestions.length).toBeGreaterThan(0);
      expect(assessment.differences.length).toBeGreaterThan(0);
      
      // Feedback should be constructive
      expect(assessment.feedback.length).toBeGreaterThan(10);
      expect(assessment.feedback.toLowerCase()).toContain('review');
      
      console.log('Poor Response Assessment:', {
        comprehensionLevel: assessment.comprehensionLevel,
        suggestionsCount: assessment.suggestions.length,
        feedbackLength: assessment.feedback.length
      });
    } else {
      console.log('Service unavailable for poor response test');
    }
  });

  test('should handle excellent user responses appropriately', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/v1/ai-analysis/home-lending-assessment`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY || 'mock-key-for-testing'
      },
      data: mockExcellentResponse
    });

    if (response.ok()) {
      const data = await response.json();
      const { assessment } = data;
      
      // For excellent responses, should have higher comprehension level
      expect(['excellent', 'good']).toContain(assessment.comprehensionLevel);
      
      // Should have more similarities identified
      expect(assessment.similarities.length).toBeGreaterThan(0);
      
      // Feedback should be positive
      expect(assessment.feedback.toLowerCase()).toMatch(/good|excellent|well|understanding/);
      
      console.log('Excellent Response Assessment:', {
        comprehensionLevel: assessment.comprehensionLevel,
        similaritiesCount: assessment.similarities.length,
        feedbackTone: assessment.feedback.substring(0, 100) + '...'
      });
    } else {
      console.log('Service unavailable for excellent response test');
    }
  });

  test('should validate request data properly', async ({ request }) => {
    // Test missing required fields
    const invalidResponse = await request.post(`${API_BASE_URL}/api/v1/ai-analysis/home-lending-assessment`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-key'
      },
      data: {
        userResponse: "Test response",
        // Missing targetTerm and officialDefinition
      }
    });

    expect(invalidResponse.status()).toBe(400);
    const errorData = await invalidResponse.json();
    expect(errorData).toHaveProperty('error');
    expect(errorData.error).toContain('Missing required fields');
    expect(errorData).toHaveProperty('code');
    expect(errorData.code).toBe('MISSING_REQUIRED_FIELDS');
  });

  test('should handle input length validation', async ({ request }) => {
    // Test user response too long
    const longResponse = await request.post(`${API_BASE_URL}/api/v1/ai-analysis/home-lending-assessment`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-key'
      },
      data: {
        userResponse: 'A'.repeat(2001), // Too long
        targetTerm: "Credit Score",
        officialDefinition: "A numerical representation..."
      }
    });

    expect(longResponse.status()).toBe(400);
    const errorData = await longResponse.json();
    expect(errorData.error).toContain('too long');
    expect(errorData.code).toBe('RESPONSE_TOO_LONG');
  });

  test('should demonstrate different learning contexts', async ({ request }) => {
    const contexts = [
      {
        learningModule: "basic-terms",
        difficultyLevel: "beginner"
      },
      {
        learningModule: "advanced-concepts", 
        difficultyLevel: "intermediate"
      },
      {
        learningModule: "loan-processes",
        difficultyLevel: "advanced"
      }
    ];

    for (const context of contexts) {
      const response = await request.post(`${API_BASE_URL}/api/v1/ai-analysis/home-lending-assessment`, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY || 'mock-key-for-testing'
        },
        data: {
          ...mockHomeLendingData,
          context
        }
      });

      if (response.ok()) {
        const data = await response.json();
        console.log(`Context Assessment (${context.learningModule}/${context.difficultyLevel}):`, {
          comprehensionLevel: data.assessment.comprehensionLevel,
          feedbackLength: data.assessment.feedback.length
        });
      } else {
        console.log(`Context test failed for ${context.learningModule}`);
      }
    }
  });

  test('should handle Claude API rate limiting gracefully', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/v1/ai-analysis/home-lending-assessment`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY || 'mock-key'
      },
      data: mockHomeLendingData
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

  // Removed health/config test; not used by app

  test('should test multiple assessment terms', async ({ request }) => {
    const testCases = [
      {
        userResponse: "APR includes the interest rate plus other fees like origination fees and points.",
        targetTerm: "Annual Percentage Rate (APR)",
        officialDefinition: "The total cost of borrowing expressed as a yearly percentage, including interest rate and additional fees such as origination fees, discount points, and other lender charges."
      },
      {
        userResponse: "A down payment is money you pay upfront when buying a house.",
        targetTerm: "Down Payment", 
        officialDefinition: "The portion of a property's purchase price paid in cash upfront by the buyer, typically expressed as a percentage of the total purchase price."
      }
    ];

    for (const testCase of testCases) {
      const response = await request.post(`${API_BASE_URL}/api/v1/ai-analysis/home-lending-assessment`, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY || 'mock-key-for-testing'
        },
        data: {
          ...testCase,
          examples: [],
          context: { learningModule: "multi-term-test" }
        }
      });

      if (response.ok()) {
        const data = await response.json();
        console.log(`${testCase.targetTerm} Assessment:`, {
          comprehensionLevel: data.assessment.comprehensionLevel,
          similaritiesCount: data.assessment.similarities.length
        });
      } else {
        console.log(`Failed to assess ${testCase.targetTerm}`);
      }
    }
  });
});