import express from 'express';
import { ClaudeService } from '../services/claude-service.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const claudeService = new ClaudeService();

/**
 * GET /api/v1/ai-analysis/health
 * 
 * Health check endpoint for AI analysis service
 * Returns service status and AI provider information
 */
router.get('/ai-analysis/health', async (req, res) => {
  try {
    // Check Claude service status
    const aiServiceStatus = await claudeService.healthCheck();
    
    res.status(200).json({
      status: 'healthy',
      aiService: aiServiceStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'production'
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'degraded',
      aiService: { status: 'unavailable', error: error.message },
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'production'
    });
  }
});

/**
 * POST /api/v1/ai-analysis/skills-and-mentors-recommendations
 * 
 * Analyze skills and mentors recommendations requests with system prompts and teammate expertise
 */
router.post('/ai-analysis/skills-and-mentors-recommendations',
  authMiddleware,
  async (req, res) => {
    try {
      const { 
        character, 
        allSkills, 
        teammates, 
        widgetSystemPrompt, 
        userSystemPrompt, 
        justInTimeQuestion 
      } = req.body;

      // Validate required fields
      if (!character || !allSkills || !teammates || !widgetSystemPrompt || !userSystemPrompt || !justInTimeQuestion) {
        return res.status(400).json({
          error: 'Missing required fields: character, allSkills, teammates, widgetSystemPrompt, userSystemPrompt, justInTimeQuestion',
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        });
      }

      // Validate character structure
      if (!character.name || !character.role || !Array.isArray(character.masteredSkills)) {
        return res.status(400).json({
          error: 'Invalid character structure: name, role, and masteredSkills array are required',
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        });
      }

      logger.info('Processing just-in-time learning request', {
        character: character.name,
        role: character.role,
        skillsCount: allSkills.length,
        teammatesCount: teammates.length,
        questionLength: justInTimeQuestion.length,
        requestId: req.requestId
      });

      const startTime = Date.now();
      const response = await claudeService.analyzeJustInTimeRequest({
        character,
        allSkills,
        teammates,
        widgetSystemPrompt,
        userSystemPrompt,
        justInTimeQuestion
      });

      const processingTime = Date.now() - startTime;

      logger.info('Just-in-time analysis completed', {
        processingTimeMs: processingTime,
        character: character.name,
        requestId: req.requestId
      });

      res.status(200).json({
        ...response,
        metadata: {
          analysisId: req.requestId,
          timestamp: new Date().toISOString(),
          model: claudeService.model,
          processingTimeMs: processingTime
        }
      });

    } catch (error) {
      logger.error('Just-in-time analysis failed', {
        error: error.message,
        stack: error.stack,
        requestId: req.requestId
      });

      // Return appropriate error status
      const status = error.message.includes('API key') ? 401 : 
                   error.message.includes('rate limit') ? 429 : 
                   500;

      res.status(status).json({
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }
);

/**
 * POST /api/v1/ai-analysis/home-lending-assessment
 * 
 * Analyzes user's spoken or written understanding of home lending terms
 * Uses server-side Claude API key from AWS Secrets Manager
 * 
 * Request Body:
 * {
 *   "userResponse": "user's explanation",
 *   "targetTerm": "Credit Score",
 *   "officialDefinition": "A numerical representation of creditworthiness...",
 *   "examples": ["FICO score of 740", "VantageScore of 680"],
 *   "context": {
 *     "learningModule": "basic-terms",
 *     "difficultyLevel": "beginner"
 *   }
 * }
 * 
 * Response:
 * {
 *   "assessment": {
 *     "similarities": ["You correctly mentioned...", "Your explanation includes..."],
 *     "differences": ["Consider including...", "The definition also mentions..."],
 *     "feedback": "Great work! You demonstrate solid understanding...",
 *     "comprehensionLevel": "good",
 *     "suggestions": ["Review the official definition...", "Practice explaining..."]
 *   },
 *   "metadata": {
 *     "assessmentId": "...",
 *     "timestamp": "...",
 *     "model": "claude-3-5-sonnet-20241022",
 *     "processingTimeMs": 1200
 *   }
 * }
 */
router.post('/ai-analysis/home-lending-assessment', 
  authMiddleware,
  async (req, res) => {
    const startTime = Date.now();
    
    try {
      const { 
        userResponse, 
        targetTerm, 
        officialDefinition, 
        examples = [], 
        context = {} 
      } = req.body;
      
      // Validate required fields
      if (!userResponse || !targetTerm || !officialDefinition) {
        return res.status(400).json({
          error: 'Missing required fields: userResponse, targetTerm, officialDefinition',
          code: 'MISSING_REQUIRED_FIELDS',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
      }
      
      // Validate field lengths
      if (userResponse.length > 2000) {
        return res.status(400).json({
          error: 'User response is too long (max 2000 characters)',
          code: 'RESPONSE_TOO_LONG',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
      }
      
      if (targetTerm.length > 200) {
        return res.status(400).json({
          error: 'Target term is too long (max 200 characters)',
          code: 'TERM_TOO_LONG',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
      }
      
      if (officialDefinition.length > 1000) {
        return res.status(400).json({
          error: 'Official definition is too long (max 1000 characters)',
          code: 'DEFINITION_TOO_LONG',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
      }
      
      logger.info('Processing home lending assessment request', {
        targetTerm,
        userResponseLength: userResponse.length,
        hasExamples: examples.length > 0,
        learningModule: context.learningModule,
        difficultyLevel: context.difficultyLevel,
        requestId: req.requestId
      });

      // Generate assessment using Claude
      const assessment = await claudeService.assessHomeLendingUnderstanding({
        userResponse,
        targetTerm,
        officialDefinition,
        examples,
        context
      });

      const processingTime = Date.now() - startTime;

      logger.info('Home lending assessment completed', {
        targetTerm,
        comprehensionLevel: assessment.comprehensionLevel,
        processingTimeMs: processingTime,
        requestId: req.requestId
      });

      res.status(200).json({
        assessment,
        metadata: {
          assessmentId: req.requestId,
          timestamp: new Date().toISOString(),
          model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
          processingTimeMs: processingTime
        }
      });

    } catch (error) {
      logger.error('Home lending assessment failed', {
        error: error.message,
        targetTerm: req.body.targetTerm,
        requestId: req.requestId,
        stack: error.stack,
        hasApiKey: !!req.body.apiKey,
        apiKeyPrefix: req.body.apiKey ? req.body.apiKey.substring(0, 10) : 'none'
      });

      // Return appropriate error based on type
      if (error.message.includes('API key')) {
        return res.status(503).json({
          error: 'AI service temporarily unavailable',
          code: 'AI_SERVICE_ERROR',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
      }

      if (error.message.includes('rate limit')) {
        return res.status(429).json({
          error: 'AI service rate limit exceeded, please try again later',
          code: 'RATE_LIMIT_EXCEEDED',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
      }

      res.status(500).json({
        error: 'Internal server error during assessment',
        code: 'ASSESSMENT_ERROR',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
    }
  }
);

export { router as aiAnalysisRoutes };