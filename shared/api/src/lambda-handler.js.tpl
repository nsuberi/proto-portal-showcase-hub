import serverless from 'serverless-http';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// For Lambda, we need to handle module loading differently
// Import the main server app
const { default: app } = await import('./server.js');

// Create serverless handler
export const handler = serverless(app, {
  request: (request, event, context) => {
    // Add Lambda context to request for logging
    request.lambda = {
      event,
      context,
      requestId: context.awsRequestId
    };
  }
});