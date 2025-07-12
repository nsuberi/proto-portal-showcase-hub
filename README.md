# Proto Portal Showcase Hub

A monorepo containing various prototypes and shared design components for demonstrating innovative web technologies and concepts. This project showcases a modern portfolio architecture with integrated prototypes, featuring a shared design system and automated deployment pipeline.

## 🏗️ Architecture Overview

This project implements a **monorepo architecture** with:
- **Main Portfolio**: Showcases all prototypes with integrated navigation
- **Shared Design System**: Reusable UI components across all prototypes
- **Individual Prototypes**: Self-contained applications with specific features
- **Unified Deployment**: Single build process that creates an integrated experience

## 🏗️ Monorepo Structure

```
proto-portal-showcase-hub/
├── src/                   # Main portfolio application
│   ├── components/        # Portfolio-specific components
│   ├── pages/            # Portfolio pages
│   └── assets/           # Static assets
├── shared/
│   └── design-system/    # Shared UI components and utilities
├── prototypes/
│   └── ffx-skill-map/    # Final Fantasy X Skill Map Prototype
├── scripts/              # Build and deployment scripts
├── terraform/            # Infrastructure as Code
└── .github/workflows/    # CI/CD pipeline
```

## 🎨 Design System Architecture

The `shared/design-system` package is the foundation of the monorepo's UI consistency:

### **Why a Shared Design System?**
- **Consistency**: Ensures all prototypes have the same look and feel
- **Efficiency**: Reduces code duplication across prototypes
- **Maintainability**: Central place to update UI components
- **Scalability**: Easy to add new prototypes with existing components

### **Design System Structure**
```
shared/design-system/
├── ui/                   # Complete Shadcn/ui component library
│   ├── button.tsx        # Button component
│   ├── card.tsx          # Card component
│   ├── dialog.tsx        # Dialog component
│   └── ...               # 40+ UI components
├── lib/
│   ├── utils.ts          # Utility functions (cn, clsx)
│   └── use-toast.ts      # Toast hook
├── hooks/
│   └── use-toast.ts      # Shared React hooks
├── package.json          # Design system dependencies
└── index.ts              # Main export file
```

### **How Prototypes Use the Design System**
```typescript
// In any prototype
import { Button, Card, Dialog } from "@proto-portal/design-system";

// Components are automatically styled and consistent
<Button variant="primary">Click me</Button>
<Card>Content here</Card>
```

## 🎯 Current Prototypes

### FFX Skill Map
A graph-based skill development system inspired by Final Fantasy X's Sphere Grid, built with Neo4j and React.

**Features:**
- 🗺️ Interactive skill map with Sigma.js visualization
- 👥 Employee skill tracking and analytics
- 🧠 Intelligent skill assessment quiz
- 🎯 Personalized skill recommendations
- 📊 Dashboard with charts and statistics

**Tech Stack:**
- React 18 + TypeScript + Vite
- Sigma.js + Graphology for graph visualization
- Neo4j 5.15 Community Edition
- Shared Design System + Tailwind CSS
- TanStack Query + React Router

**Quick Start:**
```bash
# Start the FFX prototype in development
npm run dev:ffx

# Start Neo4j database
npm run docker:up

# Seed database
cd prototypes/ffx-skill-map && npm run db:seed
```

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** and **Yarn 4.9+** (managed via Corepack)
- **Docker and Docker Compose** (for database prototypes)
- **Git**
- **Python 3** (for local testing of built applications)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd proto-portal-showcase-hub

# Setup Node.js and enable Corepack
nvm use 18
corepack enable

# Install dependencies for all workspaces
yarn install --immutable
```

### Development

#### Main Portfolio Application
```bash
# Start the main portfolio (shows all prototypes)
yarn dev
# Opens at http://localhost:8080
```

#### FFX Skill Map Prototype
```bash
# Start the FFX prototype directly
yarn dev:ffx
# Opens at http://localhost:3001

# Or navigate to the prototype directory
cd prototypes/ffx-skill-map
yarn dev
```

#### Database Setup (for FFX prototype)
```bash
# Start Neo4j
yarn docker:up

# Seed the database
cd prototypes/ffx-skill-map
yarn db:seed

# Reset database (if needed)
yarn db:reset
```

## 🏗️ Build & Deployment Architecture

### **Build Process**
The build system creates an integrated deployment where:
1. **Main Portfolio** builds to `dist/`
2. **FFX Skill Map** builds to `dist/prototypes/ffx-skill-map/`
3. **Integrated Navigation** allows seamless movement between portfolio and prototypes

```bash
# Build everything
yarn build
# or
./scripts/build.sh

# This creates:
# dist/
# ├── index.html (main portfolio)
# ├── assets/ (portfolio assets)
# └── prototypes/
#     └── ffx-skill-map/
#         ├── index.html (FFX app)
#         └── assets/ (FFX assets)
```

### **Local Testing with Python HTTP Server**

#### **Why Python HTTP Server?**
After building the integrated application, you need to serve static files to test the production build. Here's why we use Python's built-in HTTP server:

1. **No Build Tools**: The built application is pure HTML/CSS/JS - no Node.js needed
2. **Proper Routing**: Serves static files with correct MIME types
3. **Path Resolution**: Handles relative paths between portfolio and prototypes
4. **Universal**: Python 3 is available on most systems
5. **Simple**: One command to test the entire integrated build

#### **Testing the Built Application**
```bash
# After building
yarn build

# Test the integrated build
cd dist
python3 -m http.server 8000

# Visit:
# http://localhost:8000 (main portfolio)
# http://localhost:8000/prototypes/ffx-skill-map/ (FFX prototype)
```

#### **Alternative Local Servers**
```bash
# Using Node.js serve
npx serve dist -p 8000

# Using PHP (if available)
cd dist && php -S localhost:8000

# Using any static file server
```

### **Production Deployment**
The project deploys to AWS using:
- **S3**: Static file hosting
- **CloudFront**: CDN for global distribution
- **Terraform**: Infrastructure as Code
- **GitHub Actions**: Automated CI/CD pipeline

## 📁 Detailed Project Structure

### **Main Portfolio (`src/`)**
```
src/
├── components/
│   └── Portfolio.tsx     # Main portfolio component
├── pages/
│   ├── Index.tsx         # Landing page
│   └── NotFound.tsx      # 404 page
├── assets/
│   └── hero-bg.jpg       # Portfolio assets
├── App.tsx               # Main app component
└── main.tsx              # Entry point
```

### **Shared Design System (`shared/design-system/`)**
```
shared/design-system/
├── ui/                   # 40+ Shadcn/ui components
│   ├── button.tsx        # Button variants
│   ├── card.tsx          # Card layouts
│   ├── dialog.tsx        # Modal dialogs
│   ├── select.tsx        # Dropdown selects
│   └── ...               # Complete component library
├── lib/
│   ├── utils.ts          # Utility functions
│   └── use-toast.ts      # Toast notifications
├── hooks/
│   └── use-toast.ts      # Shared React hooks
├── package.json          # Design system dependencies
└── index.ts              # Exports all components
```

### **FFX Skill Map (`prototypes/ffx-skill-map/`)**
```
prototypes/ffx-skill-map/
├── src/
│   ├── components/       # React components
│   ├── pages/           # Application pages
│   │   ├── Dashboard.tsx # Analytics dashboard
│   │   ├── SkillMap.tsx  # Interactive skill map
│   │   ├── Employees.tsx # Employee management
│   │   ├── Quiz.tsx      # Skill assessment
│   │   └── Recommendations.tsx # AI recommendations
│   ├── services/        # Neo4j service layer
│   ├── types/           # TypeScript types
│   ├── data/            # Quiz questions and static data
│   └── hooks/           # Custom React hooks
├── scripts/             # Database seeding scripts
├── docker-compose.yml   # Neo4j container setup
└── README.md           # Detailed documentation
```

## 🛠️ Available Scripts

### **Root Level (Portfolio + All Prototypes)**
```bash
# Development
yarn dev              # Start main portfolio
yarn dev:ffx          # Start FFX prototype

# Building
yarn build            # Build integrated application
yarn build:ffx        # Build FFX prototype only

# Database (FFX)
yarn docker:up        # Start Neo4j for FFX
yarn docker:down      # Stop Neo4j

# Testing
yarn preview          # Preview built application
```

### **FFX Prototype Specific**
```bash
cd prototypes/ffx-skill-map

# Development
yarn dev              # Start development server
yarn build            # Build for production
yarn preview          # Preview built prototype

# Database
yarn docker:up        # Start Neo4j container
yarn docker:down      # Stop Neo4j container
yarn db:seed          # Seed database
yarn db:reset         # Reset and reseed database

# Testing
yarn test             # Run unit tests
yarn test:watch       # Run tests in watch mode
```

## 🎯 Prototype Features

### **FFX Skill Map**
- **Dashboard**: Overview with statistics and interactive charts
- **Skill Map**: Sigma.js visualization with employee skill highlighting
- **Employees**: Employee management with skill tracking
- **Quiz**: Behavioral assessment for skill inference
- **Recommendations**: AI-powered skill suggestions

### **Key Technologies Demonstrated**
- **Graph Databases**: Neo4j for complex relationship modeling
- **Graph Visualization**: Sigma.js + Graphology for interactive skill maps
- **React Query**: Efficient data fetching and caching
- **TypeScript**: Type-safe development across all components
- **Modern UI**: Shared design system with Tailwind CSS
- **Docker**: Containerized database setup
- **Monorepo**: Yarn workspaces with shared dependencies

## 🔧 Development Workflow

### **Adding New Prototypes**
1. Create directory in `prototypes/`
2. Set up `package.json` with workspace dependencies
3. Import shared components: `import { Button } from "@proto-portal/design-system"`
4. Add scripts to root `package.json`
5. Update build script to include new prototype
6. Add to portfolio component
7. Update this README

### **Shared Component Development**
1. Add new components to `shared/design-system/ui/`
2. Export from `shared/design-system/index.ts`
3. Update package.json dependencies as needed
4. Test in prototypes
5. Document component usage

### **Database Prototypes**
1. Create `docker-compose.yml` for database setup
2. Add seeding scripts in `scripts/`
3. Create service layer for database interactions
4. Document setup process in prototype README

## 🚀 Deployment Pipeline

### **GitHub Actions Workflow**
```yaml
# .github/workflows/deploy.yml
- Setup Node.js 18 + Yarn
- Enable Corepack for workspace protocol
- Install dependencies with yarn
- Build integrated application
- Deploy to AWS S3 + CloudFront
- Invalidate CDN cache
```

### **Infrastructure (Terraform)**
- **S3 Bucket**: Static file hosting
- **CloudFront Distribution**: Global CDN
- **Route 53**: DNS management
- **IAM Roles**: Secure deployment access

### **Deployment Commands**
```bash
# Local deployment (requires AWS credentials)
./scripts/deploy-infrastructure.sh
./scripts/deploy-site.sh

# Or use GitHub Actions (automatic on push to main)
git push origin main
```

## 📚 Documentation

- **[FFX Skill Map README](prototypes/ffx-skill-map/README.md)** - Detailed prototype documentation
- **[Deployment Guide](DEPLOYMENT.md)** - Infrastructure and deployment instructions
- **[Design System Guide](shared/design-system/README.md)** - Component library documentation

## 🤝 Contributing

This repository demonstrates modern web development practices:
- **Monorepo Architecture**: Shared components and utilities
- **Type Safety**: TypeScript throughout
- **Modern Tooling**: Vite, Yarn workspaces, GitHub Actions
- **Cloud Deployment**: AWS infrastructure with Terraform
- **Testing**: Unit tests and integration tests

Feel free to:
- Fork and experiment with the codebase
- Add new prototypes or features
- Improve existing implementations
- Share feedback and suggestions

## 📄 License

This project is intended for educational and demonstration purposes as part of the Proto Portal Showcase Hub.
