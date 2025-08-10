#!/usr/bin/env node

import { getCurrentApiKey } from './src/middleware/auth.js';

console.log('Frontend API Key for Development:');
console.log(getCurrentApiKey());
console.log();
console.log('Add this to your frontend SecureAIAnalysisWidget.tsx:');
console.log(`const developmentApiKey = '${getCurrentApiKey()}';`);