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

// Configuration for SPA servers
const SPA_SERVERS = {
  main: {
    port: 8080,
    buildPath: "dist",
  },
  "ffx-skill-map": {
    port: 3001,
    buildPath: "prototypes/ffx-skill-map/dist",
  },
};

console.log("🚀 Starting Multi-SPA Development Proxy Server...");

// Add verbose request logging middleware
app.use((req, res, next) => {
  console.log(`\n🔍 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log(`   Headers: ${JSON.stringify(req.headers.host)}`);
  console.log(`   User-Agent: ${req.headers['user-agent']?.substring(0, 50)}...`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Proxy for FFX Skill Map prototype
console.log(`🔧 Setting up FFX proxy route: /prototypes/ffx-skill-map -> localhost:${SPA_SERVERS["ffx-skill-map"].port}`);
app.use(
  "/prototypes/ffx-skill-map",
  (req, res, next) => {
    console.log(`🎯 FFX ROUTE MATCHED: ${req.method} ${req.originalUrl}`);
    console.log(`🔄 req.url: ${req.url}`);
    console.log(`🔄 req.originalUrl: ${req.originalUrl}`);
    console.log(`🔄 About to proxy to: http://localhost:${SPA_SERVERS["ffx-skill-map"].port}${req.originalUrl}`);
    next();
  },
  createProxyMiddleware({
    target: `http://localhost:${SPA_SERVERS["ffx-skill-map"].port}`,
    changeOrigin: true,
    logLevel: 'debug',
    router: (req) => {
      console.log(`🔧 Router called with: ${req.originalUrl}`);
      return `http://localhost:${SPA_SERVERS["ffx-skill-map"].port}`;
    },
    pathRewrite: (path, req) => {
      console.log(`🔧 PathRewrite: ${path} -> ${req.originalUrl}`);
      return req.originalUrl;
    },
    onError: (err, req, res) => {
      console.log(`❌ FFX Skill Map server error: ${err.message}`);
      console.log(`❌ Error code: ${err.code}`);
      console.log("🔄 Starting fallback...");
      // Fallback to built files if dev server is not running
      serveFallbackSPA(req, res, "ffx-skill-map");
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`📡 Proxying FFX request: ${req.method} ${req.url} -> http://localhost:${SPA_SERVERS["ffx-skill-map"].port}${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`✅ FFX response: ${proxyRes.statusCode} for ${req.url}`);
      console.log(`✅ Response headers: ${JSON.stringify(proxyRes.headers)}`);
    },
  }),
);

// Proxy for main application (all other routes)
console.log(`🔧 Setting up Main proxy route: / -> localhost:${SPA_SERVERS.main.port}`);
app.use(
  "/",
  (req, res, next) => {
    console.log(`🏠 MAIN ROUTE MATCHED: ${req.method} ${req.url}`);
    next();
  },
  createProxyMiddleware({
    target: `http://localhost:${SPA_SERVERS.main.port}`,
    changeOrigin: true,
    timeout: 5000,
    proxyTimeout: 5000,
    onError: (err, req, res) => {
      console.log(
        `❌ Main app server error: ${err.message} (${err.code}). Serving fallback...`,
      );
      // Fallback to built files if dev server is not running
      serveFallbackSPA(req, res, "main");
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`📡 Proxying main app request: ${req.method} ${req.url} -> ${proxyReq.getHeader('host')}${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(
        `✅ Main app response: ${proxyRes.statusCode} for ${req.url}`,
      );
    },
  }),
);

// Fallback function to serve built files when dev servers are not running
function serveFallbackSPA(req, res, spaType) {
  const buildPath = SPA_SERVERS[spaType].buildPath;
  const fullPath = path.join(process.cwd(), buildPath);

  console.log(`🔄 Fallback requested for ${spaType}, checking: ${fullPath}`);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Build path not found: ${fullPath}`);
    res.status(503).send(`
      <html>
        <head><title>Dev Server Required</title></head>
        <body style="font-family: Arial; padding: 2rem; background: #f5f5f5;">
          <h1>🚧 Development Server Not Running</h1>
          <p><strong>SPA:</strong> ${spaType}</p>
          <p><strong>Build Path:</strong> ${buildPath}</p>
          <p><strong>Required Action:</strong></p>
          <ul>
            <li>For main app: <code>npm run dev</code></li>
            <li>For FFX prototype: <code>npm run dev:ffx</code></li>
            <li>Or run both: <code>npm run dev:all</code></li>
          </ul>
          <p><a href="javascript:location.reload()">🔄 Refresh to try again</a></p>
        </body>
      </html>
    `);
    return;
  }

  // Serve the appropriate index.html for SPA routing
  const indexPath = path.join(fullPath, "index.html");
  if (fs.existsSync(indexPath)) {
    console.log(`✅ Serving fallback index.html for ${spaType}`);
    res.sendFile(path.resolve(indexPath));
  } else {
    console.log(`❌ Index.html not found at: ${indexPath}`);
    res.status(404).send(`
      <html>
        <head><title>Build Required</title></head>
        <body style="font-family: Arial; padding: 2rem; background: #f5f5f5;">
          <h1>📦 Build Required</h1>
          <p>No built files found for <strong>${spaType}</strong></p>
          <p>Run: <code>npm run build${spaType === "ffx-skill-map" ? ":ffx" : ""}</code></p>
        </body>
      </html>
    `);
  }
}

// Start the proxy server
app.listen(PORT, () => {
  console.log(`
🌟 Multi-SPA Development Proxy Server running on http://localhost:${PORT}

📋 Configuration:
- Main app: proxies to http://localhost:${SPA_SERVERS.main.port}
- FFX Skill Map: proxies to http://localhost:${SPA_SERVERS["ffx-skill-map"].port}

🔗 Routes (in order of matching):
1. http://localhost:${PORT}/prototypes/ffx-skill-map/* → FFX Skill Map SPA (port ${SPA_SERVERS["ffx-skill-map"].port})
2. http://localhost:${PORT}/* → Main Portfolio SPA (port ${SPA_SERVERS.main.port})

🛠️  Development workflow:
1. Start main app: npm run dev
2. Start FFX prototype: npm run dev:ffx  
3. Start this proxy: npm run dev:proxy
4. Access unified app at http://localhost:${PORT}

🐛 Debug: All requests will be logged with 🔍 prefix
💡 For Builder.io integration, use http://localhost:${PORT} as your preview URL
  `);
  
  console.log("✅ Proxy server ready - make a request to see verbose logging!");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Proxy server shutting down...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Proxy server shutting down...");
  process.exit(0);
});
