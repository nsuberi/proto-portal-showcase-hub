// research-workspace scaler
//
// One Lambda, three jobs — keeps idle cost at $0 without killing active work:
//
//   1. ALB  POST /_control/wake   → scale the ECS service 0→1, stamp a fresh
//                                    heartbeat (grace window so the reaper won't
//                                    kill the still-booting task), return status.
//   2. ALB  GET  /_control/status → report desired/running/healthy so the SPA
//                                    splash can poll until the backend is ready.
//   3. EventBridge {action:"reap"}          → scale to 0 if the DynamoDB
//                                              heartbeat is older than IDLE.
//      EventBridge {action:"scheduled-stop"} → nightly hard backstop to 0.
//
// AWS SDK v3 clients are bundled in the Node 20 Lambda runtime, so this file has
// no node_modules / package.json.

import { ECSClient, DescribeServicesCommand, UpdateServiceCommand } from '@aws-sdk/client-ecs';
import { ElasticLoadBalancingV2Client, DescribeTargetHealthCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const REGION = process.env.AWS_REGION;
const CLUSTER = process.env.CLUSTER;
const SERVICE = process.env.SERVICE;
const TG_ARN = process.env.TARGET_GROUP_ARN;
const TABLE = process.env.TABLE;
const IDLE_MS = parseInt(process.env.IDLE_MINUTES || '15', 10) * 60 * 1000;

const ecs = new ECSClient({ region: REGION });
const elb = new ElasticLoadBalancingV2Client({ region: REGION });
const ddb = new DynamoDBClient({ region: REGION });

const HB_KEY = { pk: { S: 'SYSTEM' }, sk: { S: 'HEARTBEAT' } };

async function getService() {
  const r = await ecs.send(new DescribeServicesCommand({ cluster: CLUSTER, services: [SERVICE] }));
  const s = (r.services || [])[0] || {};
  return { desiredCount: s.desiredCount ?? 0, runningCount: s.runningCount ?? 0 };
}

async function healthyTargets() {
  try {
    const r = await elb.send(new DescribeTargetHealthCommand({ TargetGroupArn: TG_ARN }));
    return (r.TargetHealthDescriptions || [])
      .filter((t) => t.TargetHealth && t.TargetHealth.State === 'healthy').length;
  } catch {
    return 0;
  }
}

async function setDesired(count) {
  await ecs.send(new UpdateServiceCommand({ cluster: CLUSTER, service: SERVICE, desiredCount: count }));
}

async function getHeartbeat() {
  const r = await ddb.send(new GetItemCommand({ TableName: TABLE, Key: HB_KEY }));
  const n = r.Item && r.Item.lastActivity && r.Item.lastActivity.N;
  return n ? Number(n) : 0;
}

async function touchHeartbeat(now) {
  const ttl = Math.floor(now / 1000) + 24 * 3600;
  await ddb.send(new UpdateItemCommand({
    TableName: TABLE,
    Key: HB_KEY,
    UpdateExpression: 'SET lastActivity = :t, expiresAt = :e',
    ExpressionAttributeValues: { ':t': { N: String(now) }, ':e': { N: String(ttl) } },
  }));
}

const REASONS = { 200: 'OK', 202: 'Accepted', 404: 'Not Found', 500: 'Internal Server Error' };

function albResponse(statusCode, body) {
  return {
    statusCode,
    statusDescription: `${statusCode} ${REASONS[statusCode] || 'OK'}`,
    isBase64Encoded: false,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body),
  };
}

export const handler = async (event = {}) => {
  const now = Date.now();

  // --- EventBridge (reaper / scheduled backstop) ---
  if (event.action) {
    const { desiredCount } = await getService();
    if (event.action === 'scheduled-stop') {
      if (desiredCount > 0) await setDesired(0);
      return { action: 'scheduled-stop', scaledDown: desiredCount > 0 };
    }
    if (event.action === 'reap') {
      if (desiredCount === 0) return { action: 'reap', scaledDown: false, alreadyZero: true };
      const last = await getHeartbeat();
      const idleMs = now - last;
      if (idleMs > IDLE_MS) {
        await setDesired(0);
        return { action: 'reap', scaledDown: true, idleMs };
      }
      return { action: 'reap', scaledDown: false, idleMs };
    }
    return { ignored: event.action };
  }

  // --- ALB (browser control plane) ---
  const path = event.path || '';
  const method = (event.httpMethod || 'GET').toUpperCase();
  console.log(`[alb] ${method} ${path}`);

  try {
    if (path.endsWith('/_control/wake') && method === 'POST') {
      const svc = await getService();
      if (svc.desiredCount === 0) await setDesired(1);
      await touchHeartbeat(now); // grace window: reaper won't kill the booting task
      const healthy = await healthyTargets();
      return albResponse(202, { waking: true, ready: healthy > 0 && svc.runningCount > 0, healthyTargets: healthy, ...svc });
    }

    if (path.endsWith('/_control/status')) {
      const svc = await getService();
      const healthy = await healthyTargets();
      return albResponse(200, { ready: healthy > 0 && svc.runningCount > 0, healthyTargets: healthy, ...svc });
    }

    return albResponse(404, { error: 'not found' });
  } catch (err) {
    console.error('[alb] handler error:', err && err.stack ? err.stack : err);
    return albResponse(500, { error: String(err && err.message ? err.message : err) });
  }
};
