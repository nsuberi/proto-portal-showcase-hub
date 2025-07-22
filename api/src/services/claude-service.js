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
    // Return mock data in development mode without API key
    if (this.mockMode || !apiKey) {
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
        apiKeyPrefix: requestApiKey ? requestApiKey.substring(0, 10) + '...' : 'none'
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
        if (response.status === 401) {
          throw new Error('Invalid Claude API key configuration');
        } else if (response.status === 429) {
          throw new Error('Claude API rate limit exceeded');
        }
        throw new Error(`Claude API request failed: ${response.status} ${response.statusText}`);
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

    return `
Analyze this RPG character's skill progression and provide strategic recommendations:

CHARACTER: ${character.name}
ROLE: ${character.role}
CURRENT XP: ${character.currentXP || 0}
LEVEL: ${character.level || 1}${goalContext}

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

IMPORTANT: 
- Use exact skill names that match the provided skill lists
- Provide 2-3 short-term goals (skills that can be learned soon)
- Provide 2-3 long-term goals (powerful skills worth working toward)
- Focus on strategic skill synergies and character build optimization
- Consider the character's current XP when making recommendations
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
            reasoning: `${skill.name} would enhance your current ${skill.category} abilities and provide good XP efficiency.`,
            timeframe: 'short',
            priority: 'high',
            pathLength: Math.floor(Math.random() * 3) + 1
          })),
          longTermGoals: mockSkills.slice(2, 4).map(skill => ({
            skill,
            reasoning: `${skill.name} is a powerful ${skill.category} skill that would significantly expand your tactical options.`,
            timeframe: 'long', 
            priority: 'medium',
            pathLength: Math.floor(Math.random() * 5) + 5
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
}