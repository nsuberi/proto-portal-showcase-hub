# Proto Portal Showcase Hub

A monorepo containing various prototypes and shared design components for demonstrating innovative web technologies and concepts.

## 🏗️ Monorepo Structure

```
proto-portal-showcase-hub/
├── shared/
│   └── design-system/     # Shared UI components and utilities
├── prototypes/
│   └── ffx-skill-map/     # Final Fantasy X Skill Map Prototype
├── scripts/               # Build and deployment scripts
└── terraform/             # Infrastructure as Code
```

## 🎯 Current Prototypes

### Final Fantasy X Skill Map
A graph-based skill development system inspired by Final Fantasy X's Sphere Grid, built with Neo4j and React.

**Features:**
- 🗺️ Interactive skill map with 48 skills across 5 categories
- 👥 Employee skill tracking and analytics
- 🧠 Intelligent skill assessment quiz
- 🎯 Personalized skill recommendations
- 📊 Dashboard with charts and statistics

**Tech Stack:**
- React 18 + TypeScript + Vite
- Neo4j 5.15 Community Edition
- Shadcn/ui + Tailwind CSS
- TanStack Query + React Router

**Quick Start:**
```bash
# Start the FFX prototype
npm run dev:ffx

# Start Neo4j database
npm run docker:up

# Seed database
cd prototypes/ffx-skill-map && npm run db:seed
```

## 🎨 Shared Design System

The `shared/design-system` package contains reusable UI components and utilities that can be imported by any prototype:

- **UI Components**: Complete set of Shadcn/ui components
- **Utilities**: Common helper functions and utilities
- **Types**: Shared TypeScript type definitions
- **Styles**: Consistent styling and theming

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose (for database prototypes)
- Git

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd proto-portal-showcase-hub

# Install dependencies for all workspaces
npm install

# Install dependencies for specific prototype
cd prototypes/ffx-skill-map
npm install
```

### Development

#### Main Application
```bash
# Start the main application
npm run dev
```

#### FFX Skill Map Prototype
```bash
# Start the FFX prototype
npm run dev:ffx

# Or navigate to the prototype directory
cd prototypes/ffx-skill-map
npm run dev
```

#### Database Setup (for FFX prototype)
```bash
# Start Neo4j
npm run docker:up

# Seed the database
cd prototypes/ffx-skill-map
npm run db:seed

# Reset database (if needed)
npm run db:reset
```

## 📁 Project Structure

### Shared Components (`shared/design-system/`)
```
shared/design-system/
├── ui/                   # Shadcn/ui components
├── lib/                  # Utility functions
└── index.ts             # Main export file
```

### FFX Skill Map (`prototypes/ffx-skill-map/`)
```
prototypes/ffx-skill-map/
├── src/
│   ├── components/       # React components
│   ├── pages/           # Application pages
│   ├── services/        # Neo4j service layer
│   ├── types/           # TypeScript types
│   ├── data/            # Quiz questions and static data
│   └── hooks/           # Custom React hooks
├── scripts/             # Database seeding scripts
├── docker-compose.yml   # Neo4j container setup
└── README.md           # Detailed documentation
```

## 🛠️ Available Scripts

### Root Level
```bash
npm run dev              # Start main application
npm run dev:ffx          # Start FFX prototype
npm run build:ffx        # Build FFX prototype
npm run docker:up        # Start Neo4j for FFX
npm run docker:down      # Stop Neo4j
```

### FFX Prototype Specific
```bash
cd prototypes/ffx-skill-map
npm run dev              # Start development server
npm run build            # Build for production
npm run docker:up        # Start Neo4j container
npm run docker:down      # Stop Neo4j container
npm run db:seed          # Seed database
npm run db:reset         # Reset and reseed database
```

## 🎯 Prototype Features

### FFX Skill Map
- **Dashboard**: Overview with statistics and charts
- **Skill Map**: Interactive exploration of skills by category and level
- **Employees**: Employee management with skill tracking
- **Quiz**: Behavioral assessment for skill inference
- **Recommendations**: AI-powered skill suggestions

### Key Technologies Demonstrated
- **Graph Databases**: Neo4j for complex relationship modeling
- **React Query**: Efficient data fetching and caching
- **TypeScript**: Type-safe development
- **Modern UI**: Shadcn/ui components with Tailwind CSS
- **Docker**: Containerized database setup
- **Monorepo**: Shared components across prototypes

## 🔧 Development

### Adding New Prototypes
1. Create a new directory in `prototypes/`
2. Set up package.json with workspace dependencies
3. Import shared components from `@proto-portal/design-system`
4. Add scripts to root package.json
5. Update this README

### Shared Component Development
1. Add new components to `shared/design-system/ui/`
2. Export from `shared/design-system/index.ts`
3. Update package.json dependencies as needed
4. Test in prototypes

### Database Prototypes
1. Create `docker-compose.yml` for database setup
2. Add seeding scripts in `scripts/`
3. Create service layer for database interactions
4. Document setup process

## 📚 Documentation

- [FFX Skill Map README](prototypes/ffx-skill-map/README.md) - Detailed documentation for the FFX prototype
- [Deployment Guide](DEPLOYMENT.md) - Infrastructure and deployment instructions

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions including:
- Terraform infrastructure setup
- Docker container deployment
- CI/CD pipeline configuration
- Environment management

## 🤝 Contributing

This repository is designed for prototyping and demonstrating concepts. Feel free to:
- Fork and experiment with the codebase
- Add new prototypes or features
- Improve existing implementations
- Share feedback and suggestions

## 📄 License

This project is intended for educational and demonstration purposes as part of the Proto Portal Showcase Hub.
