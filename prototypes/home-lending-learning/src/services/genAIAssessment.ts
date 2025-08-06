interface AssessmentResult {
  similarities: string[];
  differences: string[];
  feedback: string;
  comprehensionLevel: 'excellent' | 'good' | 'partial' | 'needs-improvement';
  suggestions: string[];
}

// Function to determine the appropriate API URL based on environment
const getApiUrl = (): string => {
  // Check if we're running in development mode (Vite's import.meta.env)
  const isDevelopment = import.meta.env.DEV;
  
  // Check if we're on localhost or a development port
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
  
  // Use environment variable if provided (for build-time configuration)
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    return envApiUrl;
  }
  
  // If in development or on localhost, use local API
  if (isDevelopment || isLocalhost) {
    return 'http://localhost:3003';
  }
  
  // For production, this placeholder will be replaced by the deploy script
  // with the actual API Gateway URL from Terraform outputs
  return 'PLACEHOLDER_API_GATEWAY_URL';
};

export async function assessUserUnderstanding(
  userResponse: string,
  targetTerm: string,
  officialDefinition: string,
  examples?: string[]
): Promise<AssessmentResult> {
  
  try {
    // Use the same API pattern as FFX skill map
    const API_ENDPOINT = `${getApiUrl()}/api/v1/ai-analysis/home-lending-assessment`;
    
    const requestPayload = {
      userResponse,
      targetTerm,
      officialDefinition,
      examples: examples || [],
      context: {
        learningModule: 'home-lending-learning',
        difficultyLevel: 'beginner',
        analysisType: 'key-concepts-assessment'
      },
      instructions: `Analyze the user's spoken response about "${targetTerm}" and provide detailed feedback on:
1. Which key concepts from the official definition they correctly addressed
2. Which important concepts they missed or misunderstood
3. The accuracy and completeness of their explanation
4. Specific suggestions for improvement

Focus on conceptual understanding rather than exact wording. The response should help them learn what aspects they understand well and what needs more attention.`
    };

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please contact support if this persists.');
      } else if (response.status === 429) {
        throw new Error('Service is busy. Please try again in a few minutes.');
      } else if (response.status === 503) {
        throw new Error('AI assessment service is temporarily unavailable. Server side API key not configured.');
      } else if (response.status === 400) {
        throw new Error('Invalid request format. Please contact support.');
      }
      
      throw new Error(errorData.error || `Assessment request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.assessment) {
      throw new Error('Invalid response from assessment service');
    }

    return data.assessment;

  } catch (error) {
    console.error('Error calling GenAI assessment service:', error);
    
    // Re-throw the error so the UI can handle it appropriately
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Assessment service is currently unavailable. Please contact your administrator.');
  }
}

// Mock assessment function for fallback
function getMockAssessment(
  userResponse: string,
  targetTerm: string,
  officialDefinition: string,
  examples?: string[]
): AssessmentResult {
  // Mock assessment logic based on keyword matching and length
  const userWords = userResponse.toLowerCase().split(/\s+/);
  const definitionWords = officialDefinition.toLowerCase().split(/\s+/);
  
  // Find overlapping concepts
  const keyTerms = ['loan', 'mortgage', 'credit', 'interest', 'payment', 'debt', 'income', 'property', 'lender', 'borrower', 'approval', 'underwriting', 'closing', 'funding', 'appraisal'];
  const userKeyTerms = userWords.filter(word => keyTerms.includes(word));
  const defKeyTerms = definitionWords.filter(word => keyTerms.includes(word));
  const commonTerms = userKeyTerms.filter(term => defKeyTerms.includes(term));
  
  const comprehensionScore = Math.min(100, (commonTerms.length / Math.max(defKeyTerms.length, 1)) * 100);
  
  let comprehensionLevel: AssessmentResult['comprehensionLevel'];
  if (comprehensionScore >= 80) comprehensionLevel = 'excellent';
  else if (comprehensionScore >= 60) comprehensionLevel = 'good';
  else if (comprehensionScore >= 40) comprehensionLevel = 'partial';
  else comprehensionLevel = 'needs-improvement';
  
  // Generate similarities
  const similarities: string[] = [];
  if (commonTerms.length > 0) {
    similarities.push(`You correctly mentioned key concepts: ${commonTerms.slice(0, 3).join(', ')}`);
  }
  if (userResponse.length > 50) {
    similarities.push('You provided a detailed explanation showing engagement with the topic');
  }
  if (userResponse.toLowerCase().includes(targetTerm.toLowerCase())) {
    similarities.push('You correctly referenced the target term in context');
  }
  
  // Generate differences
  const differences: string[] = [];
  const missingTerms = defKeyTerms.filter(term => !userKeyTerms.includes(term));
  if (missingTerms.length > 0) {
    differences.push(`Consider including these important concepts: ${missingTerms.slice(0, 3).join(', ')}`);
  }
  if (userResponse.length < 30) {
    differences.push('Your explanation could be more detailed to demonstrate fuller understanding');
  }
  
  // Generate feedback
  let feedback = '';
  switch (comprehensionLevel) {
    case 'excellent':
      feedback = 'Outstanding! You demonstrate a strong grasp of this concept with accurate terminology and clear explanations.';
      break;
    case 'good':
      feedback = 'Great work! You show solid understanding with room for minor refinements in technical detail.';
      break;
    case 'partial':
      feedback = 'Good foundation! You understand the basics but could benefit from exploring more specific aspects of this concept.';
      break;
    case 'needs-improvement':
      feedback = 'Keep learning! This is a complex topic, and with more study, you\'ll develop stronger mastery of these concepts.';
      break;
  }
  
  // Generate suggestions
  const suggestions: string[] = [];
  if (comprehensionLevel !== 'excellent') {
    suggestions.push('Review the official definition again and try to incorporate more specific terminology');
    suggestions.push('Practice explaining this concept to someone else to reinforce your understanding');
  }
  if (examples && examples.length > 0) {
    suggestions.push('Study the provided examples to see how this concept applies in real scenarios');
  }
  
  return {
    similarities,
    differences,
    feedback,
    comprehensionLevel,
    suggestions
  };
}

// Future: Replace with actual GenAI service integration
export async function callActualGenAIService(prompt: string): Promise<string> {
  // This would integrate with OpenAI, Claude, Gemini, etc.
  // Example for OpenAI:
  /*
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.3,
    }),
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
  */
  
  throw new Error('GenAI service not configured');
}