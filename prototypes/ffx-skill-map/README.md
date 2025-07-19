# Final Fantasy X Skill Map Prototype

A graph-based skill development system inspired by Final Fantasy X's Sphere Grid. This prototype demonstrates how Neo4j can be used to create an interactive skill mapping system for employee development and career planning.

## Features

### 🎯 Core Functionality
- **Graph Database**: Neo4j representation of a Final Fantasy X-inspired skill map
- **Employee Management**: Track employee skills and career progression
- **Skill Assessment Quiz**: Intelligent skill inference based on behavioral questions
- **Personalized Recommendations**: AI-powered skill suggestions based on current abilities
- **Interactive Skill Map**: Visual exploration of skills organized by categories and levels

### 🗺️ Skill Map Structure
- **48 Skills** across 5 categories: Combat, Magic, Support, Special, and Advanced
- **6 Skill Levels** from basic (Level 1) to master (Level 6)
- **Prerequisite System** with skill dependencies and unlock paths
- **Sample Data** with 8 employees and their mastered skills

### 🧠 Quiz System
- **10 Behavioral Questions** covering different aspects of software development
- **Skill Inference Algorithm** that maps answers to specific skills
- **Confidence Scoring** based on answer consistency and completion
- **Dynamic Skill Mapping** with multiple skills per answer option

### 📊 Analytics & Insights
- **Dashboard Overview** with key metrics and visualizations
- **Employee Skill Analytics** with filtering and search capabilities
- **Skill Category Distribution** with charts and statistics
- **Learning Path Visualization** showing prerequisites and dependencies

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Custom UI components + Tailwind CSS
- **Data**: Mock Neo4j service (browser-compatible)
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM
- **Charts**: Recharts
- **Icons**: Lucide React
- **Database (Optional)**: Neo4j 5.15 Community Edition

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### 1. Clone and Setup
```bash
# Navigate to the prototype directory
cd prototypes/ffx-skill-map

# Install dependencies
npm install
```

### 2. Start the Application
```bash
# Start the development server
npm run dev

# Open http://localhost:3001
```

The application now uses mock data instead of Neo4j for browser compatibility. No database setup is required!

### Alternative: Neo4j Database (Optional)
If you want to use a real Neo4j database instead of mock data:

1. **Setup Neo4j with Docker**:
```bash
# Start the Neo4j container
npm run docker:up

# Wait for Neo4j to be ready (check http://localhost:7474)
# Default credentials: neo4j/password
```

2. **Seed the Database**:
```bash
# Populate the database with FFX skill data
npm run db:seed
```

3. **Update the service**: Modify `src/App.tsx` to use the real Neo4j service instead of MockNeo4jService.

## Database Schema

### Nodes
- **Skill**: Represents individual skills with properties (id, name, description, level, category)
- **Employee**: Represents employees with properties (id, name, role, department)

### Relationships
- **PREREQUISITE**: Links skills that are required to unlock other skills
- **MASTERED**: Links employees to skills they have mastered

### Sample Data
- 48 skills across 5 categories and 6 levels
- 8 sample employees with varying skill sets
- 50+ prerequisite relationships creating learning paths

## API Endpoints

The application uses a Neo4j service layer with the following key operations:

### Skills
- `getAllSkills()`: Retrieve all skills ordered by level and name
- `getSkillsByCategory(category)`: Get skills filtered by category
- `getSkillConnections()`: Get all prerequisite relationships

### Employees
- `getAllEmployees()`: Retrieve all employees with their mastered skills
- `getEmployeeById(id)`: Get specific employee details
- `getEmployeeSkills(employeeId)`: Get skills mastered by an employee

### Recommendations
- `getAvailableSkills(employeeId)`: Get skills an employee can learn next
- `getSkillRecommendations(employeeId)`: Get personalized skill suggestions
- `saveQuizResults(quizResult)`: Save quiz results and infer skills

## Quiz System

### Question Structure
Each quiz question has:
- **Question text** describing a work scenario
- **4 answer options** with different skill implications
- **Skill mapping** where each option corresponds to specific skills
- **Category classification** for organizing questions

### Skill Inference Algorithm
1. **Answer Collection**: Track selected options for each question
2. **Skill Counting**: Count how many times each skill appears in selected answers
3. **Threshold Filtering**: Only include skills that appear in 2+ answers
4. **Confidence Calculation**: Based on completion rate and answer consistency

### Sample Questions
- "How do you typically approach debugging a problem?"
- "When working on a team project, what role do you usually take?"
- "How do you handle performance optimization?"
- "What's your approach to learning new technologies?"

## Skill Categories

### ⚔️ Combat
Physical and tactical abilities focused on direct problem-solving
- **Examples**: Attack, Power Break, Quick Hit, Delay Attack
- **Real-world**: Debugging, optimization, system architecture

### 🔮 Magic
Elemental and arcane abilities representing technical expertise
- **Examples**: Fire, Fira, Firaga, Doublecast
- **Real-world**: Programming languages, frameworks, advanced concepts

### 💚 Support
Healing and buffing abilities for team collaboration
- **Examples**: Cure, Esuna, Haste, Protect
- **Real-world**: Code review, mentoring, documentation

### ⭐ Special
Unique utility abilities for specialized tasks
- **Examples**: Steal, Mug, Use, Throw
- **Real-world**: Testing, security, tooling

### 👑 Advanced
High-level master abilities requiring significant expertise
- **Examples**: Auto-Haste, Auto-Life, Ribbon
- **Real-world**: Architecture, leadership, innovation

## Development

### Project Structure
```
src/
├── components/          # Reusable UI components
├── pages/              # Main application pages
├── services/           # Neo4j service layer
├── types/              # TypeScript type definitions
├── data/               # Quiz questions and static data
└── hooks/              # Custom React hooks
```

### Key Files
- `src/components/ui/`: Custom UI components (Button, Card, etc.)
- `src/services/mockData.ts`: Mock Neo4j service for browser compatibility
- `src/services/neo4j.ts`: Real Neo4j service layer (optional)
- `src/data/quiz-questions.ts`: Quiz system implementation
- `scripts/seed-database.js`: Database seeding script (for Neo4j)
- `docker-compose.yml`: Neo4j container configuration (optional)

### Available Scripts
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run docker:up        # Start Neo4j container
npm run docker:down      # Stop Neo4j container
npm run db:seed          # Seed database with sample data
npm run db:reset         # Reset and reseed database
```

## Customization

### Adding New Skills
1. Edit `scripts/seed-database.js`
2. Add skill to the `skills` array
3. Add prerequisite connections to the `connections` array
4. Run `npm run db:reset`

### Modifying Quiz Questions
1. Edit `src/data/quiz-questions.ts`
2. Update question text, options, and skill mappings
3. Restart the application

### Extending the Schema
1. Modify Neo4j queries in `src/services/neo4j.ts`
2. Update TypeScript types in `src/types/index.ts`
3. Add new UI components as needed

## Troubleshooting

### Neo4j Connection Issues
- Ensure Docker is running
- Check if port 7474 is available
- Verify container is healthy: `docker ps`
- Check logs: `docker logs ffx-skill-map-neo4j`

### Database Reset
```bash
# Complete reset
npm run db:reset

# Or manual steps
npm run docker:down
npm run docker:up
# Wait 10 seconds
npm run db:seed
```

### Development Issues
- Clear browser cache and local storage
- Restart the development server
- Check browser console for errors
- Verify all dependencies are installed

## Future Enhancements

### Potential Features
- **Interactive Graph Visualization**: D3.js or Cytoscape.js integration
- **Skill Validation**: Certification and assessment systems
- **Learning Paths**: Curated skill progression recommendations
- **Team Analytics**: Group skill analysis and gap identification
- **Integration APIs**: Connect with HR systems and learning platforms
- **Mobile App**: React Native version for mobile access

### Technical Improvements
- **GraphQL API**: Replace direct Neo4j queries with GraphQL
- **Real-time Updates**: WebSocket integration for live data
- **Advanced Analytics**: Machine learning for better recommendations
- **Performance Optimization**: Caching and query optimization
- **Testing**: Comprehensive unit and integration tests

## Contributing

This is a prototype demonstrating graph database concepts. Feel free to:
- Fork and experiment with the codebase
- Add new features or improvements
- Report issues or suggest enhancements
- Create your own skill map variations

## License

This project is part of the Proto Portal Showcase Hub and is intended for educational and demonstration purposes. 