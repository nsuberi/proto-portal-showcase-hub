/**
 * Chart color tokens for data visualization
 * Using semantic color references instead of hardcoded hex values
 */

export interface ChartColorTokens {
  primary: string[];
  categorical: string[];
  sequential: string[];
  diverging: string[];
}

export const chartColorTokens: ChartColorTokens = {
  // Primary chart colors using semantic tokens
  primary: [
    "hsl(var(--primary))",
    "hsl(var(--success))",
    "hsl(var(--info))",
    "hsl(var(--warning))",
    "hsl(var(--destructive))",
  ],
  
  // Extended categorical palette for diverse datasets
  categorical: [
    "hsl(213, 94%, 68%)",   // Blue
    "hsl(142, 76%, 36%)",   // Green
    "hsl(48, 96%, 53%)",    // Yellow
    "hsl(0, 84%, 60%)",     // Red
    "hsl(263, 70%, 60%)",   // Purple
    "hsl(20, 90%, 58%)",    // Orange
    "hsl(338, 76%, 58%)",   // Pink
    "hsl(200, 98%, 39%)",   // Cyan
  ],
  
  // Sequential colors for ordered data
  sequential: [
    "hsl(240, 100%, 95%)",
    "hsl(240, 100%, 85%)",
    "hsl(240, 100%, 75%)",
    "hsl(240, 100%, 65%)",
    "hsl(240, 100%, 55%)",
    "hsl(240, 100%, 45%)",
  ],
  
  // Diverging colors for data with natural midpoint
  diverging: [
    "hsl(0, 84%, 60%)",     // Red
    "hsl(20, 90%, 65%)",    // Orange
    "hsl(40, 90%, 70%)",    // Light Orange
    "hsl(60, 30%, 85%)",    // Neutral
    "hsl(180, 60%, 70%)",   // Light Blue
    "hsl(200, 80%, 60%)",   // Blue
    "hsl(220, 90%, 50%)",   // Dark Blue
  ],
};