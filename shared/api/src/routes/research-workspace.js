import express from 'express';
import crypto from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// ---------------------------------------------------------------------------
// AWS clients — lazy-initialised so the module can be imported even when AWS
// credentials are not configured (e.g. in local development / tests).
// ---------------------------------------------------------------------------

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'research-workspace';
const S3_BUCKET = process.env.RESEARCH_WORKSPACE_BUCKET || 'research-workspace-content';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

let _docClient;
function docClient() {
  if (!_docClient) {
    const raw = new DynamoDBClient({ region: AWS_REGION });
    _docClient = DynamoDBDocumentClient.from(raw, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return _docClient;
}

let _s3;
function s3() {
  if (!_s3) {
    _s3 = new S3Client({ region: AWS_REGION });
  }
  return _s3;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const VALID_CONTENT_TYPES = ['insight', 'synthesis', 'architecture'];
const VALID_INTENTION_TYPES = ['learn', 'integrate'];
const VALID_FEEDBACK_ACTIONS = ['favorite', 'dismiss', 'request'];
const VALID_INTENTION_STATUSES = ['paused', 'active', 'completed'];

function validateContentType(type) {
  return VALID_CONTENT_TYPES.includes(type);
}

function validateIntentionType(type) {
  return VALID_INTENTION_TYPES.includes(type);
}

// ---------------------------------------------------------------------------
// GET /published — query published content (public, no auth)
// ---------------------------------------------------------------------------
// Query params: ?type=insight|synthesis|architecture  &domain=  &since=
// ---------------------------------------------------------------------------

router.get('/published', async (req, res, next) => {
  try {
    const { type, domain, since } = req.query;

    // Validate optional type param
    if (type && !validateContentType(type)) {
      return res.status(400).json({
        error: `Invalid type. Must be one of: ${VALID_CONTENT_TYPES.join(', ')}`,
        code: 'INVALID_TYPE',
      });
    }

    let params;

    if (type) {
      // Use the by-type GSI when filtering by content type
      params = {
        TableName: TABLE_NAME,
        IndexName: 'by-type',
        KeyConditionExpression: '#contentType = :type',
        ExpressionAttributeNames: { '#contentType': 'contentType' },
        ExpressionAttributeValues: { ':type': type },
      };
    } else {
      // Query all published content — pk begins with CONTENT#
      params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': 'CONTENT#published',
          ':skPrefix': 'CONTENT#',
        },
      };
    }

    // Optional: filter by domain
    const filterExpressions = [];
    if (domain) {
      filterExpressions.push('contains(domains, :domain)');
      params.ExpressionAttributeValues = {
        ...params.ExpressionAttributeValues,
        ':domain': domain,
      };
    }

    // Optional: filter by since (ISO date string)
    if (since) {
      filterExpressions.push('publishedAt >= :since');
      params.ExpressionAttributeValues = {
        ...params.ExpressionAttributeValues,
        ':since': since,
      };
    }

    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(' AND ');
    }

    const result = await docClient().send(new QueryCommand(params));

    logger.info('[research-workspace] Published content queried', {
      type,
      domain,
      since,
      count: result.Items?.length ?? 0,
    });

    res.json({
      items: result.Items || [],
      count: result.Items?.length ?? 0,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /publish — publish content from vault to gallery (auth required)
// ---------------------------------------------------------------------------

router.post('/publish', authMiddleware, async (req, res, next) => {
  try {
    const { type, title, summary, contentPath, tags, domains } = req.body;

    // Validation
    if (!type || !validateContentType(type)) {
      return res.status(400).json({
        error: `type is required and must be one of: ${VALID_CONTENT_TYPES.join(', ')}`,
        code: 'INVALID_TYPE',
      });
    }
    if (!title?.trim()) {
      return res.status(400).json({ error: 'title is required', code: 'MISSING_TITLE' });
    }
    if (!summary?.trim()) {
      return res.status(400).json({ error: 'summary is required', code: 'MISSING_SUMMARY' });
    }
    if (!contentPath?.trim()) {
      return res
        .status(400)
        .json({ error: 'contentPath is required', code: 'MISSING_CONTENT_PATH' });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Write metadata to DynamoDB
    const item = {
      pk: 'CONTENT#published',
      sk: `CONTENT#${id}`,
      id,
      contentType: type,
      title: title.trim(),
      summary: summary.trim(),
      contentPath: contentPath.trim(),
      tags: tags || [],
      domains: domains || [],
      publishedAt: now,
      updatedAt: now,
      status: 'published',
    };

    await docClient().send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    // TODO: Upload rendered content to S3
    // await s3().send(new PutObjectCommand({
    //   Bucket: S3_BUCKET,
    //   Key: `published/${type}/${id}.json`,
    //   Body: JSON.stringify({ title, summary, contentPath }),
    //   ContentType: 'application/json',
    // }));

    // TODO: Invalidate CloudFront cache for the published content path
    // This would use @aws-sdk/client-cloudfront CreateInvalidationCommand

    logger.info('[research-workspace] Content published', { id, type, title: title.trim() });

    res.status(201).json({
      id,
      ...item,
      message: 'Content published successfully',
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /intentions — create a learning intention (auth required)
// ---------------------------------------------------------------------------

router.post('/intentions', authMiddleware, async (req, res, next) => {
  try {
    const { type, topic, schedule } = req.body;

    if (!type || !validateIntentionType(type)) {
      return res.status(400).json({
        error: `type is required and must be one of: ${VALID_INTENTION_TYPES.join(', ')}`,
        code: 'INVALID_TYPE',
      });
    }
    if (!topic?.trim()) {
      return res.status(400).json({ error: 'topic is required', code: 'MISSING_TOPIC' });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const item = {
      pk: 'USER#default',
      sk: `INTENTION#${id}`,
      id,
      intentionType: type,
      topic: topic.trim(),
      schedule: schedule || null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await docClient().send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    logger.info('[research-workspace] Intention created', { id, type, topic: topic.trim() });

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /intentions — list user's active intentions (auth required)
// ---------------------------------------------------------------------------

router.get('/intentions', authMiddleware, async (req, res, next) => {
  try {
    const result = await docClient().send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': 'USER#default',
          ':skPrefix': 'INTENTION#',
        },
      })
    );

    logger.info('[research-workspace] Intentions listed', {
      count: result.Items?.length ?? 0,
    });

    res.json({
      items: result.Items || [],
      count: result.Items?.length ?? 0,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PATCH /intentions/:id — update intention status (auth required)
// ---------------------------------------------------------------------------

router.patch('/intentions/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !VALID_INTENTION_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `status is required and must be one of: ${VALID_INTENTION_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS',
      });
    }

    const now = new Date().toISOString();

    const result = await docClient().send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          pk: 'USER#default',
          sk: `INTENTION#${id}`,
        },
        UpdateExpression: 'SET #status = :status, updatedAt = :now',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': status,
          ':now': now,
        },
        ConditionExpression: 'attribute_exists(pk)',
        ReturnValues: 'ALL_NEW',
      })
    );

    logger.info('[research-workspace] Intention updated', { id, status });

    res.json(result.Attributes);
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return res.status(404).json({
        error: 'Intention not found',
        code: 'NOT_FOUND',
      });
    }
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /feedback — submit feedback on content (auth required)
// ---------------------------------------------------------------------------

router.post('/feedback', authMiddleware, async (req, res, next) => {
  try {
    const { contentId, action, topic } = req.body;

    if (!action || !VALID_FEEDBACK_ACTIONS.includes(action)) {
      return res.status(400).json({
        error: `action is required and must be one of: ${VALID_FEEDBACK_ACTIONS.join(', ')}`,
        code: 'INVALID_ACTION',
      });
    }

    // For favorite/dismiss, contentId is required
    if ((action === 'favorite' || action === 'dismiss') && !contentId) {
      return res.status(400).json({
        error: 'contentId is required for favorite/dismiss actions',
        code: 'MISSING_CONTENT_ID',
      });
    }

    // For request, topic is required
    if (action === 'request' && !topic?.trim()) {
      return res.status(400).json({
        error: 'topic is required for request action',
        code: 'MISSING_TOPIC',
      });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    let item;
    if (action === 'request') {
      item = {
        pk: 'USER#default',
        sk: `STATE#feedback#${id}`,
        id,
        action,
        topic: topic.trim(),
        createdAt: now,
      };
    } else {
      item = {
        pk: 'USER#default',
        sk: `STATE#feedback#${id}`,
        id,
        action,
        contentId,
        createdAt: now,
      };
    }

    await docClient().send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    logger.info('[research-workspace] Feedback submitted', { id, action, contentId, topic });

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /feedback — get user's feedback (auth required)
// ---------------------------------------------------------------------------

router.get('/feedback', authMiddleware, async (req, res, next) => {
  try {
    const result = await docClient().send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': 'USER#default',
          ':skPrefix': 'STATE#feedback#',
        },
      })
    );

    // Group feedback by action for easier consumption
    const items = result.Items || [];
    const grouped = {
      favorites: items.filter((i) => i.action === 'favorite'),
      dismissed: items.filter((i) => i.action === 'dismiss'),
      requests: items.filter((i) => i.action === 'request'),
    };

    logger.info('[research-workspace] Feedback retrieved', {
      total: items.length,
      favorites: grouped.favorites.length,
      dismissed: grouped.dismissed.length,
      requests: grouped.requests.length,
    });

    res.json({
      items,
      grouped,
      count: items.length,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
