// Convert HSL to hex for Sigma.js compatibility (requires hex, not CSS vars)
export const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

// Category colors derived from the design token palette
// Sigma.js requires hex strings; these match the prototype's color scheme.
export const CATEGORIES = {
  preparation: {
    label: 'Preparation',
    color: hslToHex(207, 51, 22),       // --primary (dark blue)
    bgClass: 'bg-primary/10 border-primary/30 text-primary'
  },
  application: {
    label: 'Application',
    color: hslToHex(212, 31, 39),       // --secondary (medium blue)
    bgClass: 'bg-secondary/20 border-secondary/40 text-primary'
  },
  processing: {
    label: 'Processing',
    color: hslToHex(212, 31, 50),       // secondary lighter
    bgClass: 'bg-secondary/20 border-secondary text-primary'
  },
  underwriting: {
    label: 'Underwriting',
    color: hslToHex(212, 31, 30),       // secondary darker
    bgClass: 'bg-secondary/30 border-secondary text-primary'
  },
  closing: {
    label: 'Closing',
    color: hslToHex(142, 76, 36),       // --success (green)
    bgClass: 'bg-primary/90 border-primary text-primary-foreground'
  }
} as const;