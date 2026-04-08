/**
 * Quiz and assessment tokens
 * Inspired by Codecademy's quiz interface with bordered answer cards
 */

export interface QuizTokens {
  optionBackground: string;
  optionBorder: string;
  optionHoverBorder: string;
  optionSelectedBorder: string;
  optionSelectedBackground: string;
  optionCorrectBorder: string;
  optionCorrectBackground: string;
  optionIncorrectBorder: string;
  optionIncorrectBackground: string;
}

export const quizTokens: QuizTokens = {
  optionBackground: "230 35% 16%",
  optionBorder: "200 60% 45%",
  optionHoverBorder: "200 60% 55%",
  optionSelectedBorder: "263 55% 55%",
  optionSelectedBackground: "263 55% 50%",
  optionCorrectBorder: "142 76% 36%",
  optionCorrectBackground: "142 76% 36%",
  optionIncorrectBorder: "350 80% 60%",
  optionIncorrectBackground: "350 80% 60%",
};
