/**
 * Progress and XP tracking tokens
 * Inspired by Codecademy's yellow progress accent system
 */

export interface ProgressTokens {
  barFill: string;
  barTrack: string;
  circleStroke: string;
  circleTrack: string;
  xpGain: string;
  xpText: string;
  segmentComplete: string;
  segmentActive: string;
  segmentPending: string;
}

export const progressTokens: ProgressTokens = {
  barFill: "48 100% 52%",
  barTrack: "230 25% 22%",
  circleStroke: "48 100% 52%",
  circleTrack: "230 25% 22%",
  xpGain: "142 76% 36%",
  xpText: "0 0% 92%",
  segmentComplete: "142 76% 36%",
  segmentActive: "48 100% 52%",
  segmentPending: "230 25% 30%",
};
