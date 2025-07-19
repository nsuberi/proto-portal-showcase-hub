#!/bin/bash
set -e

echo "🔨 Building AI Portfolio application..."

# Setup environment
echo "🔧 Setting up environment..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 18 &> /dev/null || echo "Node 18 already active"
corepack enable &> /dev/null || echo "Corepack already enabled"

# Install dependencies for main project
echo "📦 Installing main project dependencies..."
yarn install --immutable

# Build main portfolio for production
echo "🏗️ Building main portfolio..."
yarn build

# Build FFX skill map prototype
echo "🎮 Building FFX Skill Map prototype..."
cd prototypes/ffx-skill-map

# Install dependencies for FFX prototype (using npm)
echo "📦 Installing FFX prototype dependencies..."
nvm use 18 &> /dev/null || echo "Node 18 already active"
npm install

# Build FFX prototype
echo "🏗️ Building FFX prototype..."
npm run build

# Copy FFX build to main dist directory
echo "📋 Copying FFX build to main dist..."
cd ../..
mkdir -p dist/prototypes/ffx-skill-map
cp -r prototypes/ffx-skill-map/dist/* dist/prototypes/ffx-skill-map/

# Create a prototypes index.html that redirects to ffx-skill-map
echo "📋 Creating prototypes index redirect..."
cat > dist/prototypes/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prototypes - Proto Portal</title>
    <script>
        // Redirect to ffx-skill-map if accessed directly
        window.location.href = '/prototypes/ffx-skill-map/';
    </script>
</head>
<body>
    <p>Redirecting to prototypes...</p>
</body>
</html>
EOF

echo "✅ Build completed successfully!"
echo "📦 Main portfolio built files are in the dist/ directory"
echo "🎮 FFX Skill Map prototype files are in dist/prototypes/ffx-skill-map/"