import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const OIDC_PRIVATE_KEY = process.env.OIDC_PRIVATE_KEY;
const OIDC_PUBLIC_KEY = process.env.OIDC_PUBLIC_KEY;
let ISSUER_URL = (process.env.ISSUER_URL || "").replace(/\/+$/, ""); // strip trailing slash

/** Derive ISSUER_URL from the Lambda Function URL event if not set or placeholder. */
function resolveIssuerUrl(event) {
  if (ISSUER_URL && ISSUER_URL !== "placeholder") return ISSUER_URL;
  // Lambda Function URL events include the domain in requestContext
  const domain = event?.requestContext?.domainName;
  if (domain) {
    ISSUER_URL = `https://${domain}`;
    console.log("[init] Derived ISSUER_URL from event:", ISSUER_URL);
  }
  return ISSUER_URL;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Base64url-encode a Buffer or string. */
function b64url(input) {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64url");
}

/** Build a minimal CORS-enabled JSON response. */
function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

/** Build a 302 redirect response. */
function redirectResponse(location) {
  return {
    statusCode: 302,
    headers: {
      Location: location,
      "Access-Control-Allow-Origin": "*",
    },
    body: "",
  };
}

/** Parse application/x-www-form-urlencoded body (may be base64-encoded by Lambda). */
function parseFormBody(event) {
  let raw = event.body || "";
  if (event.isBase64Encoded) {
    raw = Buffer.from(raw, "base64").toString("utf-8");
  }
  return Object.fromEntries(new URLSearchParams(raw));
}

/** Sign a JWT with RS256 using the OIDC private key. */
function signJwt(payload) {
  const header = { alg: "RS256", typ: "JWT", kid: "github-oidc-proxy-key" };

  const encodedHeader = b64url(JSON.stringify(header));
  const encodedPayload = b64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  sign.end();
  const signature = sign.sign(OIDC_PRIVATE_KEY, "base64url");

  return `${signingInput}.${signature}`;
}

/** Convert the PEM-encoded RSA public key to a JWK. */
function publicKeyToJwk() {
  const keyObject = crypto.createPublicKey(OIDC_PUBLIC_KEY);
  const jwk = keyObject.export({ format: "jwk" });
  return {
    ...jwk,
    kid: "github-oidc-proxy-key",
    use: "sig",
    alg: "RS256",
  };
}

/**
 * Fetch JSON from a URL (wrapper with error context).
 * Accepts optional headers for Authorization, etc.
 */
async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${options.method || "GET"} ${url} returned ${res.status}: ${text}`);
  }
  return res.json();
}

/**
 * Fetch user profile and primary verified email from GitHub.
 * Returns { user, email }.
 */
async function fetchGitHubUser(accessToken) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    "User-Agent": "github-oidc-proxy",
  };

  const [user, emails] = await Promise.all([
    fetchJson("https://api.github.com/user", { headers }),
    fetchJson("https://api.github.com/user/emails", { headers }),
  ]);

  // Pick the primary verified email, or fall back to first verified, then first overall
  const primary =
    emails.find((e) => e.primary && e.verified) ||
    emails.find((e) => e.verified) ||
    emails[0];
  const email = primary ? primary.email : null;

  return { user, email };
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

function handleDiscovery() {
  console.log("[discovery] Serving OIDC discovery document");
  return jsonResponse(200, {
    issuer: ISSUER_URL,
    authorization_endpoint: `${ISSUER_URL}/authorize`,
    token_endpoint: `${ISSUER_URL}/token`,
    userinfo_endpoint: `${ISSUER_URL}/userinfo`,
    jwks_uri: `${ISSUER_URL}/.well-known/jwks.json`,
    response_types_supported: ["code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    scopes_supported: ["openid", "email", "profile"],
    claims_supported: ["sub", "email", "name", "preferred_username", "picture"],
  });
}

function handleJwks() {
  console.log("[jwks] Serving JWKS");
  const jwk = publicKeyToJwk();
  return jsonResponse(200, { keys: [jwk] });
}

function handleAuthorize(event) {
  const params = event.queryStringParameters || {};
  const { redirect_uri, scope, state, response_type } = params;

  console.log("[authorize] Redirecting to GitHub OAuth", {
    redirect_uri,
    state: state ? `${state.substring(0, 8)}...` : "(none)",
  });

  const ghParams = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: redirect_uri || "",
    scope: "user:email",
    state: state || "",
  });

  return redirectResponse(
    `https://github.com/login/oauth/authorize?${ghParams.toString()}`
  );
}

async function handleToken(event) {
  const form = parseFormBody(event);
  const { grant_type, code, redirect_uri, client_id } = form;

  console.log("[token] Exchange request", { grant_type, hasCode: !!code });

  if (!code) {
    return jsonResponse(400, { error: "invalid_request", error_description: "Missing authorization code" });
  }

  // 1. Exchange code for GitHub access token
  let ghTokenData;
  try {
    ghTokenData = await fetchJson("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirect_uri || undefined,
      }),
    });
  } catch (err) {
    console.error("[token] GitHub token exchange failed:", err.message);
    return jsonResponse(502, { error: "server_error", error_description: "GitHub token exchange failed" });
  }

  if (ghTokenData.error) {
    console.error("[token] GitHub returned error:", ghTokenData.error, ghTokenData.error_description);
    return jsonResponse(400, {
      error: ghTokenData.error,
      error_description: ghTokenData.error_description || "GitHub token exchange returned an error",
    });
  }

  const githubAccessToken = ghTokenData.access_token;
  if (!githubAccessToken) {
    console.error("[token] No access_token in GitHub response:", JSON.stringify(ghTokenData));
    return jsonResponse(502, { error: "server_error", error_description: "No access_token from GitHub" });
  }

  // 2. Fetch GitHub user profile + emails
  let user, email;
  try {
    ({ user, email } = await fetchGitHubUser(githubAccessToken));
  } catch (err) {
    console.error("[token] Failed to fetch GitHub user:", err.message);
    return jsonResponse(502, { error: "server_error", error_description: "Failed to fetch GitHub user profile" });
  }

  console.log("[token] Issuing id_token for GitHub user:", user.login, "(id:", user.id, ")");

  // 3. Build and sign the id_token JWT
  const now = Math.floor(Date.now() / 1000);
  const idToken = signJwt({
    iss: ISSUER_URL,
    sub: String(user.id),
    aud: client_id || GITHUB_CLIENT_ID,
    exp: now + 3600,
    iat: now,
    email: email,
    name: user.name || user.login,
    preferred_username: user.login,
    picture: user.avatar_url,
  });

  return jsonResponse(200, {
    access_token: githubAccessToken,
    token_type: "Bearer",
    expires_in: 3600,
    id_token: idToken,
  });
}

async function handleUserinfo(event) {
  const authHeader = (event.headers || {}).authorization || (event.headers || {}).Authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (!token) {
    console.error("[userinfo] Missing or empty Bearer token");
    return jsonResponse(401, { error: "invalid_token", error_description: "Missing Bearer token" });
  }

  console.log("[userinfo] Fetching GitHub user profile");

  let user, email;
  try {
    ({ user, email } = await fetchGitHubUser(token));
  } catch (err) {
    console.error("[userinfo] Failed to fetch GitHub user:", err.message);
    return jsonResponse(401, { error: "invalid_token", error_description: "GitHub API rejected the access token" });
  }

  return jsonResponse(200, {
    sub: String(user.id),
    email: email,
    email_verified: true,
    name: user.name || user.login,
    preferred_username: user.login,
    picture: user.avatar_url,
    profile: user.html_url,
  });
}

// ---------------------------------------------------------------------------
// Lambda entry point
// ---------------------------------------------------------------------------

export async function handler(event) {
  const method = event.requestContext?.http?.method || event.httpMethod || "GET";
  const path = event.rawPath || event.path || "/";

  resolveIssuerUrl(event);
  console.log(`[router] ${method} ${path}`);

  // Handle CORS preflight
  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: "",
    };
  }

  try {
    // Route matching
    if (path === "/.well-known/openid-configuration") {
      return handleDiscovery();
    }
    if (path === "/.well-known/jwks.json") {
      return handleJwks();
    }
    if (path === "/authorize") {
      return handleAuthorize(event);
    }
    if (path === "/token") {
      return await handleToken(event);
    }
    if (path === "/userinfo") {
      return await handleUserinfo(event);
    }

    return jsonResponse(404, { error: "not_found", error_description: `Unknown route: ${method} ${path}` });
  } catch (err) {
    console.error("[handler] Unhandled error:", err);
    return jsonResponse(500, { error: "server_error", error_description: "Internal server error" });
  }
}
