# AI Analysis API

Secure backend API for processing AI-powered skill analysis requests using Claude AI.

## Features

- **Secure credential management**: Claude API key stored server-side
- **Rate limiting**: Prevents abuse and manages costs
- **Input validation**: Sanitizes and validates all requests
- **Structured logging**: Comprehensive request/error logging
- **Health checks**: Monitor service status
- **CORS support**: Configurable for frontend integration

## Local Development Setup

### Prerequisites

- Node.js 18+ 
- Claude API key from Anthropic

### Setup

1. **Install dependencies**
   ```bash
   cd api
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set required environment variables**
   ```bash
   # Get your Claude API key from https://console.anthropic.com/settings/keys
   CLAUDE_API_KEY=sk-ant-api03-your-key-here
   
   # Generate random secrets for production
   JWT_SECRET=$(openssl rand -hex 32)
   API_KEY_SALT=$(openssl rand -hex 16)
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3003`

### Getting Your API Key

For the frontend to authenticate with this API, you'll need the generated API key:

```bash
node -e "
import('./src/middleware/auth.js').then(auth => {
  console.log('Frontend API Key:', auth.getCurrentApiKey());
});"
```

## API Endpoints

### POST `/api/v1/ai-analysis/skill-recommendations`

Analyzes character skills and provides AI recommendations.

**Headers:**
```
Content-Type: application/json
X-API-Key: your-api-key-here
```

**Request Body:**
```json
{
  "character": {
    "name": "Tidus",
    "role": "Guardian", 
    "currentXP": 1500,
    "level": 10,
    "masteredSkills": ["skill-1", "skill-2"]
  },
  "availableSkills": [...],
  "allSkills": [...],
  "context": {
    "goalSkill": "optional-goal-skill-id"
  }
}
```

**Response:**
```json
{
  "analysis": {
    "currentStrengths": ["Fast attacks", "Magic resistance"],
    "skillGaps": ["Defensive abilities", "Area attacks"],
    "shortTermGoals": [
      {
        "skill": { /* skill object */ },
        "reasoning": "Improves survivability",
        "timeframe": "short",
        "priority": "high",
        "pathLength": 2
      }
    ],
    "longTermGoals": [...],
    "overallAssessment": "Character build analysis..."
  },
  "metadata": {
    "analysisId": "uuid",
    "timestamp": "2024-01-01T12:00:00Z",
    "model": "claude-3-sonnet-20240229",
    "processingTimeMs": 1250
  }
}
```

### GET `/api/v1/ai-analysis/health`

Health check for the AI analysis service.

### GET `/health`

General API health check.

## Security Features

### Authentication
- API key-based authentication using HMAC-SHA256
- Configurable key generation based on environment secrets
- Development mode bypasses auth for easier testing

### Rate Limiting
- 100 requests per 15-minute window (configurable)
- Separate limits can be implemented per API key
- Successful requests don't count toward limit by default

### Input Validation
- Comprehensive request payload validation
- Size limits prevent DoS attacks (1MB max payload)
- Skill count limits (500 available, 1000 total max)
- Data sanitization prevents injection attacks

### Error Handling
- No sensitive information in error responses
- Structured error codes for client handling
- Comprehensive logging for debugging

## Environment Variables

### Required
- `CLAUDE_API_KEY`: Your Anthropic Claude API key
- `JWT_SECRET`: Secret for API key generation
- `API_KEY_SALT`: Salt for API key generation

### Optional
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 3001)
- `CORS_ORIGIN`: Comma-separated allowed origins
- `LOG_LEVEL`: Logging level (error/warn/info/debug)
- `RATE_LIMIT_WINDOW_MS`: Rate limit window
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window

## Deployment

### Docker Support

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 3001
USER node
CMD ["node", "src/server.js"]
```

### AWS Lambda

The API is designed to work with AWS Lambda using the `serverless-http` adapter.

### Health Monitoring

- GET `/health` for general API health
- GET `/api/v1/ai-analysis/health` for AI service health
- Structured JSON logs for monitoring integration

## Cost Management

### Claude API Usage
- Analysis requests cost ~$0.01-0.05 per request
- Implement usage tracking per API key for billing
- Consider caching analysis results to reduce costs
- Monitor via Claude Console usage dashboard

### Rate Limiting Strategy
- Prevents runaway costs from abuse
- Configurable per environment
- Can implement per-user limits based on API key

## Development Tools

### Testing
```bash
npm test
```

### API Key Generation
```bash
# Generate API key for frontend
npm run api-key

# Health check
curl http://localhost:3001/health
```

### Log Analysis
The API outputs structured JSON logs:
```bash
# Filter error logs
npm start 2>&1 | grep '"level":"error"' | jq .

# Monitor analysis requests  
npm start 2>&1 | grep 'AI analysis' | jq .
```