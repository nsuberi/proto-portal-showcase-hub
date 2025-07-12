import { QuizQuestion } from '../types';

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'How do you typically approach debugging a problem?',
    category: 'problem-solving',
    options: [
      {
        id: 'q1_a',
        text: 'I systematically trace through the code step by step',
        skills: ['attack', 'power_break', 'mental_break']
      },
      {
        id: 'q1_b',
        text: 'I use debugging tools and breakpoints to isolate issues',
        skills: ['item', 'steal', 'use', 'throw']
      },
      {
        id: 'q1_c',
        text: 'I rely on logging and monitoring to understand the problem',
        skills: ['cure', 'esuna', 'haste', 'protect']
      },
      {
        id: 'q1_d',
        text: 'I analyze the system architecture and data flow',
        skills: ['fire', 'ice', 'thunder', 'water']
      }
    ]
  },
  {
    id: 'q2',
    question: 'When working on a team project, what role do you usually take?',
    category: 'teamwork',
    options: [
      {
        id: 'q2_a',
        text: 'I lead the technical direction and architecture decisions',
        skills: ['attack', 'power_break', 'armor_break', 'quick_hit']
      },
      {
        id: 'q2_b',
        text: 'I focus on implementing features and writing clean code',
        skills: ['item', 'steal', 'mug', 'use', 'throw']
      },
      {
        id: 'q2_c',
        text: 'I ensure code quality and help team members with issues',
        skills: ['cure', 'cura', 'esuna', 'haste', 'protect', 'shell']
      },
      {
        id: 'q2_d',
        text: 'I handle the build process and deployment infrastructure',
        skills: ['fire', 'fira', 'ice', 'blizzara', 'thunder', 'thundara']
      }
    ]
  },
  {
    id: 'q3',
    question: 'How do you handle performance optimization?',
    category: 'optimization',
    options: [
      {
        id: 'q3_a',
        text: 'I profile the code to identify bottlenecks and optimize them',
        skills: ['attack', 'power_break', 'mental_break', 'magic_break']
      },
      {
        id: 'q3_b',
        text: 'I use caching and efficient data structures',
        skills: ['item', 'steal', 'quick_pockets', 'use']
      },
      {
        id: 'q3_c',
        text: 'I implement monitoring and alerting systems',
        skills: ['cure', 'cura', 'curaga', 'auto_regen']
      },
      {
        id: 'q3_d',
        text: 'I optimize database queries and data processing',
        skills: ['fire', 'fira', 'firaga', 'ice', 'blizzara', 'blizzaga']
      }
    ]
  },
  {
    id: 'q4',
    question: 'What\'s your approach to learning new technologies?',
    category: 'learning',
    options: [
      {
        id: 'q4_a',
        text: 'I dive deep into the documentation and source code',
        skills: ['attack', 'power_break', 'armor_break', 'delay_attack']
      },
      {
        id: 'q4_b',
        text: 'I experiment with small projects and examples',
        skills: ['item', 'steal', 'mug', 'use', 'throw', 'cheer']
      },
      {
        id: 'q4_c',
        text: 'I take online courses and follow structured learning paths',
        skills: ['cure', 'cura', 'esuna', 'haste', 'slow', 'focus']
      },
      {
        id: 'q4_d',
        text: 'I attend conferences and workshops',
        skills: ['fire', 'fira', 'ice', 'blizzara', 'thunder', 'thundara', 'water', 'watera']
      }
    ]
  },
  {
    id: 'q5',
    question: 'How do you handle security in your applications?',
    category: 'security',
    options: [
      {
        id: 'q5_a',
        text: 'I implement authentication and authorization systems',
        skills: ['attack', 'power_break', 'armor_break', 'silence_attack']
      },
      {
        id: 'q5_b',
        text: 'I use security tools and conduct regular audits',
        skills: ['item', 'steal', 'mug', 'use', 'throw', 'aim']
      },
      {
        id: 'q5_c',
        text: 'I follow security best practices and coding standards',
        skills: ['cure', 'esuna', 'protect', 'shell', 'ribbon']
      },
      {
        id: 'q5_d',
        text: 'I implement encryption and secure communication protocols',
        skills: ['fire', 'fira', 'firaga', 'ice', 'blizzara', 'blizzaga', 'doublecast']
      }
    ]
  },
  {
    id: 'q6',
    question: 'What\'s your preferred way of handling errors and exceptions?',
    category: 'error-handling',
    options: [
      {
        id: 'q6_a',
        text: 'I implement comprehensive error handling and logging',
        skills: ['attack', 'power_break', 'mental_break', 'magic_break']
      },
      {
        id: 'q6_b',
        text: 'I use try-catch blocks and graceful degradation',
        skills: ['item', 'steal', 'use', 'throw', 'reflex']
      },
      {
        id: 'q6_c',
        text: 'I create user-friendly error messages and recovery options',
        skills: ['cure', 'cura', 'curaga', 'esuna', 'auto_life']
      },
      {
        id: 'q6_d',
        text: 'I implement circuit breakers and fallback mechanisms',
        skills: ['fire', 'fira', 'ice', 'blizzara', 'thunder', 'thundara', 'water', 'watera']
      }
    ]
  },
  {
    id: 'q7',
    question: 'How do you approach testing your code?',
    category: 'testing',
    options: [
      {
        id: 'q7_a',
        text: 'I write comprehensive unit tests for all functions',
        skills: ['attack', 'power_break', 'armor_break', 'quick_hit']
      },
      {
        id: 'q7_b',
        text: 'I use automated testing tools and CI/CD pipelines',
        skills: ['item', 'steal', 'mug', 'use', 'throw', 'quick_pockets']
      },
      {
        id: 'q7_c',
        text: 'I perform manual testing and user acceptance testing',
        skills: ['cure', 'cura', 'esuna', 'haste', 'protect', 'shell']
      },
      {
        id: 'q7_d',
        text: 'I implement integration tests and end-to-end testing',
        skills: ['fire', 'fira', 'firaga', 'ice', 'blizzara', 'blizzaga', 'doublecast']
      }
    ]
  },
  {
    id: 'q8',
    question: 'What\'s your approach to code documentation?',
    category: 'documentation',
    options: [
      {
        id: 'q8_a',
        text: 'I write detailed technical documentation and API docs',
        skills: ['attack', 'power_break', 'mental_break', 'delay_attack']
      },
      {
        id: 'q8_b',
        text: 'I use inline comments and self-documenting code',
        skills: ['item', 'steal', 'use', 'throw', 'cheer', 'focus']
      },
      {
        id: 'q8_c',
        text: 'I create user guides and tutorials',
        skills: ['cure', 'cura', 'esuna', 'haste', 'slow', 'aim']
      },
      {
        id: 'q8_d',
        text: 'I maintain architecture diagrams and system documentation',
        skills: ['fire', 'fira', 'ice', 'blizzara', 'thunder', 'thundara', 'water', 'watera']
      }
    ]
  },
  {
    id: 'q9',
    question: 'How do you handle data management and storage?',
    category: 'data-management',
    options: [
      {
        id: 'q9_a',
        text: 'I design efficient database schemas and optimize queries',
        skills: ['attack', 'power_break', 'armor_break', 'magic_break']
      },
      {
        id: 'q9_b',
        text: 'I implement caching and data validation',
        skills: ['item', 'steal', 'mug', 'use', 'throw', 'reflex']
      },
      {
        id: 'q9_c',
        text: 'I ensure data integrity and backup systems',
        skills: ['cure', 'cura', 'curaga', 'protect', 'shell', 'auto_regen']
      },
      {
        id: 'q9_d',
        text: 'I work with big data and distributed systems',
        skills: ['fire', 'fira', 'firaga', 'ice', 'blizzara', 'blizzaga', 'thunder', 'thundaga', 'doublecast']
      }
    ]
  },
  {
    id: 'q10',
    question: 'What\'s your preferred development methodology?',
    category: 'methodology',
    options: [
      {
        id: 'q10_a',
        text: 'I follow Agile/Scrum with regular sprints and retrospectives',
        skills: ['attack', 'power_break', 'armor_break', 'quick_hit', 'delay_attack']
      },
      {
        id: 'q10_b',
        text: 'I use Test-Driven Development and continuous integration',
        skills: ['item', 'steal', 'mug', 'use', 'throw', 'quick_pockets']
      },
      {
        id: 'q10_c',
        text: 'I focus on user-centered design and feedback loops',
        skills: ['cure', 'cura', 'curaga', 'esuna', 'haste', 'protect', 'shell']
      },
      {
        id: 'q10_d',
        text: 'I work with DevOps and infrastructure as code',
        skills: ['fire', 'fira', 'firaga', 'ice', 'blizzara', 'blizzaga', 'thunder', 'thundaga', 'water', 'waterga', 'doublecast']
      }
    ]
  }
];

export function calculateInferredSkills(answers: { questionId: string; selectedOptionId: string }[]): string[] {
  const skillCounts = new Map<string, number>();
  
  answers.forEach(answer => {
    const question = quizQuestions.find(q => q.id === answer.questionId);
    const option = question?.options.find(o => o.id === answer.selectedOptionId);
    
    if (option) {
      option.skills.forEach(skillId => {
        skillCounts.set(skillId, (skillCounts.get(skillId) || 0) + 1);
      });
    }
  });
  
  // Return skills that appear in at least 2 answers (indicating strong evidence)
  return Array.from(skillCounts.entries())
    .filter(([_, count]) => count >= 2)
    .map(([skillId, _]) => skillId);
}

export function calculateConfidence(answers: { questionId: string; selectedOptionId: string }[]): number {
  const totalQuestions = quizQuestions.length;
  const answeredQuestions = answers.length;
  
  // Base confidence on completion rate
  let confidence = (answeredQuestions / totalQuestions) * 100;
  
  // Bonus for consistency in answers (same skill categories)
  const skillCounts = new Map<string, number>();
  answers.forEach(answer => {
    const question = quizQuestions.find(q => q.id === answer.questionId);
    const option = question?.options.find(o => o.id === answer.selectedOptionId);
    
    if (option) {
      option.skills.forEach(skillId => {
        skillCounts.set(skillId, (skillCounts.get(skillId) || 0) + 1);
      });
    }
  });
  
  const maxSkillCount = Math.max(...Array.from(skillCounts.values()));
  const consistencyBonus = Math.min(maxSkillCount * 5, 20); // Up to 20% bonus
  
  return Math.min(confidence + consistencyBonus, 100);
} 