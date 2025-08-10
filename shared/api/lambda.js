import serverless from 'serverless-http';
import app from './src/server.js';

// Create the serverless handler
// Updated: 2025-08-06 - Force Lambda redeploy for CORS fix
export const handler = serverless(app, {
  // Configure for better Lambda performance
  provider: 'aws',
  request: (request, event, context) => {
    // Add Lambda context to request for logging
    request.lambda = {
      event,
      context,
      requestId: context.awsRequestId
    };
  },
  response: (response, event, context) => {
    // Add any response processing here if needed
  }
});