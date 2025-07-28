# Home Lending Learning Platform

An interactive learning platform designed to help innovators understand the complex world of home lending. This prototype provides comprehensive educational tools including process flow maps, glossary browsing, and knowledge testing to master mortgage industry fundamentals.

## Features

### 🗺️ Process Flow Map
- Interactive visualization of the complete home lending process
- Nodes representing each step from preparation to closing
- Detailed descriptions and key terminology for each stage
- Connection mapping showing the flow between process steps

### 📚 Glossary Browser
- Comprehensive database of home lending terminology (50+ terms)
- Categorized by type: General, Legal, Financial, Process
- Search and filter functionality
- Cross-referenced related terms
- Examples and detailed definitions

### 🧠 Knowledge Testing Cards
- 20+ interactive study cards with varying difficulty levels
- Beginner, Intermediate, and Advanced content
- Self-assessment with confidence tracking
- Automatic progress tracking and profile updates
- Related term connections for deeper learning

### 👤 User Profile & Progress Tracking
- Personal learning dashboard
- Progress tracking for terms and study cards
- Adaptive difficulty based on performance
- Learning goals and achievement tracking

## Educational Content

The platform is based on official documentation from:
- **Fannie Mae Selling Guide**: Comprehensive lending requirements and processes
- **Freddie Mac Seller/Servicer Guide**: Underwriting and loan delivery standards
- **Industry Best Practices**: 2025 mortgage lending workflows and terminology

### Key Learning Areas
- **Credit and Financial Assessment**: Understanding DTI, credit scores, and financial qualification
- **Application Process**: From pre-approval through formal application submission
- **Processing Phase**: Document verification, appraisal, and title work
- **Underwriting**: Risk assessment, conditional approval, and loan decisions
- **Closing Process**: Final approval, closing disclosure, and loan funding

## Technical Architecture

### Design System Integration
- Uses shared `@proto-portal/design-tokens` for consistent styling
- Custom color scheme optimized for financial services (professional blue, warm orange, success green)
- Responsive design following established patterns
- Accessible UI components with proper contrast and navigation

### Data Structure
- **Flow Map Nodes**: Process steps with connections and terminology links
- **Glossary Terms**: Categorized definitions with cross-references
- **Study Cards**: Knowledge testing with difficulty progression
- **User Profiles**: Progress tracking and learning analytics

### Learning Algorithms
- Adaptive card selection based on user level and completion
- Confidence-based mastery tracking
- Progress analytics and achievement systems
- Related content discovery and recommendations

## Usage

### Development
```bash
cd prototypes/home-lending-learning
npm install
npm run dev
```

The application runs on port 3002 and integrates with the shared design system.

### Target Audience
- **New Employees** in home lending companies
- **Innovation Teams** needing industry context
- **Professionals** transitioning into mortgage lending
- **Students** studying financial services

## Learning Outcomes

After completing the learning platform, users will understand:

1. **Industry Terminology**: Master 50+ essential home lending terms
2. **Process Flow**: Navigate the complete loan lifecycle from application to funding
3. **Key Stakeholders**: Understand roles of borrowers, lenders, underwriters, and settlement agents
4. **Regulatory Framework**: Learn about TRID, documentation requirements, and compliance
5. **Risk Assessment**: Understand how lenders evaluate creditworthiness and property value

## Future Enhancements

- **Document Library**: Integrated access to Fannie Mae/Freddie Mac resources
- **Scenario Simulations**: Interactive case studies with branching outcomes
- **Peer Learning**: Collaborative features for team-based learning
- **Certification Tracking**: Formal assessment and credential management
- **Real-time Updates**: Integration with regulatory changes and industry updates

---

This prototype demonstrates how complex industry knowledge can be made accessible through interactive learning experiences, supporting innovation teams who need deep domain expertise to create effective solutions in the home lending space.