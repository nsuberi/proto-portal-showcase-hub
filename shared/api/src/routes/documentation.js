import { Router } from 'express';
import { ClaudeService } from '../services/claude-service.js';
import { logger } from '../utils/logger.js';
import { authMiddleware } from '../middleware/auth.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const claudeService = new ClaudeService();

// GitHub API configuration
const GITHUB_REPO_OWNER = 'nsuberi';
const GITHUB_REPO_NAME = 'proto-portal-showcase-hub';
const GITHUB_API_BASE = 'https://api.github.com';

// Map of questions to relevant file paths in the codebase
const codebaseLinks = {
  'api': 'https://github.com/nsuberi/proto-portal-showcase-hub/blob/main/shared/api/src/services/claude-service.js',
  'claude': 'https://github.com/nsuberi/proto-portal-showcase-hub/blob/main/shared/api/src/services/claude-service.js',
  'design': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/shared/design-tokens',
  'tokens': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/shared/design-tokens',
  'ffx': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/prototypes/ffx-skill-map',
  'skill': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/prototypes/ffx-skill-map',
  'home': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/prototypes/home-lending-learning',
  'lending': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/prototypes/home-lending-learning',
  'documentation': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/prototypes/documentation-explorer',
  'explorer': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/prototypes/documentation-explorer',
  'portfolio': 'https://github.com/nsuberi/proto-portal-showcase-hub/blob/main/src/components/Portfolio.tsx',
  'main': 'https://github.com/nsuberi/proto-portal-showcase-hub/blob/main/src/App.tsx',
  'deploy': 'https://github.com/nsuberi/proto-portal-showcase-hub/blob/main/.github/workflows/deploy.yml',
  'github': 'https://github.com/nsuberi/proto-portal-showcase-hub/blob/main/.github/workflows/deploy.yml',
  'build': 'https://github.com/nsuberi/proto-portal-showcase-hub/blob/main/scripts/build.sh',
  'terraform': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/terraform',
  'infrastructure': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/terraform',
  'test': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/e2e',
  'e2e': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/e2e',
  'default': 'https://github.com/nsuberi/proto-portal-showcase-hub'
};

/**
 * Fetch repository structure from GitHub API
 */
async function fetchRepositoryStructure() {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/git/trees/main?recursive=1`
    );
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Extract file paths and types, filter for relevant files
    const files = data.tree
      .filter(item => item.type === 'blob') // Only files, not directories
      .map(item => ({
        path: item.path,
        size: item.size,
        sha: item.sha,
        url: `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/blob/main/${item.path}`
      }))
      .filter(file => {
        // Filter for relevant file types and exclude certain directories
        const relevantExtensions = ['.js', '.ts', '.tsx', '.jsx', '.py', '.md', '.json', '.yml', '.yaml', '.sql', '.sh'];
        const irrelevantPaths = ['node_modules/', '.git/', 'dist/', 'build/', '.cache/', '.yarn/'];
        
        const hasRelevantExtension = relevantExtensions.some(ext => file.path.endsWith(ext));
        const isInIrrelevantPath = irrelevantPaths.some(path => file.path.includes(path));
        
        return hasRelevantExtension && !isInIrrelevantPath;
      });
    
    logger.info('Fetched repository structure', { 
      totalFiles: files.length,
      samplePaths: files.slice(0, 5).map(f => f.path)
    });
    
    return files;
  } catch (error) {
    logger.error('Failed to fetch repository structure', { error: error.message });
    return [];
  }
}

/**
 * Ask a documentation question and get relevant codebase files
 * POST /api/v1/documentation/ask
 */
router.post('/documentation/ask', authMiddleware, async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid question parameter'
      });
    }

    logger.info('Documentation question received', { 
      question: question.substring(0, 200) + (question.length > 200 ? '...' : ''),
      questionLength: question.length
    });

    // Fetch current repository structure
    const repositoryFiles = await fetchRepositoryStructure();

    // Call Claude to analyze the question and determine relevant files
    try {
      const claudeResponse = await claudeService.analyzeDocumentationQuestion({
        question,
        availableFiles: repositoryFiles,
        codebaseLinks
      });

      logger.info('Claude analysis completed', {
        recommendedFiles: claudeResponse.files?.length || 0,
        confidence: claudeResponse.confidence
      });

      res.json({
        files: claudeResponse.files || [],
        confidence: claudeResponse.confidence,
        reasoning: claudeResponse.reasoning,
        justification: claudeResponse.justification
      });

    } catch (claudeError) {
      logger.error('Claude API failed', { 
        error: claudeError.message 
      });

      return res.status(503).json({
        error: 'Documentation service is temporarily unavailable. Please try again when the connection to Claude is restored.'
      });
    }

  } catch (error) {
    logger.error('Documentation question failed', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * Get all documentation files
 * GET /api/v1/documentation/files
 */
router.get('/documentation/files', async (req, res) => {
  try {
    // Path to docs folder - different in Lambda vs local development
    const docsPath = process.env.AWS_LAMBDA_FUNCTION_NAME 
      ? path.resolve(__dirname, '../docs')
      : path.resolve(__dirname, '../../../../docs');
    
    logger.info('Loading documentation files', { docsPath });

    const files = await fs.readdir(docsPath);
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    
    const documentsData = [];
    
    for (let i = 0; i < markdownFiles.length; i++) {
      const filename = markdownFiles[i];
      const filePath = path.join(docsPath, filename);
      
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const filenameParts = filename.split('.');
        const baseName = filenameParts[0];
        
        // Generate floating animation properties for visual variety
        const positions = [
          { x: 15, y: 20 },
          { x: 60, y: 15 },
          { x: 35, y: 50 },
          { x: 25, y: 55 },
          { x: 65, y: 40 },
          { x: 45, y: 30 },
          { x: 70, y: 25 },
          { x: 20, y: 45 }
        ];
        
        const durations = [65, 75, 80, 70, 85, 90, 60, 95];
        const delays = [0, 8, 12, 5, 15, 20, 3, 18];
        
        const position = positions[i % positions.length];
        const floatDuration = durations[i % durations.length];
        const floatDelay = delays[i % delays.length];
        
        documentsData.push({
          id: baseName.toLowerCase().replace(/_/g, '-'),
          title: filename,
          filename,
          content,
          position,
          floatDuration,
          floatDelay
        });
        
      } catch (fileError) {
        logger.warn('Failed to read documentation file', {
          filename,
          error: fileError.message
        });
      }
    }
    
    logger.info('Documentation files loaded successfully', { 
      fileCount: documentsData.length 
    });
    
    res.json({
      documents: documentsData,
      codebaseLinks
    });
    
  } catch (error) {
    logger.error('Failed to load documentation files', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      error: 'Failed to load documentation files'
    });
  }
});

/**
 * Get metadata about a documentation file
 * GET /api/v1/documentation/metadata/:filename
 */
router.get('/documentation/metadata/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({
        error: 'Missing filename parameter'
      });
    }

    // Path to docs folder - different in Lambda vs local development
    const docsPath = process.env.AWS_LAMBDA_FUNCTION_NAME 
      ? path.resolve(__dirname, '../docs')
      : path.resolve(__dirname, '../../../../docs');
    const filePath = path.join(docsPath, filename);
    
    // Check if file exists and get stats
    try {
      const stats = await fs.stat(filePath);
      
      res.json({
        filename,
        size: stats.size,
        lastModified: stats.mtime,
        created: stats.birthtime
      });
    } catch (fileError) {
      logger.warn('Documentation file not found', {
        filename,
        error: fileError.message
      });
      
      return res.status(404).json({
        error: 'Documentation file not found'
      });
    }
    
  } catch (error) {
    logger.error('Failed to get documentation metadata', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      error: 'Failed to get documentation metadata'
    });
  }
});


export default router;