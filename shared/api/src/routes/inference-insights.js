import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Resolve the feedback file path relative to the repo root
const FEEDBACK_PATH = path.resolve(__dirname, '../../../../prototypes/inference-insights/data/feedback.json');

function readFeedback() {
  try {
    return JSON.parse(fs.readFileSync(FEEDBACK_PATH, 'utf-8'));
  } catch {
    return { favorites: [], dismissed: [], topicRequests: [], lastUpdated: new Date().toISOString() };
  }
}

function writeFeedback(data) {
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(FEEDBACK_PATH, JSON.stringify(data, null, 2) + '\n');
}

// GET current feedback state
router.get('/inference-insights/feedback', (req, res) => {
  res.json(readFeedback());
});

// POST a favorite
router.post('/inference-insights/feedback/favorite', (req, res) => {
  const { insightId } = req.body;
  if (!insightId) return res.status(400).json({ error: 'insightId required' });

  const feedback = readFeedback();
  if (!feedback.favorites.includes(insightId)) {
    feedback.favorites.push(insightId);
  }
  // Remove from dismissed if present
  feedback.dismissed = feedback.dismissed.filter(id => id !== insightId);
  writeFeedback(feedback);
  logger.info(`[inference-insights] Favorited: ${insightId}`);
  res.json(feedback);
});

// POST a dismissal
router.post('/inference-insights/feedback/dismiss', (req, res) => {
  const { insightId } = req.body;
  if (!insightId) return res.status(400).json({ error: 'insightId required' });

  const feedback = readFeedback();
  if (!feedback.dismissed.includes(insightId)) {
    feedback.dismissed.push(insightId);
  }
  // Remove from favorites if present
  feedback.favorites = feedback.favorites.filter(id => id !== insightId);
  writeFeedback(feedback);
  logger.info(`[inference-insights] Dismissed: ${insightId}`);
  res.json(feedback);
});

// POST a topic request
router.post('/inference-insights/feedback/topic', (req, res) => {
  const { topic } = req.body;
  if (!topic?.trim()) return res.status(400).json({ error: 'topic required' });

  const feedback = readFeedback();
  feedback.topicRequests.push({
    id: crypto.randomUUID(),
    topic: topic.trim(),
    submittedAt: new Date().toISOString(),
    status: 'pending',
  });
  writeFeedback(feedback);
  logger.info(`[inference-insights] Topic requested: ${topic.trim()}`);
  res.json(feedback);
});

// DELETE a favorite (unfavorite)
router.delete('/inference-insights/feedback/favorite', (req, res) => {
  const { insightId } = req.body;
  if (!insightId) return res.status(400).json({ error: 'insightId required' });

  const feedback = readFeedback();
  feedback.favorites = feedback.favorites.filter(id => id !== insightId);
  writeFeedback(feedback);
  logger.info(`[inference-insights] Unfavorited: ${insightId}`);
  res.json(feedback);
});

export default router;
