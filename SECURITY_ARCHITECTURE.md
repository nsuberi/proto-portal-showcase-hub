# Security Architecture: Secure AI Analysis API

This document explains the security architecture and design decisions for our AI-powered skill analysis system, which securely integrates with the Anthropic Claude API.

## Overview

Our secure server architecture implements multiple layers of defense to protect sensitive data and API keys when communicating with external AI services. We use AWS Lambda with API Gateway to create a robust, scalable, and secure proxy for Claude API interactions.

## Architecture Comparison: API Gateway + Lambda vs Lambda Function URLs

### Our Implementation: API Gateway + Lambda (Recommended)

```
Client → API Gateway → Lambda Function → Claude API
```

**Security Benefits:**

#### 1. **Request Validation & Sanitization**
- **Input Validation**: API Gateway validates request structure before reaching Lambda
- **Schema Enforcement**: Ensures requests conform to expected format
- **Size Limits**: Built-in request size limits prevent oversized payloads
- **Content Type Validation**: Only accepts expected content types

#### 2. **Authentication & Authorization**
- **API Key Management**: Centralized API key validation through API Gateway
- **Rate Limiting**: Built-in throttling at the gateway level
- **IP Filtering**: Can restrict access by IP ranges or geographic regions
- **CORS Control**: Fine-grained cross-origin request management

#### 3. **Traffic Management & DDoS Protection**
- **Request Throttling**: Automatic rate limiting and burst protection
- **CloudFront Integration**: Additional DDoS protection through AWS CloudFront
- **Circuit Breaker**: Prevents cascade failures during high load
- **Request Caching**: Reduces load on backend Lambda functions

#### 4. **Monitoring & Observability**
- **Detailed Logging**: Comprehensive request/response logging
- **Metrics & Alarms**: Real-time monitoring of API usage patterns
- **X-Ray Tracing**: End-to-end request tracing for debugging
- **Custom Headers**: Request tracking and correlation IDs

#### 5. **SSL/TLS Termination**
- **Certificate Management**: Automatic SSL certificate handling
- **TLS 1.2+ Enforcement**: Modern encryption standards
- **Perfect Forward Secrecy**: Enhanced connection security

### Alternative: Lambda Function URLs Only

```
Client → Lambda Function URL → Claude API
```

**Limitations:**

#### 1. **Reduced Security Controls**
- ❌ No built-in request validation
- ❌ Limited rate limiting options
- ❌ Basic CORS support only
- ❌ No API key management at gateway level

#### 2. **Monitoring Gaps**
- ❌ Limited request logging
- ❌ No centralized traffic analytics
- ❌ Harder to implement custom metrics

#### 3. **Scalability Concerns**
- ❌ No built-in caching layer
- ❌ Direct Lambda exposure to internet traffic
- ❌ Limited DDoS protection

## Our Secure Server Approach

### 1. **Defense in Depth Strategy**

Our architecture implements multiple security layers:

```
Internet → CloudFront → API Gateway → Lambda → Claude API
    ↓         ↓           ↓           ↓         ↓
   DDoS      WAF      Validation   Business   External
Protection  Rules    & Rate       Logic &    API
           & SSL     Limiting     Secrets    Security
```

### 2. **API Key Security**

#### **Client-Side Security**
```typescript
// Client provides their own API key (not stored server-side)
const response = await fetch(API_ENDPOINT, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': userApiKey  // User-provided Claude API key
  },
  body: JSON.stringify(requestPayload)
});
```

#### **Server-Side Protection**
```javascript
// Lambda validates and forwards API key securely
const validateApiKey = (apiKey) => {
  if (!apiKey || apiKey.length < 10) {
    throw new Error('Invalid API key format');
  }
  // Additional validation without logging the key
  return true;
};

// Forward to Claude API with proper error handling
const response = await fetch('https://api.anthropic.com/v1/messages', {
  headers: {
    'x-api-key': validatedApiKey,
    'anthropic-version': '2023-06-01'
  }
});
```

### 3. **Request Sanitization & Validation**

#### **Input Validation Middleware**
```javascript
const validateSkillRequest = (req, res, next) => {
  const { characterData, availableSkills, allSkills } = req.body;
  
  // Size limits
  if (JSON.stringify(req.body).length > 1048576) { // 1MB limit
    return res.status(413).json({ error: 'Request too large' });
  }
  
  // Data sanitization
  const sanitizedData = {
    characterData: sanitizeObject(characterData),
    availableSkills: availableSkills?.slice(0, 500) || [], // Limit array size
    allSkills: allSkills?.slice(0, 1000) || []
  };
  
  req.sanitizedBody = sanitizedData;
  next();
};
```

#### **XSS Prevention**
```javascript
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .substring(0, 1000); // Limit string length
};
```

### 4. **Claude API Security Considerations**

#### **Secure Communication**
- **HTTPS Only**: All communication encrypted in transit
- **API Key Rotation**: Support for regular API key rotation
- **Request Logging**: Detailed audit trails (without sensitive data)
- **Error Handling**: Secure error messages that don't leak information

#### **Data Privacy**
```javascript
// Remove sensitive data before logging
const logSafeRequest = (request) => {
  const safeRequest = { ...request };
  delete safeRequest.headers['x-api-key'];
  delete safeRequest.personalData;
  
  logger.info('API Request', {
    endpoint: safeRequest.endpoint,
    method: safeRequest.method,
    requestId: safeRequest.requestId,
    timestamp: new Date().toISOString()
  });
};
```

### 5. **Environment-Specific Security**

#### **Development Environment**
```javascript
const getApiUrl = () => {
  if (import.meta.env.DEV || window.location.hostname === 'localhost') {
    return 'http://localhost:3001'; // Local development server
  }
  return 'https://api-gateway-url.amazonaws.com/prod'; // Production API Gateway
};
```

#### **Production Environment**
- **API Gateway**: Full security controls enabled
- **CloudFront**: DDoS protection and global distribution
- **WAF Rules**: Custom security rules for additional protection
- **VPC**: Optional VPC deployment for enhanced isolation

## Deployment Security Best Practices

### 1. **Infrastructure as Code**
```hcl
# Terraform ensures consistent security configuration
resource "aws_api_gateway_rest_api" "ai_api_gateway" {
  name = "${var.bucket_name}-ai-api"
  
  endpoint_configuration {
    types = ["EDGE"]  # Global distribution with DDoS protection
  }
}

# CORS configuration
resource "aws_api_gateway_integration_response" "options_integration_response" {
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'${var.allowed_origin}'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-API-Key'"
  }
}
```

### 2. **Secrets Management**
```hcl
# Environment variables for sensitive configuration
resource "aws_lambda_function" "ai_api" {
  environment {
    variables = {
      NODE_ENV = var.environment
      LOG_LEVEL = var.environment == "production" ? "info" : "debug"
      CORS_ORIGIN = "https://${aws_cloudfront_distribution.website.domain_name}"
      # API keys provided by clients, not stored server-side
    }
  }
}
```

### 3. **Monitoring & Alerting**
```javascript
// CloudWatch metrics for security monitoring
const publishSecurityMetric = (metricName, value) => {
  cloudwatch.putMetricData({
    Namespace: 'AI-API/Security',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: 'Count',
      Timestamp: new Date()
    }]
  });
};

// Alert on suspicious activity
if (requestRate > RATE_LIMIT_THRESHOLD) {
  publishSecurityMetric('RateLimitExceeded', 1);
}
```

## Security Benefits Summary

| Security Feature | API Gateway + Lambda | Lambda URLs Only |
|------------------|---------------------|------------------|
| **Request Validation** | ✅ Built-in schema validation | ❌ Manual implementation |
| **Rate Limiting** | ✅ Multiple tiers of protection | ⚠️ Basic Lambda concurrency |
| **DDoS Protection** | ✅ CloudFront + API Gateway | ⚠️ Limited protection |
| **SSL/TLS Management** | ✅ Automatic certificate handling | ⚠️ Manual configuration |
| **CORS Controls** | ✅ Fine-grained control | ⚠️ Basic CORS support |
| **Monitoring** | ✅ Comprehensive logging | ⚠️ CloudWatch only |
| **Authentication** | ✅ Multiple auth methods | ❌ Custom implementation |
| **Traffic Analytics** | ✅ Detailed metrics | ❌ Limited visibility |
| **Error Handling** | ✅ Centralized error management | ⚠️ Function-level only |

## Conclusion

Our API Gateway + Lambda architecture provides enterprise-grade security for AI API interactions while maintaining flexibility and scalability. This approach ensures that sensitive API keys and user data are protected through multiple layers of security controls, making it suitable for production environments handling sensitive information.

The additional complexity of API Gateway is justified by the significant security benefits, especially when dealing with external AI services that require API key authentication and handle potentially sensitive user data.