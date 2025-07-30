// Home Lending Learning Application Types

export interface FlowMapNode {
  id: string;
  title: string;
  description: string;
  category: 'preparation' | 'application' | 'processing' | 'underwriting' | 'closing';
  position: { x: number; y: number };
  connections: string[];
  glossaryTerms: string[];
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: 'general' | 'legal' | 'financial' | 'process';
  relatedTerms: string[];
  flowMapNodes: string[];
  examples?: string[];
}

export interface StudyCard {
  id: string;
  question: string;
  answer: string;
  category: 'terminology' | 'process' | 'requirements' | 'regulations';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  glossaryTerms: string[];
  flowMapNodes: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  knownTerms: string[];
  completedCards: string[];
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  learningGoals: string[];
  createdAt: Date;
  lastActive: Date;
}

export interface LearningProgress {
  userId: string;
  termId: string;
  mastered: boolean;
  attempts: number;
  lastAttempt: Date;
  confidence: number; // 1-5 scale
}

export interface Document {
  id: string;
  title: string;
  source: 'fannie-mae' | 'freddie-mac' | 'general';
  url: string;
  summary: string;
  relevantTerms: string[];
  category: 'guide' | 'regulation' | 'form' | 'reference';
}

export interface ProcessPersona {
  id: string;
  title: string;
  description: string;
  responsibilities: string[];
  reviewsDocuments: string[];
  processStages: string[];
}

export interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  category: 'borrower-provided' | 'professional-obtained' | 'process-generated';
  requiredFor: string[];
  reviewedBy: string[];
  whenNeeded: string;
  tips: string;
}