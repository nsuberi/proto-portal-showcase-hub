export interface Skill {
  id: string;
  name: string;
  description: string;
  level: number;
  category: 'combat' | 'magic' | 'support' | 'special' | 'advanced';
  xp_required: number;
  prerequisites?: string[];
  sphere_cost?: number;
  activation_cost?: number;
  stat_bonuses?: Record<string, number>;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  mastered_skills: string[];
  current_xp?: number;
  skill_points?: number;
  level?: number;
  stats?: Record<string, number>;
}

export interface SkillConnection {
  from: string;
  to: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    skills: string[];
  }[];
  category: string;
}

export interface QuizResult {
  employeeId: string;
  answers: {
    questionId: string;
    selectedOptionId: string;
  }[];
  inferredSkills: string[];
  confidence: number;
}

export interface SkillRecommendation {
  skill: Skill;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  prerequisites: Skill[];
}

export interface GraphData {
  nodes: {
    id: string;
    label: string;
    type: 'skill' | 'employee';
    properties: Skill | Employee;
  }[];
  relationships: {
    source: string;
    target: string;
    type: 'PREREQUISITE' | 'MASTERED';
  }[];
} 