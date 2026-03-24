import { Colors } from './colors';

export const Theme = {
  colors: Colors,
  spacing:      { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  borderRadius: { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 },
  fontSizes:    { xs: 11, sm: 13, md: 15, lg: 16, xl: 18, xxl: 20, xxxl: 24 },
  fontWeights:  { regular: '400', medium: '500', semibold: '600', bold: '700' },
  shadows: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    md: { shadowColor: '#1A56DB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 5 },
  },
} as const;
