import fetch from 'node-fetch';
import { logger } from '../utils/logger.js';

export class ClaudeService {
  constructor(apiKey = null) {
    this.apiKey = apiKey || process.env.CLAUDE_API_KEY;
    this.apiUrl = process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';
    this.model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
    this.mockMode = process.env.NODE_ENV === 'development' && !this.apiKey;
    
    // No longer require API key at startup - it can be provided per request
    if (this.mockMode) {
      logger.warn('Claude API key not provided - running in mock mode for development');
    }
  }

  /**
   * Analyze character skills and provide strategic recommendations
   * @param {Object} params - Analysis parameters
   * @param {string} params.apiKey - Claude API key for this request
   * @param {Object} params.character - Character data
   * @param {Array} params.availableSkills - Available skills array
   * @param {Array} params.allSkills - All skills array
   * @param {Object} params.context - Optional context
   */
  async analyzeSkills({ apiKey, character, availableSkills, allSkills, context = {} }) {
    // Return mock data in development mode without API key or with "mock" key
    if (this.mockMode || !apiKey || apiKey === 'mock') {
      return this.getMockAnalysis(character, availableSkills);
    }

    // Use provided API key for this request
    const requestApiKey = apiKey || this.apiKey;
    if (!requestApiKey) {
      throw new Error('Claude API key is required for analysis');
    }

    const prompt = this.buildAnalysisPrompt(character, availableSkills, allSkills, context);
    
    try {
      logger.info('Making Claude API request', { 
        url: this.apiUrl,
        hasApiKey: !!requestApiKey,
        apiKeyPrefix: requestApiKey ? requestApiKey.substring(0, 10) + '...' : 'none',
        model: this.model,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': requestApiKey ? requestApiKey.substring(0, 10) + '...' : 'none',
          'anthropic-version': '2023-06-01'
        }
      });
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': requestApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Claude API request failed', { 
          status: response.status,
          statusText: response.statusText,
          errorResponse: errorText.substring(0, 500)
        });
        
        if (response.status === 401) {
          throw new Error('Invalid Claude API key configuration');
        } else if (response.status === 429) {
          throw new Error('Claude API rate limit exceeded');
        }
        throw new Error(`Claude API request failed: ${response.status} ${response.statusText}: ${errorText.substring(0, 200)}`);
      }

      const responseText = await response.text();
      logger.debug('Raw Claude API response', { responseText: responseText.substring(0, 500) });
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        logger.error('Failed to parse Claude API response as JSON', { 
          error: parseError.message,
          responseText: responseText.substring(0, 1000)
        });
        throw new Error(`Invalid JSON response from Claude API: ${parseError.message}`);
      }
      
      const content = data.content?.[0]?.text;
      
      if (!content) {
        logger.error('No content in Claude API response', { data });
        throw new Error('No response content from Claude API');
      }

      // Parse the JSON response from Claude
      const analysis = this.parseAnalysisResponse(content, availableSkills, allSkills);
      return analysis;

    } catch (error) {
      logger.error('Claude API call failed', { 
        error: error.message,
        character: character.name 
      });
      throw error;
    }
  }

  /**
   * Analyze just-in-time learning request
   * @param {Object} params - Analysis parameters
   * @param {string} params.apiKey - Claude API key for this request
   * @param {Object} params.character - Character data
   * @param {Array} params.allSkills - All skills array
   * @param {Array} params.teammates - All teammates data
   * @param {string} params.widgetSystemPrompt - Hidden system prompt
   * @param {string} params.userSystemPrompt - User's system prompt
   * @param {string} params.justInTimeQuestion - User's question
   */
  async analyzeJustInTimeRequest({ apiKey, character, allSkills, teammates, widgetSystemPrompt, userSystemPrompt, justInTimeQuestion }) {
    // Return mock data in development mode without API key or with "mock" key
    if (this.mockMode || !apiKey || apiKey === 'mock') {
      return this.getMockJustInTimeResponse(character, justInTimeQuestion);
    }

    // Use provided API key for this request
    const requestApiKey = apiKey || this.apiKey;
    if (!requestApiKey) {
      throw new Error('Claude API key is required for just-in-time analysis');
    }

    const prompt = this.buildJustInTimePrompt(character, allSkills, teammates, widgetSystemPrompt, userSystemPrompt, justInTimeQuestion);
    
    try {
      logger.info('Making Claude API request for just-in-time learning', { 
        url: this.apiUrl,
        hasApiKey: !!requestApiKey,
        apiKeyPrefix: requestApiKey ? requestApiKey.substring(0, 10) + '...' : 'none',
        model: this.model
      });

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': requestApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 2000,
          temperature: 0.7,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Claude API request failed for just-in-time', {
          status: response.status,
          statusText: response.statusText,
          error: errorText.substring(0, 500)
        });
        
        if (response.status === 401) {
          throw new Error('Invalid Claude API key configuration');
        } else if (response.status === 429) {
          throw new Error('Claude API rate limit exceeded');
        }
        throw new Error(`Claude API request failed: ${response.status} ${response.statusText}: ${errorText.substring(0, 200)}`);
      }

      const responseText = await response.text();
      logger.debug('Raw Claude API response for just-in-time', { responseText: responseText.substring(0, 500) });
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        logger.error('Failed to parse Claude API response as JSON for just-in-time', { 
          error: parseError.message,
          responseText: responseText.substring(0, 1000)
        });
        throw new Error('Invalid response format from Claude API');
      }

      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error('Unexpected response structure from Claude API');
      }

      const content = data.content[0].text;
      return { response: content };

    } catch (error) {
      logger.error('Error in just-in-time analysis', { 
        error: error.message,
        stack: error.stack 
      });
      throw error;
    }
  }

  /**
   * Build the analysis prompt for Claude
   */
  buildAnalysisPrompt(character, availableSkills, allSkills, context) {
    const masteredSkills = allSkills.filter(skill => 
      character.masteredSkills.includes(skill.id)
    );

    const allSkillsByCategory = allSkills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    }, {});

    const goalContext = context.goalSkill 
      ? `\nCURRENT GOAL: The character is working toward "${context.goalSkill}" - prioritize recommendations that support this goal.`
      : '';
    
    const additionalContext = context.additionalContext 
      ? `\nADDITIONAL CONTEXT: The user mentioned they hope to grow in these areas: "${context.additionalContext}"`
      : '';

    return `
Analyze this RPG character's skill progression and provide strategic recommendations:

CHARACTER: ${character.name}
ROLE: ${character.role}
CURRENT XP: ${character.currentXP || 0}
LEVEL: ${character.level || 1}${goalContext}${additionalContext}

MASTERED SKILLS (${masteredSkills.length}):
${masteredSkills.map(skill => 
  `- ${skill.name} (Level ${skill.level}, ${skill.category}, ${skill.xp_required} XP) - ${skill.description}`
).join('\n')}

AVAILABLE NEXT SKILLS:
${availableSkills.slice(0, 10).map(skill => 
  `- ${skill.name} (Level ${skill.level}, ${skill.category}, ${skill.xp_required} XP) - ${skill.description}`
).join('\n')}

SKILL CATEGORIES OVERVIEW:
${Object.entries(allSkillsByCategory).map(([category, categorySkills]) =>
  `${category}: ${categorySkills.length} total skills, ${masteredSkills.filter(s => s.category === category).length} mastered`
).join('\n')}

Please provide a JSON response with this exact structure:
{
  "currentStrengths": ["strength1", "strength2", "strength3"],
  "skillGaps": ["gap1", "gap2", "gap3"],
  "shortTermGoals": [
    {
      "skillName": "Exact Skill Name",
      "reasoning": "Why this skill should be learned next",
      "timeframe": "short",
      "priority": "high",
      "pathLength": 2
    }
  ],
  "longTermGoals": [
    {
      "skillName": "Exact Skill Name", 
      "reasoning": "Strategic importance of this skill",
      "timeframe": "long",
      "priority": "high",
      "pathLength": 8
    }
  ],
  "overallAssessment": "Strategic analysis of character's current build and recommended progression path"
}

IMPORTANT GUIDELINES:
- Use exact skill names that match the provided skill lists
- DO NOT recommend any skills that are already in the MASTERED SKILLS list
- Short-term goals: Skills that are 3 steps or fewer away (pathLength ≤ 3)
- Long-term goals: Skills that are more than 3 steps away (pathLength > 3)
- Provide 2-3 short-term goals and 2-3 long-term goals
- Focus on strategic skill synergies and character build optimization
- Consider the character's current XP and any additional context provided
- If additional context is provided, tailor recommendations to match those growth areas
- Only return valid JSON - no additional text before or after
`;
  }

  /**
   * Parse Claude's response and map skill names back to skill objects
   */
  parseAnalysisResponse(content, availableSkills, allSkills) {
    try {
      // Extract JSON from Claude's response
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        logger.error('No JSON found in Claude response', { content: content.substring(0, 500) });
        throw new Error('No valid JSON found in Claude response');
      }
      
      const jsonStr = content.slice(jsonStart, jsonEnd);
      logger.debug('Extracted JSON string', { jsonStr: jsonStr.substring(0, 500) });
      
      let aiResponse;
      try {
        aiResponse = JSON.parse(jsonStr);
      } catch (jsonParseError) {
        logger.error('Failed to parse extracted JSON', { 
          error: jsonParseError.message,
          jsonStr: jsonStr.substring(0, 1000)
        });
        throw new Error(`Invalid JSON in Claude response: ${jsonParseError.message}`);
      }

      // Map skill names back to skill objects
      const mapSkillName = (skillName) => {
        return availableSkills.find(skill => 
          skill.name.toLowerCase() === skillName.toLowerCase()
        ) || allSkills.find(skill => 
          skill.name.toLowerCase() === skillName.toLowerCase()
        );
      };

      // Transform the response with proper skill objects
      const analysis = {
        currentStrengths: aiResponse.currentStrengths || [],
        skillGaps: aiResponse.skillGaps || [],
        shortTermGoals: (aiResponse.shortTermGoals || [])
          .map(goal => ({
            skill: mapSkillName(goal.skillName),
            reasoning: goal.reasoning,
            timeframe: goal.timeframe,
            priority: goal.priority,
            pathLength: goal.pathLength
          }))
          .filter(goal => goal.skill), // Only include goals where we found the skill
        longTermGoals: (aiResponse.longTermGoals || [])
          .map(goal => ({
            skill: mapSkillName(goal.skillName),
            reasoning: goal.reasoning,
            timeframe: goal.timeframe,
            priority: goal.priority,
            pathLength: goal.pathLength
          }))
          .filter(goal => goal.skill), // Only include goals where we found the skill
        overallAssessment: aiResponse.overallAssessment || 'Analysis completed successfully.'
      };

      return analysis;

    } catch (error) {
      logger.error('Failed to parse Claude response', { 
        error: error.message,
        content: content.substring(0, 500) + '...' 
      });
      throw new Error('Failed to parse AI analysis response');
    }
  }

  /**
   * Health check for Claude service
   * @param {string} apiKey - Optional API key to test
   */
  async healthCheck(apiKey = null) {
    const testApiKey = apiKey || this.apiKey;
    if (this.mockMode || !testApiKey) {
      return { status: 'healthy', model: 'mock-model', mode: 'development' };
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': testApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 10,
          messages: [{
            role: 'user',
            content: 'Health check - please respond with "OK"'
          }]
        })
      });

      if (response.ok) {
        return { status: 'healthy', model: this.model };
      } else {
        return { status: 'unhealthy', error: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Generate mock analysis for development/testing
   */
  getMockAnalysis(character, availableSkills) {
    // Simulate processing delay
    return new Promise(resolve => {
      setTimeout(() => {
        const mockSkills = availableSkills.slice(0, 4);
        
        const analysis = {
          currentStrengths: [
            `Strong ${character.role.toLowerCase()} fundamentals`,
            `Good progression in ${this.getRandomCategory(mockSkills)}`,
            "Balanced skill development"
          ],
          skillGaps: [
            "Advanced combat techniques",
            "Elemental magic variety", 
            "Support skill synergies"
          ],
          shortTermGoals: mockSkills.slice(0, 2).map(skill => ({
            skill,
            reasoning: `${skill.name} would enhance your current ${skill.category} abilities and provide good XP efficiency. This skill is accessible within 3 steps of your current build.`,
            timeframe: 'short',
            priority: 'high',
            pathLength: Math.floor(Math.random() * 3) + 1
          })),
          longTermGoals: mockSkills.slice(2, 4).map(skill => ({
            skill,
            reasoning: `${skill.name} is a powerful ${skill.category} skill that would significantly expand your tactical options. This represents a longer-term investment requiring more than 3 skill steps.`,
            timeframe: 'long', 
            priority: 'medium',
            pathLength: Math.floor(Math.random() * 5) + 4
          })),
          overallAssessment: `${character.name} shows excellent potential as a ${character.role}. Focus on building core ${this.getRandomCategory(mockSkills)} abilities while maintaining balanced growth across all skill categories. Your current XP of ${character.currentXP} gives you good flexibility in skill choices.`
        };

        resolve(analysis);
      }, 1500); // Simulate API call delay
    });
  }

  getRandomCategory(skills) {
    const categories = [...new Set(skills.map(s => s.category))];
    return categories[Math.floor(Math.random() * categories.length)] || 'general';
  }

  /**
   * Build the just-in-time learning prompt for Claude
   */
  buildJustInTimePrompt(character, allSkills, teammates, widgetSystemPrompt, userSystemPrompt, justInTimeQuestion) {
    const masteredSkills = allSkills.filter(skill => 
      character.masteredSkills.includes(skill.id)
    );

    const teammateKnowledge = teammates.map(teammate => {
      const teammateSkills = allSkills.filter(skill => 
        teammate.mastered_skills && teammate.mastered_skills.includes(skill.id)
      );
      return {
        name: teammate.name,
        role: teammate.role,
        expertise: teammateSkills.map(skill => skill.name)
      };
    });

    return `${widgetSystemPrompt}

USER SYSTEM PROMPT:
${userSystemPrompt}

LEARNABLE SKILLS DATABASE:
${allSkills.map(skill => `- ${skill.name}: ${skill.description} (Category: ${skill.category})`).join('\n')}

TEAMMATE EXPERTISE:
${teammateKnowledge.map(teammate => 
  `${teammate.name} (${teammate.role}): Expert in ${teammate.expertise.join(', ')}`
).join('\n')}

JUST-IN-TIME QUESTION:
${justInTimeQuestion}

Please provide recommendations in the following format:
• **Key piece of knowledge that can help you advance:** [Specific knowledge or skill insight]
• **Key person(s) to talk to who are expert in that knowledge:** [Teammate name(s) and why they're the right person]
• **How your just-in-time question relates to your current goal:** [Connection between the question and their learning objectives]

Focus on actionable insights that bridge known knowledge with new concepts, emphasizing practical applications and immediate next steps.`;
  }

  /**
   * Generate mock just-in-time response for development/testing
   */
  getMockJustInTimeResponse(character, justInTimeQuestion) {
    return new Promise(resolve => {
      setTimeout(() => {
        const response = `**Key piece of knowledge that can help you advance:**
Understanding the fundamentals of ${character.role.toLowerCase()} strategy and how it connects to advanced techniques. This knowledge will help you make more informed decisions about skill progression and tactical applications.

**Key person(s) to talk to who are expert in that knowledge:**
Based on the team expertise, I recommend speaking with senior team members who have mastered complementary skills. They can provide practical insights and real-world applications that aren't covered in basic training materials.

**How your just-in-time question relates to your current goal:**
Your question "${justInTimeQuestion}" directly relates to bridging your current ${character.role.toLowerCase()} foundation with more advanced concepts. This aligns with your learning objectives by focusing on practical application rather than theoretical knowledge alone.

The key is to focus on incremental skill building while maintaining your core strengths. Consider practicing with scenarios that combine your existing knowledge with new challenges to accelerate your learning curve.`;

        resolve({ response });
      }, 1000);
    });
  }

  /**
   * Assess user's understanding of home lending terms
   * @param {Object} params - Assessment parameters
   * @param {string} params.apiKey - Claude API key for this request
   * @param {string} params.userResponse - User's explanation
   * @param {string} params.targetTerm - The term being assessed
   * @param {string} params.officialDefinition - Official definition of the term
   * @param {Array} params.examples - Examples of the term
   * @param {Object} params.context - Optional context (learning module, difficulty level)
   */
  async assessHomeLendingUnderstanding({ 
    apiKey, 
    userResponse, 
    targetTerm, 
    officialDefinition, 
    examples = [], 
    context = {} 
  }) {
    // Return mock data in development mode without API key or with "mock" key
    if (this.mockMode || !apiKey || apiKey === 'mock') {
      return this.getMockHomeLendingAssessment(userResponse, targetTerm);
    }

    // Use provided API key for this request
    const requestApiKey = apiKey || this.apiKey;
    if (!requestApiKey) {
      throw new Error('Claude API key is required for assessment');
    }

    // Validate API key format
    if (requestApiKey !== 'mock' && !requestApiKey.startsWith('sk-ant-api')) {
      throw new Error('Invalid API key format. Please provide a valid Claude API key.');
    }

    const prompt = this.buildHomeLendingAssessmentPrompt(
      userResponse, 
      targetTerm, 
      officialDefinition, 
      examples, 
      context
    );
    
    try {
      logger.info('Making Claude API request for home lending assessment', { 
        targetTerm,
        userResponseLength: userResponse.length,
        hasExamples: examples.length > 0,
        model: this.model
      });

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': requestApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        logger.error('Claude API error for home lending assessment', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          targetTerm
        });

        if (response.status === 401) {
          throw new Error('Invalid API key provided');
        } else if (response.status === 429) {
          throw new Error('Claude API rate limit exceeded');
        } else {
          throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      const content = data.content?.[0]?.text;

      if (!content) {
        logger.error('No content in Claude response for home lending assessment', { data, targetTerm });
        throw new Error('Invalid response format from Claude API');
      }

      // Parse the structured response
      const assessment = this.parseHomeLendingAssessmentResponse(content, targetTerm);
      
      logger.info('Home lending assessment completed successfully', {
        targetTerm,
        comprehensionLevel: assessment.comprehensionLevel,
        similaritiesCount: assessment.similarities.length,
        differencesCount: assessment.differences.length,
        suggestionsCount: assessment.suggestions.length
      });

      return assessment;

    } catch (error) {
      logger.error('Claude API call failed for home lending assessment', {
        error: error.message,
        targetTerm,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Build prompt for home lending understanding assessment
   */
  buildHomeLendingAssessmentPrompt(userResponse, targetTerm, officialDefinition, examples, context) {
    const examplesSection = examples.length > 0 ? 
      `\n\n**Official Examples:** ${examples.join(', ')}` : '';
    
    const contextSection = context.learningModule || context.difficultyLevel ? 
      `\n\n**Learning Context:** Module: ${context.learningModule || 'N/A'}, Difficulty: ${context.difficultyLevel || 'N/A'}` : '';

    return `You are an expert in home lending and mortgage terminology with extensive experience in financial education. Your role is to assess a learner's understanding of mortgage concepts by comparing their explanation to official definitions.

**Assessment Task:**
Analyze the learner's explanation of "${targetTerm}" and provide a comprehensive comparison with the official definition.

**Target Term:** ${targetTerm}

**Official Definition:** ${officialDefinition}${examplesSection}

**Learner's Explanation:** "${userResponse}"${contextSection}

**Instructions:**
Please provide a detailed assessment in the following JSON format. Be encouraging while being thorough in your analysis:

{
  "similarities": [
    "List what the learner got correct or mentioned that aligns with the official definition",
    "Include specific concepts they understood well",
    "Acknowledge accurate terminology they used"
  ],
  "differences": [
    "Identify key aspects missing from the learner's explanation",
    "Note any misconceptions or inaccuracies",
    "Highlight important official definition elements they didn't mention"
  ],
  "feedback": "A constructive overall assessment of their understanding with encouragement and specific observations about their explanation quality",
  "comprehensionLevel": "excellent|good|partial|needs-improvement",
  "suggestions": [
    "Specific recommendations for improving their understanding",
    "Study strategies or resources to address gaps",
    "Practice activities to reinforce learning"
  ]
}

**Assessment Criteria:**
- **Excellent**: Demonstrates thorough understanding with accurate terminology and comprehensive coverage
- **Good**: Shows solid grasp with minor gaps or areas for refinement  
- **Partial**: Understands basics but missing significant components or has some misconceptions
- **Needs-improvement**: Limited understanding with major gaps or misconceptions

Focus on helping the learner build knowledge progressively. Be specific about what they did well and provide actionable guidance for improvement.`;
  }

  /**
   * Parse Claude's response for home lending assessment
   */
  parseHomeLendingAssessmentResponse(content, targetTerm) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('No JSON found in Claude response for home lending assessment', { content, targetTerm });
        return this.parseHomeLendingAssessmentFallback(content, targetTerm);
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      const requiredFields = ['similarities', 'differences', 'feedback', 'comprehensionLevel', 'suggestions'];
      const missingFields = requiredFields.filter(field => !parsed[field]);
      
      if (missingFields.length > 0) {
        logger.warn('Missing fields in parsed assessment response', { 
          missingFields, 
          targetTerm,
          parsedKeys: Object.keys(parsed)
        });
        return this.parseHomeLendingAssessmentFallback(content, targetTerm);
      }

      // Ensure arrays are actually arrays
      ['similarities', 'differences', 'suggestions'].forEach(field => {
        if (!Array.isArray(parsed[field])) {
          parsed[field] = Array.isArray(parsed[field]) ? parsed[field] : [parsed[field]].filter(Boolean);
        }
      });

      // Validate comprehension level
      const validLevels = ['excellent', 'good', 'partial', 'needs-improvement'];
      if (!validLevels.includes(parsed.comprehensionLevel)) {
        logger.warn('Invalid comprehension level in assessment', { 
          level: parsed.comprehensionLevel, 
          targetTerm 
        });
        parsed.comprehensionLevel = 'partial'; // Default fallback
      }

      return parsed;

    } catch (error) {
      logger.error('Failed to parse Claude response for home lending assessment', {
        error: error.message,
        content: content.substring(0, 500),
        targetTerm
      });
      return this.parseHomeLendingAssessmentFallback(content, targetTerm);
    }
  }

  /**
   * Fallback parser for home lending assessment when JSON parsing fails
   */
  parseHomeLendingAssessmentFallback(content, targetTerm) {
    logger.info('Using fallback parser for home lending assessment', { targetTerm });
    
    // Extract key information using text patterns
    const similarities = this.extractListFromText(content, /similarities?[:\-\s]*\n?(.*?)(?=differences?|feedback|$)/is);
    const differences = this.extractListFromText(content, /differences?[:\-\s]*\n?(.*?)(?=feedback|suggestions?|$)/is);
    const suggestions = this.extractListFromText(content, /suggestions?[:\-\s]*\n?(.*?)$/is);
    
    // Extract feedback
    const feedbackMatch = content.match(/feedback[:\-\s]*\n?(.*?)(?=comprehension|suggestions?|$)/is);
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : 
      'Thank you for your response. Please review the official definition for better understanding.';
    
    // Determine comprehension level based on content
    let comprehensionLevel = 'partial';
    if (content.toLowerCase().includes('excellent') || content.toLowerCase().includes('outstanding')) {
      comprehensionLevel = 'excellent';
    } else if (content.toLowerCase().includes('good') || content.toLowerCase().includes('solid')) {
      comprehensionLevel = 'good';
    } else if (content.toLowerCase().includes('needs improvement') || content.toLowerCase().includes('limited')) {
      comprehensionLevel = 'needs-improvement';
    }

    return {
      similarities: similarities.length > 0 ? similarities : ['You engaged with the learning process'],
      differences: differences.length > 0 ? differences : ['Consider reviewing the official definition'],  
      feedback,
      comprehensionLevel,
      suggestions: suggestions.length > 0 ? suggestions : ['Review the official definition and practice explaining it in your own words']
    };
  }

  /**
   * Extract list items from text using regex patterns
   */
  extractListFromText(text, pattern) {
    const match = text.match(pattern);
    if (!match) return [];
    
    const listText = match[1];
    return listText
      .split(/\n|•|\*|\d+\.|-/)
      .map(item => item.trim())
      .filter(item => item.length > 0 && item !== '-' && item !== '•' && item !== '*')
      .slice(0, 5); // Limit to 5 items max
  }

  /**
   * Mock home lending assessment for development
   */
  getMockHomeLendingAssessment(userResponse, targetTerm) {
    const mockResponses = {
      'credit-score': {
        similarities: [
          'You correctly identified that credit scores are numerical representations',
          'You mentioned that they are used by lenders to assess risk',
          'Your explanation shows understanding of the scoring concept'
        ],
        differences: [
          'Consider including the typical score range (300-850)',
          'The definition also mentions specific scoring models like FICO',
          'Payment history as a key factor could be emphasized'
        ],
        feedback: 'Good foundation! You understand the basic concept but could benefit from more specific details about score ranges and factors.',
        comprehensionLevel: 'good',
        suggestions: [
          'Review the typical credit score ranges and what they mean',
          'Study the key factors that influence credit scores',
          'Practice explaining how credit scores are calculated'
        ]
      }
    };

    // Find matching mock response or use default
    const termKey = targetTerm.toLowerCase().replace(/\s+/g, '-');
    const mockResponse = mockResponses[termKey] || {
      similarities: ['You provided a thoughtful explanation showing engagement with the topic'],
      differences: ['Consider incorporating more technical terminology from the official definition'],
      feedback: 'Thank you for your explanation. With more study of the specific terminology, you\'ll develop stronger mastery.',
      comprehensionLevel: 'partial',
      suggestions: ['Review the official definition carefully', 'Practice explaining the concept to someone else']
    };

    logger.info('Returning mock home lending assessment', { targetTerm, comprehensionLevel: mockResponse.comprehensionLevel });
    return mockResponse;
  }
}