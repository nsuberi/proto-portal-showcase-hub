import { Skill, Employee, SkillConnection, QuizResult, SkillRecommendation } from '../types';

// Mock data for skills
const mockSkills: Skill[] = [
  // Combat Skills
  { id: 'attack', name: 'Attack', category: 'combat', level: 1, description: 'Basic physical attack' },
  { id: 'defend', name: 'Defend', category: 'combat', level: 1, description: 'Basic defensive stance' },
  { id: 'fire', name: 'Fire', category: 'magic', level: 1, description: 'Basic fire magic' },
  { id: 'cure', name: 'Cure', category: 'magic', level: 1, description: 'Basic healing magic' },
  { id: 'haste', name: 'Haste', category: 'support', level: 2, description: 'Speed enhancement spell' },
  { id: 'slow', name: 'Slow', category: 'support', level: 2, description: 'Speed reduction spell' },
  { id: 'fira', name: 'Fira', category: 'magic', level: 2, description: 'Advanced fire magic' },
  { id: 'cura', name: 'Cura', category: 'magic', level: 2, description: 'Advanced healing magic' },
  { id: 'protect', name: 'Protect', category: 'support', level: 3, description: 'Defense enhancement' },
  { id: 'shell', name: 'Shell', category: 'support', level: 3, description: 'Magic defense enhancement' },
  { id: 'firaga', name: 'Firaga', category: 'magic', level: 3, description: 'Master fire magic' },
  { id: 'curaga', name: 'Curaga', category: 'magic', level: 3, description: 'Master healing magic' },
  { id: 'reflect', name: 'Reflect', category: 'special', level: 4, description: 'Magic reflection' },
  { id: 'gravity', name: 'Gravity', category: 'special', level: 4, description: 'Gravity magic' },
  { id: 'ultima', name: 'Ultima', category: 'advanced', level: 5, description: 'Ultimate magic' },
  { id: 'holy', name: 'Holy', category: 'advanced', level: 5, description: 'Divine magic' },
];

// Mock data for skill connections (prerequisites)
const mockSkillConnections: SkillConnection[] = [
  { from: 'attack', to: 'fira' },
  { from: 'fire', to: 'fira' },
  { from: 'fira', to: 'firaga' },
  { from: 'cure', to: 'cura' },
  { from: 'cura', to: 'curaga' },
  { from: 'haste', to: 'protect' },
  { from: 'slow', to: 'shell' },
  { from: 'firaga', to: 'ultima' },
  { from: 'curaga', to: 'holy' },
];

// Mock data for employees
const mockEmployees: Employee[] = [
  {
    id: 'emp1',
    name: 'Tidus',
    role: 'Warrior',
    mastered_skills: ['attack', 'defend', 'haste', 'firaga'],
    quizCompleted: false,
    quizConfidence: 0
  },
  {
    id: 'emp2',
    name: 'Yuna',
    role: 'Mage',
    mastered_skills: ['cure', 'cura', 'curaga', 'holy', 'reflect'],
    quizCompleted: false,
    quizConfidence: 0
  },
  {
    id: 'emp3',
    name: 'Auron',
    role: 'Guardian',
    mastered_skills: ['attack', 'protect', 'shell', 'gravity'],
    quizCompleted: false,
    quizConfidence: 0
  },
  {
    id: 'emp4',
    name: 'Lulu',
    role: 'Black Mage',
    mastered_skills: ['fire', 'fira', 'firaga', 'ultima'],
    quizCompleted: false,
    quizConfidence: 0
  },
  {
    id: 'emp5',
    name: 'Wakka',
    role: 'Ranger',
    mastered_skills: ['attack', 'haste', 'slow', 'protect'],
    quizCompleted: false,
    quizConfidence: 0
  },
  {
    id: 'emp6',
    name: 'Kimahri',
    role: 'Blue Mage',
    mastered_skills: ['cure', 'shell', 'gravity', 'reflect'],
    quizCompleted: false,
    quizConfidence: 0
  },
  {
    id: 'emp7',
    name: 'Rikku',
    role: 'Alchemist',
    mastered_skills: ['haste', 'slow', 'cura', 'protect', 'shell'],
    quizCompleted: false,
    quizConfidence: 0
  },
  {
    id: 'emp8',
    name: 'Seymour',
    role: 'Dark Mage',
    mastered_skills: ['fire', 'fira', 'firaga', 'ultima', 'holy'],
    quizCompleted: false,
    quizConfidence: 0
  }
];

class MockNeo4jService {
  async connect() {
    console.log('Connected to Mock Neo4j Service');
  }

  async close() {
    console.log('Disconnected from Mock Neo4j Service');
  }

  async getAllSkills(): Promise<Skill[]> {
    return mockSkills;
  }

  async getAllEmployees(): Promise<Employee[]> {
    return mockEmployees;
  }

  async getSkillConnections(): Promise<SkillConnection[]> {
    return mockSkillConnections;
  }

  async getSkillsByCategory(category: string): Promise<Skill[]> {
    return mockSkills.filter(skill => skill.category === category);
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    return mockEmployees.find(emp => emp.id === id) || null;
  }

  async getEmployeeSkills(employeeId: string): Promise<Skill[]> {
    const employee = mockEmployees.find(emp => emp.id === employeeId);
    if (!employee) return [];
    
    return mockSkills.filter(skill => employee.mastered_skills.includes(skill.id));
  }

  async getAvailableSkills(employeeId: string): Promise<Skill[]> {
    const employee = mockEmployees.find(emp => emp.id === employeeId);
    if (!employee) return [];

    const masteredSkillIds = new Set(employee.mastered_skills);
    
    return mockSkills.filter(skill => {
      if (masteredSkillIds.has(skill.id)) return false;
      
      // Check if all prerequisites are mastered
      const prerequisites = mockSkillConnections
        .filter(conn => conn.to === skill.id)
        .map(conn => conn.from);
      
      return prerequisites.length === 0 || 
             prerequisites.every(prereq => masteredSkillIds.has(prereq));
    });
  }

  async getSkillRecommendations(employeeId: string): Promise<SkillRecommendation[]> {
    const availableSkills = await this.getAvailableSkills(employeeId);
    const employee = mockEmployees.find(emp => emp.id === employeeId);
    
    return availableSkills.map(skill => {
      const prerequisites = mockSkillConnections
        .filter(conn => conn.to === skill.id)
        .map(conn => mockSkills.find(s => s.id === conn.from)!)
        .filter(Boolean);

      const categoryCount = employee?.mastered_skills.filter(skillId => 
        mockSkills.find(s => s.id === skillId)?.category === skill.category
      ).length || 0;

      let priority: 'high' | 'medium' | 'low' = 'medium';
      if (skill.level <= 2) priority = 'high';
      else if (skill.level >= 5) priority = 'low';

      let reason = `Level ${skill.level} ${skill.category} skill`;
      if (categoryCount > 0) {
        reason += ` - You already have ${categoryCount} ${skill.category} skills`;
      }

      return {
        skill,
        reason,
        priority,
        prerequisites
      };
    }).sort((a, b) => {
      // Sort by priority, then by level, then by category count
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      const levelDiff = a.skill.level - b.skill.level;
      if (levelDiff !== 0) return levelDiff;
      
      return b.prerequisites.length - a.prerequisites.length;
    }).slice(0, 10);
  }

  async saveQuizResults(quizResult: QuizResult): Promise<void> {
    const employeeIndex = mockEmployees.findIndex(emp => emp.id === quizResult.employeeId);
    if (employeeIndex !== -1) {
      mockEmployees[employeeIndex].quizCompleted = true;
      mockEmployees[employeeIndex].quizConfidence = quizResult.confidence;
      mockEmployees[employeeIndex].mastered_skills = [
        ...new Set([...mockEmployees[employeeIndex].mastered_skills, ...quizResult.inferredSkills])
      ];
    }
  }

  async getGraphData(): Promise<any> {
    return {
      nodes: mockSkills.map(skill => ({
        id: skill.id,
        label: skill.name,
        category: skill.category,
        level: skill.level
      })),
      edges: mockSkillConnections.map(conn => ({
        from: conn.from,
        to: conn.to,
        type: 'prerequisite'
      }))
    };
  }

  async getSkillStatistics(): Promise<any> {
    // Calculate statistics by category
    const categoryStats = mockSkills.reduce((acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = {
          category: skill.category,
          totalSkills: 0,
          masteredCount: 0,
          totalLevel: 0
        };
      }
      acc[skill.category].totalSkills += 1;
      acc[skill.category].totalLevel += skill.level;
      return acc;
    }, {} as Record<string, any>);

    // Calculate mastered skills by category
    mockEmployees.forEach(employee => {
      employee.mastered_skills.forEach(skillId => {
        const skill = mockSkills.find(s => s.id === skillId);
        if (skill && categoryStats[skill.category]) {
          categoryStats[skill.category].masteredCount += 1;
        }
      });
    });

    // Convert to array format expected by Dashboard
    return Object.values(categoryStats).map((stat: any) => ({
      category: stat.category,
      totalSkills: stat.totalSkills,
      masteredCount: stat.masteredCount,
      avgLevel: stat.totalLevel / stat.totalSkills
    }));
  }

  /**
   * Reset skills for a specific employee to their initial starter set
   * @param employeeId - The ID of the employee to reset
   * @returns Updated employee data
   */
  async resetEmployeeSkills(employeeId: string): Promise<Employee | null> {
    const employeeIndex = mockEmployees.findIndex(emp => emp.id === employeeId);
    if (employeeIndex === -1) {
      return null;
    }

    // Define initial/starter skills for each employee
    const initialSkillSets: Record<string, string[]> = {
      'emp1': ['attack', 'defend'],
      'emp2': ['cure', 'fire'],
      'emp3': ['haste', 'slow']
    };

    const initialSkills = initialSkillSets[employeeId] || ['attack'];
    
    // Reset the employee's skills to the initial starter set
    mockEmployees[employeeIndex] = {
      ...mockEmployees[employeeIndex],
      mastered_skills: initialSkills,
      quizCompleted: false,
      quizConfidence: 0
    };

    console.log(`🔄 Reset skills for employee ${employeeId} to starter set`);

    return mockEmployees[employeeIndex];
  }
}

export default MockNeo4jService; 