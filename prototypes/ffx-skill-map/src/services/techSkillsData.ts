// Technology Organization Skills Data
// Comprehensive workplace skills for modern tech organizations
// Maps to existing network structure with meaningful professional development paths

import { Skill, Employee, SkillConnection } from '../types';
import { SkillGraphAnalyzer, calculateSkillXP, expandMasteredSkills } from '../utils/graphUtils';

// Technology skill names organized by cluster and category
const techSkillNames = {
  // Core/Central Hub Skills - Executive/Leadership abilities
  leadership: [
    'Executive Presence', 'Strategic Vision', 'Organizational Leadership', 'Culture Building', 'Stakeholder Management'
  ],
  
  // Engineering Skills - Technical implementation
  engineering: [
    'Code Review', 'System Design', 'API Development', 'Database Design', 'Microservices Architecture',
    'Test-Driven Development', 'Continuous Integration', 'Performance Optimization', 'Security Implementation', 'Code Documentation',
    'Git Workflow', 'Docker Containerization', 'Kubernetes Orchestration', 'Infrastructure as Code', 'Monitoring & Alerting',
    'Debugging Techniques', 'Refactoring', 'Technical Debt Management', 'Load Balancing', 'Caching Strategies',
    'Clean Code Principles', 'Design Patterns', 'Terraform', 'AWS Services', 'Amazon Q CLI'
  ],
  
  // DevOps & Platform Engineering - Deployment and infrastructure
  platform: [
    'CI/CD Pipeline', 'GitLab Configuration', 'Automated Testing', 'Blue-Green Deployments', 'Canary Releases',
    'Ephemeral Environments', 'Container Orchestration', 'Service Mesh', 'Observability', 'Log Management',
    'Infrastructure Monitoring', 'Automated Rollbacks', 'Feature Flags', 'Configuration Management', 'Secret Management',
    'Disaster Recovery', 'Backup Strategies', 'Network Security', 'Compliance Automation', 'Cost Optimization',
    'Resource Scaling', 'Performance Tuning', 'Incident Response', 'Chaos Engineering', 'Site Reliability'
  ],
  
  // Product & User Experience - Business and user focus
  product: [
    'Product Strategy', 'User Research', 'Continuous User Interviews', 'Product Sense', 'Market Analysis',
    'Roadmap Planning', 'Feature Prioritization', 'User Story Writing', 'Acceptance Criteria', 'A/B Testing',
    'Analytics Implementation', 'Conversion Optimization', 'User Journey Mapping', 'Personas Development', 'Design Thinking',
    'Lean Methodology', 'Escaping Build Trap', 'Scope Management', 'Requirements Gathering', 'Stakeholder Communication',
    'Data-Driven Decisions', 'Customer Development', 'Prototype Validation', 'MVP Development', 'Go-to-Market Strategy'
  ],
  
  // Communication & Collaboration - Interpersonal skills
  communication: [
    'Active Listening', 'Written Communication', 'Presentation Skills', 'Technical Writing', 'Documentation Standards',
    'Meeting Facilitation', 'Conflict Resolution', 'Assertive Communication', 'Negotiation', 'Feedback Delivery',
    'Cross-team Collaboration', 'Remote Work Skills', 'Async Communication', 'Cultural Sensitivity', 'Emotional Intelligence',
    'Mentoring', 'Knowledge Sharing', 'Public Speaking', 'Executive Communication', 'Crisis Communication',
    'Influence Without Authority', 'Consensus Building', 'Difficult Conversations', 'Team Building', 'Inclusive Leadership'
  ],
  
  // Project Management & Process - Organizational skills
  process: [
    'Agile Methodology', 'Scrum Master', 'Sprint Planning', 'Retrospectives', 'Daily Standups',
    'Kanban Boards', 'Backlog Grooming', 'Estimation Techniques', 'Risk Management', 'Resource Planning',
    'Timeline Management', 'Scope Creep Control', 'Stakeholder Management', 'Budget Management', 'Quality Assurance',
    'Process Improvement', 'Lean Principles', 'Six Sigma', 'Change Management', 'Vendor Management',
    'Contract Negotiation', 'Compliance Management', 'Audit Preparation', 'Documentation Management', 'Training Coordination'
  ]
};

// Technology skill descriptions by category
const techSkillDescriptions = {
  leadership: [
    'Command respect and inspire confidence in high-stakes situations',
    'Develop and communicate compelling long-term organizational vision',
    'Build and scale engineering teams while maintaining culture',
    'Navigate complex stakeholder relationships with diplomatic skill',
    'Transform organizational challenges into strategic opportunities'
  ],
  engineering: [
    'Design scalable systems that handle millions of concurrent users',
    'Implement robust APIs that become the foundation for business growth',
    'Optimize database performance for enterprise-scale applications',
    'Build maintainable codebases that survive years of iteration',
    'Create comprehensive testing strategies that catch bugs before customers do'
  ],
  platform: [
    'Automate deployment processes to enable rapid, reliable releases',
    'Design infrastructure that scales automatically with business demands',
    'Implement monitoring systems that predict issues before they occur',
    'Create deployment strategies that eliminate downtime during releases',
    'Build resilient systems that gracefully handle failure scenarios'
  ],
  product: [
    'Discover user needs through systematic research and validation',
    'Translate business objectives into actionable product requirements',
    'Make data-driven decisions that directly impact user satisfaction',
    'Balance technical constraints with ambitious product vision',
    'Navigate competing priorities to deliver maximum customer value'
  ],
  communication: [
    'Facilitate productive conversations that resolve complex technical disagreements',
    'Communicate technical concepts clearly to non-technical stakeholders',
    'Build consensus across diverse teams with competing priorities',
    'Deliver difficult feedback in ways that motivate rather than discourage',
    'Navigate organizational politics while maintaining authentic relationships'
  ],
  process: [
    'Implement agile practices that actually improve team velocity',
    'Design workflows that reduce bureaucracy while maintaining quality',
    'Identify and eliminate process bottlenecks that slow delivery',
    'Create predictable delivery timelines that stakeholders can trust',
    'Balance flexibility with structure to optimize team performance'
  ]
};

class TechSkillsService {
  private skills: Skill[] = [];
  private connections: SkillConnection[] = [];
  private employees: Employee[] = [];
  private initialized = false;
  private graphAnalyzer: SkillGraphAnalyzer | null = null;
  
  // localStorage key for persisting employee data
  private readonly STORAGE_KEY = 'tech-skill-map-employees';

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    if (this.initialized) return;

    // Convert network nodes to tech skills
    this.skills = this.createTechSkillsFromNetworkData();
    this.connections = this.createConnectionsFromNetworkData();
    
    // Initialize graph analyzer for recommendations
    this.graphAnalyzer = new SkillGraphAnalyzer(this.skills, this.connections);
    
    // Load employees from localStorage or create new ones
    const storedEmployees = this.loadEmployeesFromStorage();
    if (storedEmployees && this.isValidEmployeeData(storedEmployees)) {
      this.employees = storedEmployees;
    } else {
      console.log('🔄 Creating fresh tech organization employee data');
      this.employees = this.createTechEmployees();
      // Save initial employee data to localStorage
      this.saveEmployeesToStorage();
    }
    
    this.initialized = true;
  }

  /**
   * Validate that employee data has the required structure
   */
  private isValidEmployeeData(employees: Employee[]): boolean {
    return employees.every(emp => 
      emp.id && emp.name && emp.role && emp.department && 
      Array.isArray(emp.mastered_skills) &&
      typeof emp.current_xp === 'number'
    );
  }

  /**
   * Load employee data from localStorage
   */
  private loadEmployeesFromStorage(): Employee[] | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }

      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (!storedData) {
        return null;
      }

      const parsedEmployees = JSON.parse(storedData) as Employee[];
      
      if (Array.isArray(parsedEmployees) && parsedEmployees.length > 0) {
        console.log(`🔄 Loaded ${parsedEmployees.length} tech employees from localStorage`);
        return parsedEmployees;
      }

      return null;
    } catch (error) {
      console.error('Failed to load tech employee data from localStorage:', error);
      this.clearStoredEmployees();
      return null;
    }
  }

  /**
   * Save employee data to localStorage
   */
  private saveEmployeesToStorage(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.employees));
      console.log(`💾 Saved ${this.employees.length} tech employees to localStorage`);
    } catch (error) {
      console.error('Failed to save tech employee data to localStorage:', error);
    }
  }

  /**
   * Clear stored employee data from localStorage
   */
  private clearStoredEmployees(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('🗑️ Cleared stored tech employee data');
      }
    } catch (error) {
      console.error('Failed to clear stored tech employee data:', error);
    }
  }

  private createTechSkillsFromNetworkData(): Skill[] {
    const skills: Skill[] = [];
    let engineeringIndex = 0, platformIndex = 0, productIndex = 0, 
        communicationIndex = 0, processIndex = 0, leadershipIndex = 0;

    // Use same network structure as FFX but with tech skills
    const networkNodes = [
      // Central Hub - Leadership skills
      { id: "central_1", type: "core", size: 12, level: 6 },
      { id: "central_2", type: "core", size: 10, level: 5 },
      { id: "central_3", type: "core", size: 10, level: 5 },
      { id: "central_4", type: "core", size: 10, level: 5 },
      { id: "central_5", type: "core", size: 10, level: 5 },
      
      // Cluster centers - Advanced domain skills
      { id: "tl_1", type: "cluster_center", size: 8, level: 4 }, // Engineering
      { id: "tr_1", type: "cluster_center", size: 8, level: 4 }, // Product
      { id: "lm_1", type: "cluster_center", size: 8, level: 4 }, // Platform
      { id: "rm_1", type: "cluster_center", size: 8, level: 4 }, // Communication
      { id: "bl_1", type: "cluster_center", size: 8, level: 4 }, // Process
      { id: "br_1", type: "cluster_center", size: 8, level: 4 }, // Advanced Engineering
      
      // Pathway nodes - Mid-level specializations
      { id: "path_1", type: "pathway", size: 8, level: 3 },
      { id: "path_2", type: "pathway", size: 8, level: 3 },
      { id: "path_3", type: "pathway", size: 8, level: 3 },
      { id: "path_4", type: "pathway", size: 8, level: 3 },
      { id: "path_5", type: "pathway", size: 8, level: 3 },
      { id: "path_6", type: "pathway", size: 8, level: 3 },
      { id: "path_7", type: "pathway", size: 8, level: 3 },
      { id: "path_8", type: "pathway", size: 8, level: 3 },
      
      // Regular nodes distributed across clusters
      { id: "tl_2", type: "node", size: 6, level: 2 }, // Engineering cluster
      { id: "tl_3", type: "node", size: 6, level: 2 },
      { id: "tl_4", type: "node", size: 6, level: 2 },
      { id: "tl_5", type: "node", size: 6, level: 2 },
      { id: "tl_6", type: "node", size: 6, level: 2 },
      { id: "tl_7", type: "node", size: 6, level: 2 },
      { id: "tl_8", type: "node", size: 6, level: 2 },
      { id: "tr_2", type: "node", size: 6, level: 2 }, // Product cluster
      { id: "tr_3", type: "node", size: 6, level: 2 },
      { id: "tr_4", type: "node", size: 6, level: 2 },
      { id: "tr_5", type: "node", size: 6, level: 2 },
      { id: "tr_6", type: "node", size: 6, level: 2 },
      { id: "tr_7", type: "node", size: 6, level: 2 },
      { id: "tr_8", type: "node", size: 6, level: 2 },
      { id: "lm_2", type: "node", size: 6, level: 2 }, // Platform cluster
      { id: "lm_3", type: "node", size: 6, level: 2 },
      { id: "lm_4", type: "node", size: 6, level: 2 },
      { id: "lm_5", type: "node", size: 6, level: 2 },
      { id: "lm_6", type: "node", size: 6, level: 2 },
      { id: "lm_7", type: "node", size: 6, level: 2 },
      { id: "lm_8", type: "node", size: 6, level: 2 },
      { id: "rm_2", type: "node", size: 6, level: 2 }, // Communication cluster
      { id: "rm_3", type: "node", size: 6, level: 2 },
      { id: "rm_4", type: "node", size: 6, level: 2 },
      { id: "rm_5", type: "node", size: 6, level: 2 },
      { id: "rm_6", type: "node", size: 6, level: 2 },
      { id: "rm_7", type: "node", size: 6, level: 2 },
      { id: "rm_8", type: "node", size: 6, level: 2 },
      { id: "bl_2", type: "node", size: 6, level: 2 }, // Process cluster
      { id: "bl_3", type: "node", size: 6, level: 2 },
      { id: "bl_4", type: "node", size: 6, level: 2 },
      { id: "bl_5", type: "node", size: 6, level: 2 },
      { id: "bl_6", type: "node", size: 6, level: 2 },
      { id: "bl_7", type: "node", size: 6, level: 2 },
      { id: "bl_8", type: "node", size: 6, level: 2 },
      { id: "br_2", type: "node", size: 6, level: 2 }, // Advanced Engineering cluster
      { id: "br_3", type: "node", size: 6, level: 2 },
      { id: "br_4", type: "node", size: 6, level: 2 },
      { id: "br_5", type: "node", size: 6, level: 2 },
      { id: "br_6", type: "node", size: 6, level: 2 },
      { id: "br_7", type: "node", size: 6, level: 2 },
      { id: "br_8", type: "node", size: 6, level: 2 },
      
      // Intermediate nodes - Entry-level skills
      { id: "inter_1", type: "intermediate", size: 5, level: 1 },
      { id: "inter_2", type: "intermediate", size: 5, level: 1 },
      { id: "inter_3", type: "intermediate", size: 5, level: 1 },
      { id: "inter_4", type: "intermediate", size: 5, level: 1 },
      { id: "inter_5", type: "intermediate", size: 5, level: 1 },
      { id: "inter_6", type: "intermediate", size: 5, level: 1 },
      { id: "inter_7", type: "intermediate", size: 5, level: 1 },
      { id: "inter_8", type: "intermediate", size: 5, level: 1 },
      { id: "inter_9", type: "intermediate", size: 5, level: 1 },
      { id: "inter_10", type: "intermediate", size: 5, level: 1 },
      
      // Scattered nodes - Foundational skills
      { id: "scatter_1", type: "scatter", size: 4, level: 1 },
      { id: "scatter_2", type: "scatter", size: 4, level: 1 },
      { id: "scatter_3", type: "scatter", size: 4, level: 1 },
      { id: "scatter_4", type: "scatter", size: 4, level: 1 },
      { id: "scatter_5", type: "scatter", size: 4, level: 1 },
      { id: "scatter_6", type: "scatter", size: 4, level: 1 },
      { id: "scatter_7", type: "scatter", size: 4, level: 1 },
      { id: "scatter_8", type: "scatter", size: 4, level: 1 },
      
      // Top/Bottom center clusters - Cross-functional skills
      { id: "tc_1", type: "node", size: 7, level: 3 },
      { id: "tc_2", type: "node", size: 6, level: 2 },
      { id: "tc_3", type: "node", size: 6, level: 2 },
      { id: "tc_4", type: "node", size: 6, level: 2 },
      { id: "bc_1", type: "node", size: 7, level: 3 },
      { id: "bc_2", type: "node", size: 6, level: 2 },
      { id: "bc_3", type: "node", size: 6, level: 2 },
      { id: "bc_4", type: "node", size: 6, level: 2 }
    ];

    networkNodes.forEach((node, index) => {
      let category: string;
      let name: string;
      let description: string;

      // Assign categories based on node position and type
      if (node.type === 'core') {
        category = 'leadership';
        name = techSkillNames.leadership[leadershipIndex % techSkillNames.leadership.length];
        description = techSkillDescriptions.leadership[leadershipIndex % techSkillDescriptions.leadership.length];
        leadershipIndex++;
      } else if (node.id.startsWith('tl_') || (node.type === 'cluster_center' && node.id === 'tl_1')) {
        category = 'engineering';
        name = techSkillNames.engineering[engineeringIndex % techSkillNames.engineering.length];
        description = techSkillDescriptions.engineering[engineeringIndex % techSkillDescriptions.engineering.length];
        engineeringIndex++;
      } else if (node.id.startsWith('tr_') || (node.type === 'cluster_center' && node.id === 'tr_1')) {
        category = 'product';
        name = techSkillNames.product[productIndex % techSkillNames.product.length];
        description = techSkillDescriptions.product[productIndex % techSkillDescriptions.product.length];
        productIndex++;
      } else if (node.id.startsWith('lm_') || (node.type === 'cluster_center' && node.id === 'lm_1')) {
        category = 'platform';
        name = techSkillNames.platform[platformIndex % techSkillNames.platform.length];
        description = techSkillDescriptions.platform[platformIndex % techSkillDescriptions.platform.length];
        platformIndex++;
      } else if (node.id.startsWith('rm_') || (node.type === 'cluster_center' && node.id === 'rm_1')) {
        category = 'communication';
        name = techSkillNames.communication[communicationIndex % techSkillNames.communication.length];
        description = techSkillDescriptions.communication[communicationIndex % techSkillDescriptions.communication.length];
        communicationIndex++;
      } else if (node.id.startsWith('bl_') || (node.type === 'cluster_center' && node.id === 'bl_1')) {
        category = 'process';
        name = techSkillNames.process[processIndex % techSkillNames.process.length];
        description = techSkillDescriptions.process[processIndex % techSkillDescriptions.process.length];
        processIndex++;
      } else if (node.id.startsWith('br_') || (node.type === 'cluster_center' && node.id === 'br_1')) {
        category = 'engineering';
        name = techSkillNames.engineering[engineeringIndex % techSkillNames.engineering.length];
        description = techSkillDescriptions.engineering[engineeringIndex % techSkillDescriptions.engineering.length];
        engineeringIndex++;
      } else {
        // Distribute other nodes across categories based on position
        const categoryIndex = index % 6;
        if (categoryIndex === 0) {
          category = 'engineering';
          name = techSkillNames.engineering[engineeringIndex % techSkillNames.engineering.length];
          description = techSkillDescriptions.engineering[engineeringIndex % techSkillDescriptions.engineering.length];
          engineeringIndex++;
        } else if (categoryIndex === 1) {
          category = 'product';
          name = techSkillNames.product[productIndex % techSkillNames.product.length];
          description = techSkillDescriptions.product[productIndex % techSkillDescriptions.product.length];
          productIndex++;
        } else if (categoryIndex === 2) {
          category = 'platform';
          name = techSkillNames.platform[platformIndex % techSkillNames.platform.length];
          description = techSkillDescriptions.platform[platformIndex % techSkillDescriptions.platform.length];
          platformIndex++;
        } else if (categoryIndex === 3) {
          category = 'communication';
          name = techSkillNames.communication[communicationIndex % techSkillNames.communication.length];
          description = techSkillDescriptions.communication[communicationIndex % techSkillDescriptions.communication.length];
          communicationIndex++;
        } else if (categoryIndex === 4) {
          category = 'process';
          name = techSkillNames.process[processIndex % techSkillNames.process.length];
          description = techSkillDescriptions.process[processIndex % techSkillDescriptions.process.length];
          processIndex++;
        } else {
          category = 'leadership';
          name = techSkillNames.leadership[leadershipIndex % techSkillNames.leadership.length];
          description = techSkillDescriptions.leadership[leadershipIndex % techSkillDescriptions.leadership.length];
          leadershipIndex++;
        }
      }

      const skill: Skill = {
        id: node.id,
        name,
        description,
        category,
        level: node.level,
        prerequisites: [], // Will be filled by connections
        sphere_cost: node.level * 2,
        activation_cost: node.level * 10,
        stat_bonuses: this.generateTechStatBonuses(category, node.level),
        xp_required: 0 // Will be calculated after skill creation
      };

      // Calculate XP requirement with progressive scaling
      skill.xp_required = calculateSkillXP(skill);
      skills.push(skill);
    });

    return skills;
  }

  private generateTechStatBonuses(category: string, level: number) {
    const baseBonus = level * 5;
    switch (category) {
      case 'engineering':
        return { technical_skill: baseBonus, problem_solving: baseBonus };
      case 'platform':
        return { technical_skill: baseBonus, system_thinking: baseBonus };
      case 'product':
        return { business_acumen: baseBonus, user_empathy: baseBonus };
      case 'communication':
        return { interpersonal: baseBonus, influence: baseBonus };
      case 'process':
        return { organization: baseBonus, efficiency: baseBonus };
      case 'leadership':
        return { 
          influence: Math.floor(baseBonus / 2), 
          strategic_thinking: baseBonus, 
          team_building: baseBonus 
        };
      default:
        return { general_competency: baseBonus };
    }
  }

  // Use same connection structure as FFX data
  private createConnectionsFromNetworkData(): SkillConnection[] {
    // Reuse the exact same network structure from FFX but with tech skills
    const networkEdges = [
      // Central hub internal connections
      { source: "central_1", target: "central_2" },
      { source: "central_1", target: "central_3" },
      { source: "central_1", target: "central_4" },
      { source: "central_1", target: "central_5" },
      { source: "central_2", target: "central_4" },
      { source: "central_3", target: "central_5" },
      
      // Cluster connections
      { source: "tl_1", target: "tl_2" },
      { source: "tl_1", target: "tl_3" },
      { source: "tl_1", target: "tl_4" },
      { source: "tl_1", target: "tl_5" },
      { source: "tl_1", target: "tl_6" },
      { source: "tl_1", target: "tl_7" },
      { source: "tl_1", target: "tl_8" },
      
      { source: "tr_1", target: "tr_2" },
      { source: "tr_1", target: "tr_3" },
      { source: "tr_1", target: "tr_4" },
      { source: "tr_1", target: "tr_5" },
      { source: "tr_1", target: "tr_6" },
      { source: "tr_1", target: "tr_7" },
      { source: "tr_1", target: "tr_8" },
      
      { source: "lm_1", target: "lm_2" },
      { source: "lm_1", target: "lm_3" },
      { source: "lm_1", target: "lm_4" },
      { source: "lm_1", target: "lm_5" },
      { source: "lm_1", target: "lm_6" },
      { source: "lm_1", target: "lm_7" },
      { source: "lm_1", target: "lm_8" },
      
      { source: "rm_1", target: "rm_2" },
      { source: "rm_1", target: "rm_3" },
      { source: "rm_1", target: "rm_4" },
      { source: "rm_1", target: "rm_5" },
      { source: "rm_1", target: "rm_6" },
      { source: "rm_1", target: "rm_7" },
      { source: "rm_1", target: "rm_8" },
      
      { source: "bl_1", target: "bl_2" },
      { source: "bl_1", target: "bl_3" },
      { source: "bl_1", target: "bl_4" },
      { source: "bl_1", target: "bl_5" },
      { source: "bl_1", target: "bl_6" },
      { source: "bl_1", target: "bl_7" },
      { source: "bl_1", target: "bl_8" },
      
      { source: "br_1", target: "br_2" },
      { source: "br_1", target: "br_3" },
      { source: "br_1", target: "br_4" },
      { source: "br_1", target: "br_5" },
      { source: "br_1", target: "br_6" },
      { source: "br_1", target: "br_7" },
      { source: "br_1", target: "br_8" },
      
      // Pathway connections to leadership
      { source: "tl_1", target: "path_1" },
      { source: "path_1", target: "central_1" },
      { source: "tr_1", target: "path_3" },
      { source: "path_3", target: "central_1" },
      { source: "lm_1", target: "path_6" },
      { source: "path_6", target: "central_1" },
      { source: "rm_1", target: "path_7" },
      { source: "path_7", target: "central_1" },
      { source: "bl_1", target: "path_5" },
      { source: "path_5", target: "central_1" },
      { source: "br_1", target: "path_4" },
      { source: "path_4", target: "central_1" },
      
      // Cross-functional connections
      { source: "tc_1", target: "path_2" },
      { source: "path_2", target: "central_5" },
      { source: "tc_2", target: "tc_1" },
      { source: "tc_3", target: "tc_1" },
      { source: "tc_4", target: "tc_1" },
      
      { source: "bc_1", target: "path_8" },
      { source: "path_8", target: "central_3" },
      { source: "bc_2", target: "bc_1" },
      { source: "bc_3", target: "bc_1" },
      { source: "bc_4", target: "bc_1" },
      
      // Foundation to specialization paths
      { source: "inter_1", target: "tl_8" },
      { source: "inter_1", target: "path_1" },
      { source: "inter_2", target: "tc_3" },
      { source: "inter_2", target: "path_2" },
      { source: "inter_3", target: "tr_8" },
      { source: "inter_3", target: "path_3" },
      { source: "inter_4", target: "rm_8" },
      { source: "inter_4", target: "path_7" },
      { source: "inter_5", target: "br_8" },
      { source: "inter_5", target: "path_4" },
      { source: "inter_6", target: "bc_4" },
      { source: "inter_6", target: "path_8" },
      { source: "inter_7", target: "bl_8" },
      { source: "inter_7", target: "path_5" },
      { source: "inter_8", target: "lm_8" },
      { source: "inter_8", target: "path_6" },
      { source: "inter_9", target: "tl_8" },
      { source: "inter_9", target: "lm_3" },
      { source: "inter_10", target: "tc_3" },
      { source: "inter_10", target: "tr_3" },
      
      // Entry-level connections
      { source: "scatter_1", target: "tl_7" },
      { source: "scatter_2", target: "tr_8" },
      { source: "scatter_3", target: "lm_7" },
      { source: "scatter_4", target: "rm_8" },
      { source: "scatter_5", target: "bl_7" },
      { source: "scatter_6", target: "tr_3" },
      { source: "scatter_7", target: "tc_3" },
      { source: "scatter_8", target: "bc_3" }
    ];

    return networkEdges.map((edge, index) => ({
      id: `tech_connection_${index}`,
      from: edge.source,
      to: edge.target,
      weight: 1
    }));
  }

  private createTechEmployees(): Employee[] {
    const techEmployees = [
      {
        id: 'sarah_kim',
        name: 'Sarah Kim',
        role: 'Staff Software Engineer',
        department: 'Platform Engineering',
        // Engineering-focused starting in top-left cluster
        mastered_skills: ['tl_1', 'tl_2', 'tl_3', 'tl_4', 'tl_5', 'tl_6', 'tl_7', 'tl_8'],
        current_xp: 3200,
        skill_points: 165,
        level: 32,
        images: {
          face: '',
          full_body: '',
          hi_res: ''
        },
        stats: {
          technical_skill: 75,
          problem_solving: 68,
          business_acumen: 25,
          interpersonal: 45,
          system_thinking: 62,
          user_empathy: 20
        }
      },
      {
        id: 'marcus_rodriguez',
        name: 'Marcus Rodriguez',
        role: 'Senior Product Manager',
        department: 'Product Development',
        // Product-focused starting in top-right cluster
        mastered_skills: ['tr_1', 'tr_2', 'tr_3', 'tr_4', 'tr_5', 'tr_6', 'tr_7', 'tr_8'],
        current_xp: 2980,
        skill_points: 156,
        level: 30,
        images: {
          face: '',
          full_body: '',
          hi_res: ''
        },
        stats: {
          business_acumen: 78,
          user_empathy: 72,
          technical_skill: 35,
          interpersonal: 65,
          strategic_thinking: 58,
          influence: 55
        }
      },
      {
        id: 'priya_patel',
        name: 'Priya Patel',
        role: 'DevOps Lead',
        department: 'Platform Operations',
        // Platform-focused starting in left-middle cluster
        mastered_skills: ['lm_1', 'lm_2', 'lm_3', 'lm_4', 'lm_5', 'lm_6', 'lm_7', 'lm_8'],
        current_xp: 4100,
        skill_points: 182,
        level: 35,
        images: {
          face: '',
          full_body: '',
          hi_res: ''
        },
        stats: {
          technical_skill: 82,
          system_thinking: 78,
          problem_solving: 70,
          organization: 68,
          interpersonal: 52,
          business_acumen: 38
        }
      },
      {
        id: 'james_chen',
        name: 'James Chen',
        role: 'Engineering Manager',
        department: 'Software Development',
        // Communication-focused starting in right-middle cluster
        mastered_skills: ['rm_1', 'rm_2', 'rm_3', 'rm_4', 'rm_5', 'rm_6', 'rm_7', 'rm_8'],
        current_xp: 3650,
        skill_points: 174,
        level: 33,
        images: {
          face: '',
          full_body: '',
          hi_res: ''
        },
        stats: {
          interpersonal: 85,
          influence: 72,
          technical_skill: 58,
          team_building: 68,
          strategic_thinking: 45,
          organization: 55
        }
      },
      {
        id: 'alexandra_white',
        name: 'Alexandra White',
        role: 'Scrum Master',
        department: 'Delivery Management',
        // Process-focused starting in bottom-left cluster
        mastered_skills: ['bl_1', 'bl_2', 'bl_3', 'bl_4', 'bl_5', 'bl_6', 'bl_7', 'bl_8'],
        current_xp: 2450,
        skill_points: 142,
        level: 28,
        images: {
          face: '',
          full_body: '',
          hi_res: ''
        },
        stats: {
          organization: 88,
          efficiency: 82,
          interpersonal: 75,
          team_building: 65,
          influence: 48,
          technical_skill: 28
        }
      },
      {
        id: 'david_johnson',
        name: 'David Johnson',
        role: 'Principal Architect',
        department: 'Architecture & Design',
        // Advanced engineering starting in bottom-right cluster
        mastered_skills: ['br_1', 'br_2', 'br_3', 'br_4', 'br_5', 'br_6', 'br_7', 'br_8'],
        current_xp: 5200,
        skill_points: 198,
        level: 38,
        images: {
          face: '',
          full_body: '',
          hi_res: ''
        },
        stats: {
          technical_skill: 95,
          system_thinking: 88,
          strategic_thinking: 72,
          problem_solving: 85,
          interpersonal: 58,
          influence: 65
        }
      },
      {
        id: 'lisa_martinez',
        name: 'Lisa Martinez',
        role: 'UX Research Lead',
        department: 'User Experience',
        // Cross-functional skills starting in scattered area
        mastered_skills: ['scatter_1', 'scatter_2', 'scatter_3', 'scatter_4', 'scatter_5', 'scatter_6', 'scatter_7', 'scatter_8'],
        current_xp: 2150,
        skill_points: 134,
        level: 26,
        images: {
          face: '',
          full_body: '',
          hi_res: ''
        },
        stats: {
          user_empathy: 92,
          business_acumen: 68,
          interpersonal: 75,
          analytical_thinking: 72,
          technical_skill: 35,
          influence: 58
        }
      },
      {
        id: 'robert_taylor',
        name: 'Robert Taylor',
        role: 'VP of Engineering',
        department: 'Executive Leadership',
        // Leadership starting in central area
        mastered_skills: ['central_2', 'central_3', 'path_1', 'path_2', 'tc_1', 'tc_2', 'tc_3', 'tc_4'],
        current_xp: 8500,
        skill_points: 275,
        level: 45,
        images: {
          face: '',
          full_body: '',
          hi_res: ''
        },
        stats: {
          strategic_thinking: 95,
          influence: 88,
          team_building: 85,
          business_acumen: 78,
          technical_skill: 65,
          interpersonal: 82
        }
      }
    ];

    // Expand mastered skills using graph analysis
    if (this.graphAnalyzer) {
      return techEmployees.map(employee => ({
        ...employee,
        mastered_skills: expandMasteredSkills(employee, this.graphAnalyzer!, 3)
      }));
    }

    return techEmployees;
  }

  // All service methods remain the same as FFX implementation
  async connect(): Promise<void> {
    if (!this.initialized) {
      this.initializeData();
      console.log('Tech Skills service connected with technology organization data');
    }
  }

  async close(): Promise<void> {
    this.skills = [];
    this.connections = [];
    this.employees = [];
    this.initialized = false;
    console.log('Tech Skills service connection closed');
  }

  async getAllSkills(): Promise<Skill[]> {
    return this.skills;
  }

  async getSkillConnections(): Promise<SkillConnection[]> {
    return this.connections;
  }

  async getAllEmployees(): Promise<Employee[]> {
    return this.employees;
  }

  async getSkillById(id: string): Promise<Skill | null> {
    return this.skills.find(skill => skill.id === id) || null;
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    return this.employees.find(emp => emp.id === id) || null;
  }

  async getSkillsByCategory(category: string): Promise<Skill[]> {
    return this.skills.filter(skill => skill.category === category);
  }

  async getSkillsByLevel(level: number): Promise<Skill[]> {
    return this.skills.filter(skill => skill.level === level);
  }

  async getEmployeeSkills(employeeId: string): Promise<Skill[]> {
    const employee = await this.getEmployeeById(employeeId);
    if (!employee) return [];
    
    return this.skills.filter(skill => 
      employee.mastered_skills.includes(skill.id)
    );
  }

  async getSkillPrerequisites(skillId: string): Promise<Skill[]> {
    const connections = this.connections.filter(conn => conn.to === skillId);
    const prerequisiteIds = connections.map(conn => conn.from);
    return this.skills.filter(skill => prerequisiteIds.includes(skill.id));
  }

  async getSkillDependents(skillId: string): Promise<Skill[]> {
    const connections = this.connections.filter(conn => conn.from === skillId);
    const dependentIds = connections.map(conn => conn.to);
    return this.skills.filter(skill => dependentIds.includes(skill.id));
  }

  async getAvailableSkills(employeeId: string): Promise<Skill[]> {
    if (!this.graphAnalyzer) return [];

    const employee = await this.getEmployeeById(employeeId);
    if (!employee) return [];

    const availableSkillIds = this.graphAnalyzer.getAvailableNextSkills(employee.mastered_skills);
    
    return this.skills.filter(skill => 
      availableSkillIds.includes(skill.id)
    );
  }

  async getSkillRecommendations(employeeId: string, goalSkillId?: string): Promise<{ skill: Skill; priority: string; reason: string; prerequisites: Skill[] }[]> {
    if (!this.graphAnalyzer) return [];

    const employee = await this.getEmployeeById(employeeId);
    if (!employee) return [];

    // Use goal-directed recommendations if goal is provided
    if (goalSkillId) {
      const goalRecommendations = this.graphAnalyzer.getGoalDirectedRecommendations(
        employee.mastered_skills,
        goalSkillId,
        20
      );
      
      return goalRecommendations
        .map(rec => {
          const skill = this.skills.find(s => s.id === rec.skillId);
          if (!skill) return null;
          
          const prerequisiteSkills = this.connections
            .filter(conn => conn.to === rec.skillId)
            .map(conn => this.skills.find(s => s.id === conn.from))
            .filter((s): s is Skill => s !== undefined);
          
          return {
            skill,
            priority: rec.priority,
            reason: rec.reason,
            prerequisites: prerequisiteSkills
          };
        })
        .filter((rec): rec is { skill: Skill; priority: string; reason: string; prerequisites: Skill[] } => rec !== null);
    }

    // Standard recommendations
    const availableSkills = this.graphAnalyzer.getAvailableNextSkills(employee.mastered_skills);
    
    return availableSkills
      .map(skillId => {
        const skill = this.skills.find(s => s.id === skillId);
        if (!skill) return null;

        const prerequisiteSkills = this.connections
          .filter(conn => conn.to === skillId)
          .map(conn => this.skills.find(s => s.id === conn.from))
          .filter((s): s is Skill => s !== undefined);

        let priority = 'medium';
        if (skill.level <= 2) priority = 'high';
        else if (skill.level >= 4) priority = 'low';

        return {
          skill,
          priority,
          reason: this.generateTechRecommendationReason(skill, employee),
          prerequisites: prerequisiteSkills
        };
      })
      .filter((rec): rec is { skill: Skill; priority: string; reason: string; prerequisites: Skill[] } => rec !== null);
  }

  private generateTechRecommendationReason(skill: Skill, employee: Employee): string {
    const reasons = [
      `Enhances your ${skill.category} capabilities as a ${employee.role}`,
      `Natural career progression for your ${employee.department} role`,
      `Builds on your existing expertise in ${skill.category}`,
      `Unlocks advanced opportunities in ${skill.category}`,
      `Develops cross-functional skills valuable for senior roles`,
      `Strengthens your leadership potential in technology`,
      `Improves team collaboration and delivery effectiveness`
    ];
    
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  async learnSkill(employeeId: string, skillId: string): Promise<Employee | null> {
    const employee = await this.getEmployeeById(employeeId);
    const skill = await this.getSkillById(skillId);
    
    if (!employee || !skill) return null;
    
    if ((employee.current_xp || 0) < skill.xp_required) {
      throw new Error('Insufficient XP to learn this skill');
    }
    
    if (employee.mastered_skills.includes(skillId)) {
      throw new Error('Skill already mastered');
    }
    
    const updatedEmployee = {
      ...employee,
      mastered_skills: [...employee.mastered_skills, skillId],
      current_xp: (employee.current_xp || 0) - skill.xp_required
    };
    
    const employeeIndex = this.employees.findIndex(emp => emp.id === employeeId);
    if (employeeIndex !== -1) {
      this.employees[employeeIndex] = updatedEmployee;
      this.saveEmployeesToStorage();
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('employeeDataChanged', { 
          detail: { employeeId, updatedEmployee } 
        }));
      }
    }
    
    return updatedEmployee;
  }

  async resetEmployeeSkills(employeeId: string): Promise<Employee | null> {
    const employeeIndex = this.employees.findIndex(emp => emp.id === employeeId);
    if (employeeIndex === -1) {
      return null;
    }

    const initialEmployees = this.createTechEmployees();
    const initialEmployee = initialEmployees.find(emp => emp.id === employeeId);
    
    if (!initialEmployee) {
      return null;
    }

    this.employees[employeeIndex] = {
      ...this.employees[employeeIndex],
      mastered_skills: initialEmployee.mastered_skills,
      current_xp: initialEmployee.current_xp,
      skill_points: initialEmployee.skill_points,
      level: initialEmployee.level,
      stats: initialEmployee.stats
    };

    this.saveEmployeesToStorage();
    
    console.log(`🔄 Reset skills for tech employee ${employeeId} to starter set`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('employeeDataChanged', { 
        detail: { employeeId, updatedEmployee: this.employees[employeeIndex] } 
      }));
    }

    return this.employees[employeeIndex];
  }

  async resetEmployeeData(): Promise<void> {
    this.clearStoredEmployees();
    this.employees = this.createTechEmployees();
    this.saveEmployeesToStorage();
    console.log('🔄 Tech employee data reset to initial state');
  }

  getStorageKey(): string {
    return this.STORAGE_KEY;
  }
}

export default TechSkillsService;