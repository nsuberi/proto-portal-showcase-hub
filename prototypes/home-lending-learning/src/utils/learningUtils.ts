import { UserProfile, StudyCard, GlossaryTerm, LearningProgress } from '../types';

export function calculateUserLevel(profile: UserProfile): 'beginner' | 'intermediate' | 'advanced' {
  const knownTermsCount = profile.knownTerms.length;
  const completedCardsCount = profile.completedCards.length;
  
  if (knownTermsCount >= 30 && completedCardsCount >= 15) {
    return 'advanced';
  } else if (knownTermsCount >= 15 && completedCardsCount >= 8) {
    return 'intermediate';
  } else {
    return 'beginner';
  }
}

export function getNextCards(
  profile: UserProfile,
  allCards: StudyCard[],
  limit: number = 5,
  excludeCardId?: string
): StudyCard[] {
  const userLevel = calculateUserLevel(profile);
  const completedCardIds = new Set(profile.completedCards);
  
  // Filter cards based on user level and completion status
  const availableCards = allCards.filter(card => {
    if (completedCardIds.has(card.id)) return false;
    if (excludeCardId && card.id === excludeCardId) return false; // Exclude current card
    
    // Include cards at or below user level
    const cardLevels = ['beginner', 'intermediate', 'advanced'];
    const userLevelIndex = cardLevels.indexOf(userLevel);
    const cardLevelIndex = cardLevels.indexOf(card.difficulty);
    
    return cardLevelIndex <= userLevelIndex + 1; // Allow one level above
  });
  
  // Shuffle the available cards for random selection
  for (let i = availableCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableCards[i], availableCards[j]] = [availableCards[j], availableCards[i]];
  }
  
  return availableCards.slice(0, limit);
}

export function getRelatedTerms(
  termId: string,
  allTerms: GlossaryTerm[]
): GlossaryTerm[] {
  const term = allTerms.find(t => t.id === termId);
  if (!term) return [];
  
  return allTerms.filter(t => 
    term.relatedTerms.includes(t.id) || 
    t.relatedTerms.includes(termId)
  );
}

export function assessAnswerCorrectness(
  userAnswer: string,
  correctAnswer: string
): { score: number; feedback: string } {
  // Simple keyword-based assessment
  const userWords = userAnswer.toLowerCase().split(/\s+/);
  const correctWords = correctAnswer.toLowerCase().split(/\s+/);
  
  const keyTerms = correctWords.filter(word => 
    word.length > 3 && 
    !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'has', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)
  );
  
  const matchedTerms = keyTerms.filter(term => 
    userWords.some(userWord => userWord.includes(term) || term.includes(userWord))
  );
  
  const score = Math.min(100, Math.round((matchedTerms.length / keyTerms.length) * 100));
  
  let feedback = '';
  if (score >= 80) {
    feedback = 'Excellent! You demonstrated strong understanding of the key concepts.';
  } else if (score >= 60) {
    feedback = 'Good effort! You covered most of the important points.';
  } else if (score >= 40) {
    feedback = 'Partial understanding shown. Review the key concepts and try again.';
  } else {
    feedback = 'This answer needs more detail. Review the glossary terms and try again.';
  }
  
  return { score, feedback };
}

export function updateLearningProgress(
  userId: string,
  studyCard: StudyCard,
  wasCorrect: boolean,
  confidence: number
): LearningProgress {
  return {
    userId,
    termId: studyCard.id,
    mastered: wasCorrect && confidence >= 4,
    attempts: 1, // This would be incremented in a real implementation
    lastAttempt: new Date(),
    confidence
  };
}

export function generateLearningPath(
  profile: UserProfile,
  allCards: StudyCard[],
  allTerms: GlossaryTerm[]
): { card: StudyCard; relatedTerms: GlossaryTerm[] }[] {
  const nextCards = getNextCards(profile, allCards, 10);
  
  return nextCards.map(card => ({
    card,
    relatedTerms: card.glossaryTerms.map(termId => 
      allTerms.find(term => term.id === termId)
    ).filter(Boolean) as GlossaryTerm[]
  }));
}

export function getProgressStats(profile: UserProfile, allCards: StudyCard[], allTerms: GlossaryTerm[]) {
  const totalTerms = allTerms.length;
  const totalCards = allCards.length;
  const knownTerms = profile.knownTerms.length;
  const completedCards = profile.completedCards.length;
  
  const termProgress = Math.round((knownTerms / totalTerms) * 100);
  const cardProgress = Math.round((completedCards / totalCards) * 100);
  const overallProgress = Math.round((termProgress + cardProgress) / 2);
  
  return {
    termProgress,
    cardProgress,
    overallProgress,
    knownTerms,
    totalTerms,
    completedCards,
    totalCards,
    currentLevel: calculateUserLevel(profile)
  };
}