export interface DocumentData {
  id: string;
  title: string;
  filename: string;
  content: string;
  position?: { x: number; y: number };
  floatDuration?: number;
  floatDelay?: number;
}

export const documentsData: DocumentData[] = [
  {
    id: 'api',
    title: 'API.md',
    filename: 'API.md',
    content: `# API Documentation

## Claude Service Integration

The application uses Claude API for AI-powered features. The API service is located at:
\`shared/api/src/services/claude-service.js\`

### Key Features:
- Skill analysis and recommendations
- Just-in-time learning suggestions
- Home lending understanding assessment

### Configuration:
- API keys stored in AWS Secrets Manager
- Mock mode available for development
- Rate limiting and error handling built-in`,
    position: { x: 15, y: 20 },
    floatDuration: 65,
    floatDelay: 0
  },
  {
    id: 'design-tokens',
    title: 'DESIGN_TOKENS.md',
    filename: 'DESIGN_TOKENS.md',
    content: `# Design Tokens

## Shared Design System

The design tokens provide consistent styling across all prototypes.

### Location:
\`shared/design-tokens/\`

### Features:
- Tailwind configuration
- Color schemes and themes
- Typography scales
- Spacing and sizing systems
- Animation utilities

### Usage:
Import from \`@proto-portal/design-tokens\` in your components.`,
    position: { x: 60, y: 15 },
    floatDuration: 75,
    floatDelay: 8
  },
  {
    id: 'development',
    title: 'DEVELOPMENT_AND_DEPLOYMENT.md',
    filename: 'DEVELOPMENT_AND_DEPLOYMENT.md',
    content: `# Development and Deployment

## Local Development

### Commands:
\`\`\`bash
yarn dev:all  # Starts all services
# Main portfolio (port 8080)
# FFX Skill Map (port 3001)
# Home Lending Learning (port 3002)
# Documentation Explorer (port 3003)
# API server (port 3003)
\`\`\`

### Testing:
- Unit tests: \`npm test\`
- Integration tests: \`npm run test:integration\`
- E2E tests: \`npm run test:e2e\`

## Deployment

Automated via GitHub Actions to AWS CloudFront.`,
    position: { x: 35, y: 50 },
    floatDuration: 80,
    floatDelay: 12
  },
  {
    id: 'security',
    title: 'SECURITY.md',
    filename: 'SECURITY.md',
    content: `# Security

## Best Practices

### API Keys:
- Never commit API keys
- Use AWS Secrets Manager in production
- Environment variables for local development

### Authentication:
- JWT tokens for session management
- API Gateway authentication
- CORS configuration

### Code Security:
- Input validation
- SQL injection prevention
- XSS protection
- Rate limiting`,
    position: { x: 25, y: 55 },
    floatDuration: 70,
    floatDelay: 5
  },
  {
    id: 'testing',
    title: 'TESTING.md',
    filename: 'TESTING.md',
    content: `# Testing

## Test Structure

### Unit Tests:
- Jest for component testing
- React Testing Library
- Mock service workers

### Integration Tests:
Located in \`e2e/api-claude-integration.spec.ts\`

### E2E Tests:
- Playwright for browser automation
- Cross-browser testing
- Visual regression tests

### Coverage:
Aim for >80% code coverage on critical paths.`,
    position: { x: 65, y: 40 },
    floatDuration: 85,
    floatDelay: 15
  },
  {
    id: 'domain-setup',
    title: 'DOMAIN_SETUP.md',
    filename: 'DOMAIN_SETUP.md',
    content: `# Domain Setup

## CloudFront Configuration

### Distribution:
- S3 origin for static assets
- API Gateway origin for backend
- Custom error pages for SPA routing

### DNS:
- Route 53 for domain management
- SSL certificates via ACM

### Performance:
- Edge caching
- Compression enabled
- HTTP/2 support`,
    position: { x: 45, y: 30 },
    floatDuration: 90,
    floatDelay: 20
  }
];

// Map of questions to relevant file paths in the codebase
export const codebaseLinks: Record<string, string> = {
  'api': 'https://github.com/nsuberi/proto-portal-showcase-hub/blob/main/shared/api/src/services/claude-service.js',
  'claude': 'https://github.com/nsuberi/proto-portal-showcase-hub/blob/main/shared/api/src/services/claude-service.js',
  'design': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/shared/design-tokens',
  'tokens': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/shared/design-tokens',
  'ffx': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/prototypes/ffx-skill-map',
  'skill': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/prototypes/ffx-skill-map',
  'home': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/prototypes/home-lending-learning',
  'lending': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/prototypes/home-lending-learning',
  'portfolio': 'https://github.com/nsuberi/proto-portal-showcase-hub/blob/main/src/components/Portfolio.tsx',
  'main': 'https://github.com/nsuberi/proto-portal-showcase-hub/blob/main/src/App.tsx',
  'deploy': 'https://github.com/nsuberi/proto-portal-showcase-hub/blob/main/.github/workflows/deploy.yml',
  'github': 'https://github.com/nsuberi/proto-portal-showcase-hub/blob/main/.github/workflows/deploy.yml',
  'build': 'https://github.com/nsuberi/proto-portal-showcase-hub/blob/main/scripts/build.sh',
  'terraform': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/terraform',
  'infrastructure': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/terraform',
  'test': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/e2e',
  'e2e': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/e2e',
  'default': 'https://github.com/nsuberi/proto-portal-showcase-hub'
};