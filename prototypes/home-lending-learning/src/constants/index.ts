export const CATEGORIES = {
  preparation: {
    label: 'Preparation',
    color: '#3B82F6',
    bgClass: 'bg-blue-50 border-blue-200 text-primary'
  },
  application: {
    label: 'Application', 
    color: '#2563EB',
    bgClass: 'bg-blue-100 border-blue-300 text-primary'
  },
  processing: {
    label: 'Processing',
    color: '#7C3AED',
    bgClass: 'bg-secondary/20 border-secondary text-primary'
  },
  underwriting: {
    label: 'Underwriting',
    color: '#6D28D9',
    bgClass: 'bg-secondary/30 border-secondary text-primary'
  },
  closing: {
    label: 'Closing',
    color: '#059669',
    bgClass: 'bg-primary/90 border-primary text-primary-foreground'
  }
} as const;