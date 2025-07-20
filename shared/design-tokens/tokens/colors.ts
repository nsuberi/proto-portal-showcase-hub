/**
 * Core color tokens for the Proto Portal design system
 * All colors are defined in HSL format for better Tailwind CSS integration
 */

export interface ColorTokens {
  // Base semantic colors
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  radius: string;
  
  // Extended semantic colors
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  info: string;
  infoForeground: string;
  
  // Component-specific colors
  sidebar: {
    background: string;
    foreground: string;
    primary: string;
    primaryForeground: string;
    accent: string;
    accentForeground: string;
    border: string;
    ring: string;
  };
}

export const baseColorTokens: ColorTokens = {
  // Light mode base colors
  background: "240 10% 3.9%",
  foreground: "0 0% 98%",
  card: "240 10% 3.9%",
  cardForeground: "0 0% 98%",
  popover: "240 10% 3.9%",
  popoverForeground: "0 0% 98%",
  primary: "263 70% 60%",
  primaryForeground: "0 0% 98%",
  secondary: "240 3.7% 15.9%",
  secondaryForeground: "0 0% 98%",
  muted: "240 3.7% 15.9%",
  mutedForeground: "240 5% 64.9%",
  accent: "240 3.7% 15.9%",
  accentForeground: "0 0% 98%",
  destructive: "0 84.2% 60.2%",
  destructiveForeground: "0 0% 98%",
  border: "240 3.7% 15.9%",
  input: "240 3.7% 15.9%",
  ring: "263 70% 60%",
  radius: "0.5rem",
  
  // Extended semantic colors
  success: "142 76% 36%",
  successForeground: "0 0% 98%",
  warning: "48 96% 53%",
  warningForeground: "0 0% 9%",
  info: "213 94% 68%",
  infoForeground: "0 0% 98%",
  
  sidebar: {
    background: "0 0% 98%",
    foreground: "240 5.3% 26.1%",
    primary: "240 5.9% 10%",
    primaryForeground: "0 0% 98%",
    accent: "240 4.8% 95.9%",
    accentForeground: "240 5.9% 10%",
    border: "220 13% 91%",
    ring: "217.2 91.2% 59.8%",
  },
};

export const darkColorTokens: Partial<ColorTokens> = {
  background: "222.2 84% 4.9%",
  foreground: "210 40% 98%",
  card: "222.2 84% 4.9%",
  cardForeground: "210 40% 98%",
  popover: "222.2 84% 4.9%",
  popoverForeground: "210 40% 98%",
  primary: "210 40% 98%",
  primaryForeground: "222.2 47.4% 11.2%",
  secondary: "217.2 32.6% 17.5%",
  secondaryForeground: "210 40% 98%",
  muted: "217.2 32.6% 17.5%",
  mutedForeground: "215 20.2% 65.1%",
  accent: "217.2 32.6% 17.5%",
  accentForeground: "210 40% 98%",
  destructive: "0 62.8% 30.6%",
  destructiveForeground: "210 40% 98%",
  border: "217.2 32.6% 17.5%",
  input: "217.2 32.6% 17.5%",
  ring: "212.7 26.8% 83.9%",
  
  sidebar: {
    background: "240 5.9% 10%",
    foreground: "240 4.8% 95.9%",
    primary: "224.3 76.3% 48%",
    primaryForeground: "0 0% 100%",
    accent: "240 3.7% 15.9%",
    accentForeground: "240 4.8% 95.9%",
    border: "240 3.7% 15.9%",
    ring: "217.2 91.2% 59.8%",
  },
};