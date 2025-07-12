export interface Skill {
  id: string;
  name: string;
  description: string;
  level: number;
  category: 'combat' | 'magic' | 'support' | 'special' | 'advanced';
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  mastered_skills: string[];
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