# Development Guide

## Multi-SPA Development Setup

This project contains multiple Single Page Applications (SPAs) that work together as a unified portfolio showcase. The setup includes:

- **Main Portfolio SPA** (`/`) - The main landing page and portfolio
- **FFX Skill Map SPA** (`/prototypes/ffx-skill-map/`) - Interactive skill mapping prototype

## Development Workflow

### Option 1: Individual Development (Default)
Run each SPA independently for focused development:

```bash
# Main portfolio app (runs on port 8081)
npm run dev

# FFX prototype (runs on port 3001)
npm run dev:ffx
```

### Option 2: Unified Development with Proxy (Recommended for Builder.io)
Use the development proxy server to replicate production routing:

```bash
# Method A: Run all services at once
npm run dev:all

# Method B: Run services individually
npm run dev          # Terminal 1: Main app
npm run dev:ffx      # Terminal 2: FFX prototype  
npm run dev:proxy    # Terminal 3: Proxy server
```

## Development Proxy Server Architecture

The proxy server (`scripts/dev-proxy.js`) solves the challenge of **inter-SPA navigation** in a multi-application development environment. This enables seamless navigation between different Single Page Applications running on separate ports.

### The Multi-SPA Challenge

In a typical development setup:
- **Main Portfolio SPA** runs on `localhost:8080` (Vite dev server)
- **FFX Skill Map SPA** runs on `localhost:3001` (separate Vite dev server)
- **Navigation problem**: How do you click a link in the main app that loads a different SPA on a different port?

### Proxy Solution

The development proxy (`localhost:8082`) acts as a **unified entry point** that routes requests to the appropriate development servers:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Browser       │    │  Proxy Server    │    │  Dev Servers    │
│   localhost:8082│────│  localhost:8082  │────│  localhost:8080 │ Main SPA
│                 │    │                  │    │  localhost:3001 │ FFX SPA
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Path Forwarding Rules

The proxy uses **Express middleware** with `http-proxy-middleware` to route requests:

#### 1. FFX Skill Map Routing
```javascript
app.use("/prototypes/ffx-skill-map", createProxyMiddleware({
  target: "http://localhost:3001",
  changeOrigin: true,
  router: (req) => `http://localhost:3001`, // Explicit target
  pathRewrite: (path, req) => req.originalUrl, // Restore full path
}));
```

**Flow**: 
- Browser: `GET /prototypes/ffx-skill-map/`
- Express: Strips path, `req.url = "/"`, but `req.originalUrl = "/prototypes/ffx-skill-map/"`
- Proxy: `pathRewrite` restores full path, forwards to `http://localhost:3001/prototypes/ffx-skill-map/`
- FFX SPA: Handles routing with `basename="/prototypes/ffx-skill-map"`

⚠️ **Critical**: Without `pathRewrite`, Express strips the route path causing redirect loops!

#### 2. Main Portfolio Routing (Catch-all)
```javascript
app.use("/", createProxyMiddleware({
  target: "http://localhost:8080",
  changeOrigin: true,
}));
```

**Flow**:
- Browser: `GET /` or any other path
- Proxy: Forwards to `http://localhost:8080`
- Main SPA: Handles routing with standard React Router

### Vite Configuration Coordination

Each SPA must be configured to work with the proxy architecture:

#### Main Portfolio SPA (`package.json`)
```json
"dev": "vite --port 8080"
```
- Runs on port 8080
- Uses standard base path `/`
- React Router with default basename

#### FFX Skill Map SPA (`prototypes/ffx-skill-map/vite.config.ts`)
```typescript
export default defineConfig({
  base: '/prototypes/ffx-skill-map/',
  server: { port: 3001 }
});
```
- Runs on port 3001
- Configured for subpath deployment
- React Router with `basename="/prototypes/ffx-skill-map"`

### Inter-SPA Navigation Implementation

#### From Main Portfolio to FFX
In `src/components/Portfolio.tsx`:
```tsx
const prototypes = [
  {
    title: "FFX Skill Map",
    link: "/prototypes/ffx-skill-map/", // Proxy will route this
  }
];

// Link implementation
<a href={prototype.link}>View Prototype</a>
```

#### From FFX back to Portfolio
In FFX navigation components:
```tsx
<a href="/">← Back to Portfolio</a>
```

### Fallback Mechanism

When development servers aren't running, the proxy serves **built static files**:

```javascript
function serveFallbackSPA(req, res, spaType) {
  const buildPath = SPA_SERVERS[spaType].buildPath;
  // Serves from dist/ if available, or shows helpful error
}
```

This allows testing the **production build** through the same proxy interface.

### Benefits

1. **Seamless Development**: Developers can navigate between SPAs as if they were one application
2. **Production Parity**: Mimics the routing behavior of the deployed application
3. **Builder.io Compatibility**: Enables preview URLs that work across multiple SPAs
4. **Fallback Support**: Gracefully handles when dev servers aren't running
5. **Debugging**: Detailed logging shows exactly how requests are being routed

### Routes
- `http://localhost:8082/` → Main Portfolio SPA (port 8080)
- `http://localhost:8082/prototypes/ffx-skill-map/` → FFX Skill Map SPA (port 3001)
- `http://localhost:8082/health` → Proxy health check endpoint

## Builder.io Integration

To enable navigation between SPAs in Builder.io:

1. Start the development proxy: `npm run dev:proxy`
2. In Builder.io, set your preview URL to: `http://localhost:8082`
3. Both SPAs will be accessible and navigable within Builder.io

## Production Deployment

The production environment uses:
- **Cloudflare Pages** for hosting
- **Custom routing rules** in `public/_redirects`
- **CloudFront distribution** for global CDN (configured in `terraform/main.tf`)

## Project Structure

```
├── src/                    # Main portfolio SPA
├── prototypes/
│   └── ffx-skill-map/     # FFX prototype SPA
├── scripts/
│   └── dev-proxy.js       # Development proxy server
├── public/
│   └── _redirects         # Cloudflare routing rules
└── terraform/             # Infrastructure as code
```

## Environment Configuration

| Service | Port | Environment |
|---------|------|-------------|
| Main SPA | 8081 | Development |
| FFX SPA | 3001 | Development |
| Proxy Server | 8082 | Development |
| Production | 443/80 | Cloudflare Pages |

## Troubleshooting

### Port Conflicts
If you encounter port conflicts, you can customize ports:

```bash
# Custom proxy port
PROXY_PORT=9000 npm run dev:proxy

# Main app uses port 8080 by default (configured in package.json)
# FFX app uses port 3001 by default (configured in prototypes/ffx-skill-map/vite.config.ts)
```

### Proxy Redirect Loops (ERR_TOO_MANY_REDIRECTS)

**Symptoms**: Browser shows "localhost redirected you too many times"

**Common Causes**:
1. **Port Mismatch**: Proxy expects FFX on wrong port
2. **Path Rewrite Conflicts**: Incorrect `pathRewrite` configuration
3. **Base Path Misalignment**: Vite `base` doesn't match React Router `basename`

**Solutions**:
```bash
# 1. Verify ports match configuration
lsof -i :3001  # FFX should be running here
lsof -i :8080  # Main app should be running here

# 2. Check proxy configuration in scripts/dev-proxy.js
# Ensure: port: 3001 for FFX in SPA_SERVERS

# 3. Verify Vite config matches Router config:
# FFX vite.config.ts: base: '/prototypes/ffx-skill-map/'
# FFX main.tsx: basename="/prototypes/ffx-skill-map"
```

### Inter-SPA Navigation Issues

**Symptoms**: Links between SPAs show "Page not found" or don't work

**Common Causes**:
1. **Incorrect link paths** in Portfolio component
2. **React Router basename mismatch** with Vite base path
3. **Development servers not running** on expected ports

**Solutions**:
```bash
# 1. Verify all dev servers are running
npm run dev:all

# 2. Check link format in Portfolio.tsx:
# Should be: "/prototypes/ffx-skill-map/" (with trailing slash)

# 3. Test direct server access:
curl http://localhost:3001/prototypes/ffx-skill-map/
curl http://localhost:8080/

# 4. Check proxy routing:
curl -v http://localhost:8082/prototypes/ffx-skill-map/
```

### Builder.io Preview Issues
1. Ensure the proxy server is running on port 8082
2. Check that both dev servers are running
3. Verify Builder.io preview URL is set to `http://localhost:8082`
4. Clear Builder.io cache if navigation isn't working

### Development Server Not Starting
1. Check for port conflicts: `lsof -i :8082`
2. Install dependencies: `npm install`
3. Check Node.js version compatibility (requires Node.js 18+)

### Express Route Stripping Issue (Advanced Debugging)

**Problem**: Multi-SPA proxies can encounter redirect loops due to Express middleware path handling.

**Symptoms**:
- Browser shows "ERR_TOO_MANY_REDIRECTS"  
- Proxy logs show repeated requests to same URL
- Missing `📡 Proxying` and `✅ Response` logs in proxy output

**Root Cause**: 
When Express matches a route like `/prototypes/ffx-skill-map`, it **strips that path** from `req.url`, leaving only the remainder. This causes `http-proxy-middleware` to forward the wrong path.

```javascript
// Browser requests: /prototypes/ffx-skill-map/
// Express matches: /prototypes/ffx-skill-map
// Result: req.url = "/" (stripped!)
// Proxy forwards: http://localhost:3001/ (wrong!)
// Should forward: http://localhost:3001/prototypes/ffx-skill-map/ (correct!)
```

**CloudFront vs Local Development**:
- **CloudFront**: Handles routing at the CDN level, serves correct SPA files directly
- **Local Development**: Must manually recreate CloudFront's routing logic with Express
- **The Gap**: Express middleware path stripping doesn't match CloudFront behavior

**Technical Fix**:
Use `pathRewrite` and `router` functions to restore the original URL:

```javascript
app.use("/prototypes/ffx-skill-map", createProxyMiddleware({
  target: `http://localhost:3001`,
  changeOrigin: true,
  router: (req) => `http://localhost:3001`, // Explicit target
  pathRewrite: (path, req) => req.originalUrl, // Restore full path
}));
```

**Why This Works**:
- `req.url`: `/` (stripped by Express)
- `req.originalUrl`: `/prototypes/ffx-skill-map/` (preserved)
- `pathRewrite`: Replaces stripped path with original URL
- `router`: Ensures target is correctly resolved

**Prevention**: Always use `req.originalUrl` when debugging multi-SPA proxy issues.

**Quick Fix Template**:
When adding new SPA routes to the proxy, always use this pattern:

```javascript
app.use("/path/to/spa", createProxyMiddleware({
  target: "http://localhost:PORT",
  changeOrigin: true,
  router: (req) => `http://localhost:PORT`,
  pathRewrite: (path, req) => req.originalUrl,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`📡 Proxying: ${req.method} ${req.originalUrl}`);
  },
}));
```

This prevents the Express path stripping issue that causes redirect loops in multi-SPA setups.

### Configuration Validation

To verify your proxy setup is correct:

```bash
# 1. Check all services are running
lsof -i :8080  # Main SPA
lsof -i :3001  # FFX SPA  
lsof -i :8082  # Proxy

# 2. Test proxy routing
curl -I http://localhost:8082/
curl -I http://localhost:8082/prototypes/ffx-skill-map/

# 3. Check configuration alignment
# scripts/dev-proxy.js SPA_SERVERS ports
# prototypes/ffx-skill-map/vite.config.ts server.port
# prototypes/ffx-skill-map/vite.config.ts base path
# prototypes/ffx-skill-map/src/main.tsx basename

# 4. Debug proxy route stripping (if issues persist)
# Look for these patterns in proxy logs:
# ✅ 🎯 FFX ROUTE MATCHED: GET /prototypes/ffx-skill-map/
# ✅ 🔧 PathRewrite: / -> /prototypes/ffx-skill-map/
# ✅ 📡 Proxying FFX request: GET /prototypes/ffx-skill-map/
# ❌ Repeated requests without proxy execution = path stripping issue
```