#!/bin/bash
set -e

echo "🔨 Building AI Portfolio application..."

# Install dependencies
npm ci

# Build for production
npm run build

echo "✅ Build completed successfully!"
echo "📦 Built files are in the dist/ directory"