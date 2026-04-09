#!/usr/bin/env node

import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PROXY_PORT || 8082;

// Configuration for all backend services
const SERVICES = {
  main: { port: 8080, buildPath: "dist" },
  "ffx-skill-map": { port: 3001, buildPath: "prototypes/ffx-skill-map/dist" },
  "home-lending-learning": { port: 3002, buildPath: "prototypes/home-lending-learning/dist" },
  "documentation-explorer": { port: 3005, buildPath: "prototypes/documentation-explorer/dist" },
  "learning-path": { port: 3006, buildPath: "prototypes/learning-path/dist" },
  "inference-insights": { port: 3009, buildPath: "prototypes/inference-insights/dist" },
  api: { port: 3004 },
  "ai-evals": { port: process.env.AI_EVALS_PORT || 5000 },
  "ai-builders": { port: 3008, buildPath: "apps/ai-builders-portal/dist" },
};

console.log("Starting Multi-SPA Development Proxy Server...");

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Helper: create a prototype proxy with SPA fallback
function createPrototypeProxy(name) {
  const svc = SERVICES[name];
  return createProxyMiddleware({
    target: `http://localhost:${svc.port}`,
    changeOrigin: true,
    pathRewrite: (p, req) => req.originalUrl,
    onError: (err, req, res) => {
      console.log(`[${name}] Dev server not running (${err.code}), trying fallback...`);
      serveFallbackSPA(req, res, name);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`[${name}] ${proxyRes.statusCode} ${req.url}`);
    },
  });
}

// Prototype routes
for (const name of ["ffx-skill-map", "home-lending-learning", "documentation-explorer", "learning-path", "inference-insights", "ai-builders"]) {
  const svc = SERVICES[name];
  console.log(`  /prototypes/${name}  ->  localhost:${svc.port}`);
  app.use(`/prototypes/${name}`, createPrototypeProxy(name));
}

// API proxy — strip nothing, forward as-is
console.log(`  /api/*               ->  localhost:${SERVICES.api.port}`);
app.use(
  "/api",
  createProxyMiddleware({
    target: `http://localhost:${SERVICES.api.port}`,
    changeOrigin: true,
    onError: (err, req, res) => {
      console.log(`[api] Server not running (${err.code})`);
      res.status(503).json({ error: "API server not running. Start it with: cd shared/api && npm run dev" });
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`[api] ${proxyRes.statusCode} ${req.url}`);
    },
  }),
);

// AI Evals proxy — rewrite /prototypes/ai-evals to / for the Flask app
console.log(`  /prototypes/ai-evals/*  ->  localhost:${SERVICES["ai-evals"].port}`);
app.use(
  "/prototypes/ai-evals",
  createProxyMiddleware({
    target: `http://localhost:${SERVICES["ai-evals"].port}`,
    changeOrigin: true,
    pathRewrite: { "^/prototypes/ai-evals": "" },
    onError: (err, req, res) => {
      console.log(`[ai-evals] Server not running (${err.code})`);
      res.status(503).send(`
        <html>
          <head><title>AI Evals Not Running</title></head>
          <body style="font-family: system-ui; padding: 2rem; background: #f5f5f5;">
            <h1>AI Evals App Not Running</h1>
            <p>Start it with:</p>
            <pre>cd apps/ai-evals-in-context/ai-testing-resource
python3 run.py                    # direct, port 5000
# or
docker compose up -d --build      # Docker, port 5001</pre>
            <p>If using Docker (port 5001), set <code>AI_EVALS_PORT=5001</code> before starting the proxy.</p>
          </body>
        </html>
      `);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`[ai-evals] ${proxyRes.statusCode} ${req.url}`);
    },
  }),
);

// Main portfolio (catch-all, must be last)
console.log(`  /*                   ->  localhost:${SERVICES.main.port}`);
app.use(
  "/",
  createProxyMiddleware({
    target: `http://localhost:${SERVICES.main.port}`,
    changeOrigin: true,
    onError: (err, req, res) => {
      console.log(`[main] Dev server not running (${err.code}), trying fallback...`);
      serveFallbackSPA(req, res, "main");
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`[main] ${proxyRes.statusCode} ${req.url}`);
    },
  }),
);

// Fallback: serve built files when dev servers are not running
function serveFallbackSPA(req, res, spaType) {
  const svc = SERVICES[spaType];
  if (!svc.buildPath) {
    res.status(503).send("Service not running.");
    return;
  }

  const fullPath = path.join(process.cwd(), svc.buildPath);
  const indexPath = path.join(fullPath, "index.html");

  if (fs.existsSync(indexPath)) {
    console.log(`[${spaType}] Serving fallback from ${svc.buildPath}`);
    res.sendFile(path.resolve(indexPath));
  } else {
    res.status(503).send(`
      <html>
        <head><title>Dev Server Required</title></head>
        <body style="font-family: system-ui; padding: 2rem; background: #f5f5f5;">
          <h1>Dev Server Not Running: ${spaType}</h1>
          <p>No built files found at <code>${svc.buildPath}</code> either.</p>
          <p>Start all services: <code>yarn dev:all</code></p>
        </body>
      </html>
    `);
  }
}

// Start
app.listen(PORT, () => {
  console.log(`
Dev Proxy running on http://localhost:${PORT}

Routes:
  http://localhost:${PORT}/                                      -> Portfolio (${SERVICES.main.port})
  http://localhost:${PORT}/prototypes/ffx-skill-map/             -> FFX Skill Map (${SERVICES["ffx-skill-map"].port})
  http://localhost:${PORT}/prototypes/home-lending-learning/      -> Home Lending (${SERVICES["home-lending-learning"].port})
  http://localhost:${PORT}/prototypes/documentation-explorer/     -> Docs Explorer (${SERVICES["documentation-explorer"].port})
  http://localhost:${PORT}/prototypes/learning-path/              -> Learning Path (${SERVICES["learning-path"].port})
  http://localhost:${PORT}/prototypes/inference-insights/         -> Inference Insights (${SERVICES["inference-insights"].port})
  http://localhost:${PORT}/api/*                                  -> API Server (${SERVICES.api.port})
  http://localhost:${PORT}/prototypes/ai-evals/                    -> AI Evals Flask (${SERVICES["ai-evals"].port})
  http://localhost:${PORT}/prototypes/ai-builders/                  -> AI Builders (${SERVICES["ai-builders"].port})

Start all services: yarn dev:all
  `);
});

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
