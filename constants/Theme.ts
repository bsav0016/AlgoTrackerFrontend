import { useColorScheme } from 'react-native';
import { Colors } from './Colors';

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const Radius = { sm: 6, md: 10, lg: 16, pill: 999 } as const;

export const Type = {
  caption: { fontSize: 12, lineHeight: 16 },
  body: { fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  subtitle: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700' as const },
};

export const MIN_TOUCH = 44;

export type ThemeColors = typeof Colors.light;

export function useTheme(): ThemeColors {
  return Colors[useColorScheme() ?? 'light'];
}
