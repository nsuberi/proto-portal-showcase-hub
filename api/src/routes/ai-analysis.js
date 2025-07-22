import express from 'express';
import { ClaudeService } from '../services/claude-service.js';
import { validateAnalysisRequest } from '../middleware/validation.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const claudeService = new ClaudeService();

/**
 * POST /api/v1/ai-analysis/skill-recommendations
 * 
 * Analyzes character skills and provides AI-powered recommendations
 * 
 * Request Body:
 * {
 *   "apiKey": "sk-ant-api03-...", // Claude API key for this request
 *   "character": {
 *     "name": "Tidus",
 *     "role": "Guardian",
 *     "currentXP": 1500,
 *     "level": 10,
 *     "masteredSkills": [...]
 *   },
 *   "availableSkills": [...],
 *   "allSkills": [...],
 *   "context": {
 *     "goalSkill": "optional-skill-id"
 *   }
 * }
 * 
 * Response:
 * {
 *   "analysis": {
 *     "currentStrengths": [...],
 *     "skillGaps": [...],
 *     "shortTermGoals": [...],
 *     "longTermGoals": [...],
 *     "overallAssessment": "..."
 *   },
 *   "metadata": {
 *     "analysisId": "...",
 *     "timestamp": "...",
 *     "model": "claude-3-sonnet-20240229"
 *   }
 * }
 */
router.post('/ai-analysis/skill-recommendations', 
  authMiddleware,
  validateAnalysisRequest,
  async (req, res) => {
    const startTime = Date.now();
    
    try {
      const { apiKey, character, availableSkills, allSkills, context = {} } = req.body;
      
      logger.info('Processing AI analysis request', {
        character: character.name,
        masteredSkillsCount: character.masteredSkills.length,
        availableSkillsCount: availableSkills.length,
        hasGoalSkill: !!context.goalSkill,
        requestId: req.requestId
      });

      // Generate analysis using Claude
      const analysis = await claudeService.analyzeSkills({
        apiKey,
        character,
        availableSkills,
        allSkills,
        context
      });

      const processingTime = Date.now() - startTime;

      logger.info('AI analysis completed', {
        character: character.name,
        processingTimeMs: processingTime,
        shortTermGoalsCount: analysis.shortTermGoals.length,
        longTermGoalsCount: analysis.longTermGoals.length,
        requestId: req.requestId
      });

      res.status(200).json({
        analysis,
        metadata: {
          analysisId: req.requestId,
          timestamp: new Date().toISOString(),
          model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
          processingTimeMs: processingTime
        }
      });

    } catch (error) {
      logger.error('AI analysis failed', {
        error: error.message,
        character: req.body.character?.name,
        requestId: req.requestId,
        stack: error.stack,
        requestBody: JSON.stringify(req.body).substring(0, 500),
        hasApiKey: !!req.body.apiKey,
        apiKeyPrefix: req.body.apiKey ? req.body.apiKey.substring(0, 10) : 'none'
      });

      // Return appropriate error based on type
      if (error.message.includes('API key')) {
        return res.status(503).json({
          error: 'AI service temporarily unavailable',
          code: 'AI_SERVICE_ERROR',
          requestId: req.requestId
        });
      }

      if (error.message.includes('rate limit')) {
        return res.status(429).json({
          error: 'AI service rate limit exceeded, please try again later',
          code: 'RATE_LIMIT_EXCEEDED',
          requestId: req.requestId
        });
      }

      res.status(500).json({
        error: 'Internal server error during analysis',
        code: 'ANALYSIS_ERROR',
        requestId: req.requestId
      });
    }
  }
);

/**
 * GET /api/v1/ai-analysis/health
 * 
 * Health check for AI analysis service
 */
router.get('/ai-analysis/health', async (req, res) => {
  try {
    const health = await claudeService.healthCheck();
    res.status(200).json({
      status: 'healthy',
      aiService: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('AI service health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      error: 'AI service unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

export { router as aiAnalysisRoutes };