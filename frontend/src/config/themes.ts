export interface ThemeColors {
  name: string;
  gridStroke: string;
  tickFill: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  accent1: string;
  accent1Faded: string;
  accent2: string;
  accentBlue: string;
  positiveDir: string;
  negativeDir: string;
  positive: string;
  negative: string;
  highlight: string;
  lineActual: string;
  linePredicted: string;
  scatterDot: string;
  btnTextOnAccent: string;
}

export const CHART_COLORS: ThemeColors = {
  name: 'InningAI',
  gridStroke: 'rgba(255, 255, 255, 0.06)',
  tickFill: '#8b949e',
  tooltipBg: '#161e2a',
  tooltipBorder: 'rgba(255, 255, 255, 0.08)',
  tooltipText: '#f0f6fc',
  accent1: '#ff6b5b',
  accent1Faded: 'rgba(255, 107, 91, 0.3)',
  accent2: '#4dc9ff',
  accentBlue: '#2563eb',
  positiveDir: '#4dc9ff',
  negativeDir: '#ff6b5b',
  positive: '#3fb950',
  negative: '#f85149',
  highlight: '#ff8577',
  lineActual: '#ff6b5b',
  linePredicted: '#4dc9ff',
  scatterDot: '#ff6b5b',
  btnTextOnAccent: '#ffffff',
};
