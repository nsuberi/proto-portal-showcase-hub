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

# Build FFX prototype (dependencies already installed via workspace)
echo "🏗️ Building FFX prototype..."
yarn workspace @proto-portal/ffx-skill-map build

# Copy FFX build to main dist directory
echo "📋 Copying FFX build to main dist..."
mkdir -p dist/prototypes/ffx-skill-map
cp -r prototypes/ffx-skill-map/dist/* dist/prototypes/ffx-skill-map/

# Build Home Lending Learning prototype
echo "🏠 Building Home Lending Learning prototype..."

# Build Home Lending prototype (dependencies already installed via workspace)
echo "🏗️ Building Home Lending prototype..."
yarn workspace @proto-portal/home-lending-learning build

# Copy Home Lending build to main dist directory
echo "📋 Copying Home Lending build to main dist..."
mkdir -p dist/prototypes/home-lending-learning
cp -r prototypes/home-lending-learning/dist/* dist/prototypes/home-lending-learning/

# Build Documentation Explorer prototype
echo "📚 Building Documentation Explorer prototype..."

# Build Documentation Explorer prototype (dependencies already installed via workspace)
echo "🏗️ Building Documentation Explorer prototype..."
yarn workspace @proto-portal/documentation-explorer build

# Copy Documentation Explorer build to main dist directory
echo "📋 Copying Documentation Explorer build to main dist..."
mkdir -p dist/prototypes/documentation-explorer
cp -r prototypes/documentation-explorer/dist/* dist/prototypes/documentation-explorer/

# Build Learning Path prototype
echo "🗺️ Building Learning Path prototype..."

# Build Learning Path prototype (dependencies already installed via workspace)
echo "🏗️ Building Learning Path prototype..."
yarn workspace @proto-portal/learning-path build

# Copy Learning Path build to main dist directory
echo "📋 Copying Learning Path build to main dist..."
mkdir -p dist/prototypes/learning-path
cp -r prototypes/learning-path/dist/* dist/prototypes/learning-path/

# Build AI Builders Portal
echo "🏗️ Building AI Builders Portal..."
yarn workspace @proto-portal/ai-builders-portal build

# Copy AI Builders build to main dist directory
echo "📋 Copying AI Builders build to main dist..."
mkdir -p dist/ai-builders
cp -r apps/ai-builders-portal/dist/* dist/ai-builders/

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
echo "🏠 Home Lending Learning prototype files are in dist/prototypes/home-lending-learning/"
echo "📚 Documentation Explorer prototype files are in dist/prototypes/documentation-explorer/"