# Secure AI Analysis Implementation

## Overview

This implementation provides a secure, server-side proxy for AI-powered skill analysis using Claude AI. Instead of exposing API keys in the client, all AI processing happens through a secure backend service.

## Architecture

```
Frontend (SecureAIAnalysisWidget)
    ↓ HTTP/HTTPS
Backend API (Express.js/Lambda)
    ↓ HTTPS + API Key
Claude AI Service (Anthropic)
```

### Security Benefits

1. **No Client-Side Secrets**: API keys never leave the server
2. **Rate Limiting**: Built-in protection against abuse
3. **Input Validation**: Sanitized and validated requests
4. **Authentication**: API key protection for the service
5. **Monitoring**: Comprehensive request logging
6. **CORS Protection**: Configurable allowed origins

## Local Development Setup

### Prerequisites

- Node.js 18+
- Claude API key (optional for development - uses mock mode)

### Quick Start

1. **Start the API Server**
   ```bash
   cd api
   npm install
   npm run dev
   ```
   Server runs on `http://localhost:3003`

2. **Start the Frontend (in another terminal)**
   ```bash
   cd prototypes/ffx-skill-map
   npm run dev
   ```
   Frontend runs on `http://localhost:3001`

3. **Test the Integration**
   - Open the skill map at `http://localhost:3001`
   - Select a character
   - Click "Get AI Analysis of Next Steps"
   - The widget will use mock data in development mode

### Development Mode Features

- **Mock AI Responses**: Works without real Claude API key
- **Auth Bypass**: No API keys required for local testing
- **Detailed Logging**: Debug-level logging for troubleshooting
- **Hot Reload**: API server restarts on file changes with `npm run dev`

## Production Deployment

### AWS Infrastructure

The solution deploys as:
- **Lambda Function**: Serverless API handler
- **API Gateway**: HTTPS endpoints with rate limiting
- **Parameter Store**: Secure credential storage
- **CloudWatch**: Logging and monitoring

### Required Environment Variables

**GitHub Secrets** (set in repository settings):
```bash
CLAUDE_API_KEY=sk-ant-api03-your-actual-api-key-here
JWT_SECRET=$(openssl rand -hex 32)
API_KEY_SALT=$(openssl rand -hex 16)
```

### Deployment Process

1. **Configure Secrets**
   ```bash
   # In GitHub repository settings > Secrets and variables > Actions
   CLAUDE_API_KEY=your-claude-api-key
   JWT_SECRET=your-jwt-secret
   API_KEY_SALT=your-api-key-salt
   ```

2. **Deploy Infrastructure**
   ```bash
   git push origin main
   # GitHub Actions will automatically deploy
   ```

3. **Update Frontend Config**
   After deployment, update the frontend environment:
   ```bash
   # Set in your deployment environment
   REACT_APP_AI_API_URL=https://your-api-gateway-url.amazonaws.com/production
   REACT_APP_AI_API_KEY=your-generated-client-key
   ```

## API Reference

### Base URL
- **Development**: `http://localhost:3003`
- **Production**: `https://your-api-gateway-id.execute-api.region.amazonaws.com/production`

### Authentication

**Development**: No authentication required
**Production**: Include API key in headers:
```javascript
headers: {
  'X-API-Key': 'your-api-key-here'
}
```

### Endpoints

#### `POST /api/v1/ai-analysis/skill-recommendations`

Analyze character skills and get AI recommendations.

**Request Body:**
```json
{
  "character": {
    "name": "Character Name",
    "role": "Character Role",
    "currentXP": 1500,
    "level": 10,
    "masteredSkills": ["skill-1", "skill-2"]
  },
  "availableSkills": [
    {
      "id": "skill-id",
      "name": "Skill Name", 
      "description": "Skill description",
      "category": "magic|combat|support|special|advanced",
      "level": 1,
      "xp_required": 200
    }
  ],
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
    "currentStrengths": ["strength1", "strength2"],
    "skillGaps": ["gap1", "gap2"],
    "shortTermGoals": [
      {
        "skill": { /* skill object */ },
        "reasoning": "Why this skill next",
        "timeframe": "short",
        "priority": "high",
        "pathLength": 2
      }
    ],
    "longTermGoals": [...],
    "overallAssessment": "Strategic analysis text"
  },
  "metadata": {
    "analysisId": "uuid",
    "timestamp": "2024-01-01T12:00:00Z", 
    "model": "claude-3-sonnet-20240229",
    "processingTimeMs": 1250
  }
}
```

#### `GET /api/v1/ai-analysis/health`

Check AI service health.

**Response:**
```json
{
  "status": "healthy",
  "aiService": {
    "status": "healthy",
    "model": "claude-3-sonnet-20240229"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### `GET /health`

General API health check.

## Security Model

### Client-Side Security
- **No API Keys**: Never stored in browser or frontend code
- **HTTPS Only**: All API communications encrypted
- **Input Validation**: Client validates data before sending
- **Error Handling**: No sensitive information in error messages

### Server-Side Security
- **API Key Protection**: Claude API key stored in AWS Parameter Store
- **Rate Limiting**: 100 requests per 15 minutes (configurable)
- **Input Sanitization**: All payloads validated and sanitized
- **Request Logging**: Comprehensive audit trail
- **CORS Protection**: Configurable allowed origins

### Network Security
- **TLS Encryption**: All communications use HTTPS/TLS
- **VPC Isolation**: Lambda functions can run in private subnets
- **API Gateway**: AWS-managed security and DDoS protection

## Cost Management

### Claude API Usage
- **Typical Cost**: ~$0.01-0.05 per analysis request
- **Rate Limiting**: Prevents runaway costs
- **Mock Mode**: Development uses no API credits
- **Caching**: Client-side caching reduces repeat requests

### AWS Infrastructure Costs
- **Lambda**: Pay-per-request (~$0.0000002 per request)
- **API Gateway**: ~$0.0000035 per request
- **Parameter Store**: ~$0.05 per parameter per month
- **CloudWatch**: Standard logging rates

**Estimated Monthly Cost**: $5-20 for moderate usage (1000 analyses/month)

## Monitoring

### Logging
```bash
# View Lambda logs
aws logs tail /aws/lambda/your-function-name --follow

# Filter for errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/your-function-name \
  --filter-pattern "ERROR"
```

### Metrics
- **API Gateway**: Request count, latency, errors
- **Lambda**: Duration, memory usage, errors
- **Claude API**: Usage tracking in Anthropic Console

### Alerts
Set up CloudWatch alarms for:
- High error rates (>5%)
- Long response times (>10s)
- High costs (>$50/day)

## Troubleshooting

### Common Issues

**"Invalid API key" in production**
- Check AWS Parameter Store has the correct Claude API key
- Verify Lambda has IAM permissions to read parameters

**CORS errors in browser**
- Ensure frontend domain is in CORS_ORIGIN list
- Check API Gateway CORS configuration

**High latency**
- Consider increasing Lambda memory allocation
- Implement response caching
- Use Lambda provisioned concurrency

**Development mock not working**
- Ensure NODE_ENV=development is set
- Check that JWT_SECRET and API_KEY_SALT are empty in .env

### Debugging

**Enable debug logging:**
```bash
# In API .env file
LOG_LEVEL=debug

# In Lambda environment
LOG_LEVEL=debug
```

**Test API locally:**
```bash
# Health check
curl http://localhost:3003/health

# AI analysis
curl -X POST http://localhost:3003/api/v1/ai-analysis/skill-recommendations \
  -H "Content-Type: application/json" \
  -d @test-payload.json
```

## Migration from Client-Side Implementation

### Frontend Changes
1. Replace `AIAnalysisWidget` with `SecureAIAnalysisWidget`
2. Remove direct Claude API calls
3. Update error handling for server responses
4. Configure API base URLs for environments

### Removed Components
- Client-side API key storage
- Direct Anthropic API calls
- Browser-based credential management

### Added Components
- Backend API service
- Server-side authentication
- AWS infrastructure components

## Future Enhancements

### Planned Features
- **User Authentication**: Per-user rate limits and usage tracking
- **Response Caching**: Redis-based caching for repeated queries
- **Multiple AI Providers**: Support for OpenAI, Google AI
- **Analytics Dashboard**: Usage metrics and cost tracking
- **Webhook Support**: Real-time analysis notifications

### Security Improvements
- **mTLS**: Mutual TLS authentication
- **JWT Tokens**: Session-based authentication
- **IP Allowlisting**: Restrict access by IP ranges
- **Request Signing**: HMAC request signatures

## Support

### Development Issues
- Check API server logs for detailed error information
- Use mock mode for API-independent testing
- Verify CORS configuration for browser issues

### Production Issues
- Monitor CloudWatch logs and metrics
- Check AWS Parameter Store for configuration
- Use API Gateway request tracing for debugging

### Performance Optimization
- Increase Lambda memory for faster processing
- Implement CloudFront caching for static responses
- Use API Gateway caching for repeated requests

---

**Security Note**: This implementation follows security best practices for API key management and provides a production-ready foundation for AI-powered features in web applications.