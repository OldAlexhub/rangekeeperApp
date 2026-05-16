export const Colors = {
  background: '#0D1B2A',
  surface: '#162032',
  surfaceElevated: '#1E2D40',
  border: '#2A3D55',
  borderLight: '#1E2D40',

  primary: '#00E5C3',
  primaryDark: '#00B89C',
  primaryMuted: '#00E5C320',

  accent: '#4DFFE0',
  accentGreen: '#39FF14',
  accentGreenMuted: '#39FF1420',

  textPrimary: '#F0F4F8',
  textSecondary: '#8FA8C8',
  textMuted: '#5A7A9A',
  textInverse: '#0D1B2A',

  success: '#39FF14',
  successMuted: '#39FF1420',
  warning: '#FFB800',
  warningMuted: '#FFB80020',
  error: '#FF4757',
  errorMuted: '#FF475720',
  info: '#00E5C3',

  white: '#FFFFFF',
  black: '#000000',

  cardBackground: '#162032',
  cardBorder: '#2A3D55',
  inputBackground: '#0D1B2A',
  inputBorder: '#2A3D55',
  inputFocused: '#00E5C3',
  placeholder: '#4A6A8A',

  tabBar: '#0D1B2A',
  tabBarBorder: '#1E2D40',
  tabActive: '#00E5C3',
  tabInactive: '#5A7A9A',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const },
  h4: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodySmall: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.5 },
  mono: { fontSize: 14, fontWeight: '400' as const, fontFamily: 'monospace' },
};
