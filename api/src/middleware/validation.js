import { logger } from '../utils/logger.js';

/**
 * Validate the skill analysis request payload
 */
export function validateAnalysisRequest(req, res, next) {
  const { apiKey, character, availableSkills, allSkills } = req.body;

  // Validation errors
  const errors = [];

  // Validate API key (optional for development)
  if (apiKey && typeof apiKey !== 'string') {
    errors.push('apiKey must be a string');
  } else if (apiKey && !apiKey.startsWith('sk-ant-api')) {
    errors.push('apiKey must be a valid Anthropic API key');
  }

  // Validate character object
  if (!character) {
    errors.push('character is required');
  } else {
    if (!character.name || typeof character.name !== 'string') {
      errors.push('character.name must be a non-empty string');
    }
    if (!character.role || typeof character.role !== 'string') {
      errors.push('character.role must be a non-empty string');
    }
    if (character.currentXP !== undefined && typeof character.currentXP !== 'number') {
      errors.push('character.currentXP must be a number');
    }
    if (character.level !== undefined && typeof character.level !== 'number') {
      errors.push('character.level must be a number');
    }
    if (!Array.isArray(character.masteredSkills)) {
      errors.push('character.masteredSkills must be an array');
    }
  }

  // Validate skills arrays
  if (!Array.isArray(availableSkills)) {
    errors.push('availableSkills must be an array');
  } else if (availableSkills.length === 0) {
    errors.push('availableSkills cannot be empty');
  } else {
    // Validate skill objects structure
    availableSkills.forEach((skill, index) => {
      if (!skill.id || !skill.name || !skill.category) {
        errors.push(`availableSkills[${index}] must have id, name, and category`);
      }
    });
  }

  if (!Array.isArray(allSkills)) {
    errors.push('allSkills must be an array');
  } else if (allSkills.length === 0) {
    errors.push('allSkills cannot be empty');
  }

  // Validate request size (prevent DoS)
  const requestSize = JSON.stringify(req.body).length;
  if (requestSize > 1024 * 1024) { // 1MB limit
    errors.push('request payload too large (max 1MB)');
  }

  // Validate skill counts (prevent DoS)
  if (availableSkills && availableSkills.length > 500) {
    errors.push('too many available skills (max 500)');
  }
  if (allSkills && allSkills.length > 1000) {
    errors.push('too many total skills (max 1000)');
  }

  if (errors.length > 0) {
    logger.warn('Validation failed for AI analysis request', {
      errors,
      requestId: req.requestId,
      character: character?.name,
      ip: req.ip
    });

    return res.status(400).json({
      error: 'Validation failed',
      details: errors,
      code: 'VALIDATION_ERROR',
      requestId: req.requestId
    });
  }

  next();
}

/**
 * Sanitize skill data to prevent injection attacks
 */
export function sanitizeSkillData(skillData) {
  if (Array.isArray(skillData)) {
    return skillData.map(skill => sanitizeSingleSkill(skill));
  }
  return sanitizeSingleSkill(skillData);
}

function sanitizeSingleSkill(skill) {
  return {
    id: typeof skill.id === 'string' ? skill.id.substring(0, 100) : '',
    name: typeof skill.name === 'string' ? skill.name.substring(0, 200) : '',
    description: typeof skill.description === 'string' ? skill.description.substring(0, 500) : '',
    category: typeof skill.category === 'string' ? skill.category.substring(0, 50) : '',
    level: typeof skill.level === 'number' ? Math.max(0, Math.min(skill.level, 999)) : 0,
    xp_required: typeof skill.xp_required === 'number' ? Math.max(0, Math.min(skill.xp_required, 999999)) : 0,
    prerequisites: Array.isArray(skill.prerequisites) ? skill.prerequisites.slice(0, 20) : []
  };
}