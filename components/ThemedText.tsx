import { Text, type TextProps, StyleSheet } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { Type } from '@/constants/Theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'muted';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const text = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const muted = useThemeColor({ light: lightColor, dark: darkColor }, 'mutedText');
  const primary = useThemeColor({ light: lightColor, dark: darkColor }, 'primary');

  const color = type === 'muted' ? muted : type === 'link' ? primary : text;

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'muted' ? styles.muted : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: Type.body,
  defaultSemiBold: Type.bodyStrong,
  title: Type.title,
  subtitle: Type.subtitle,
  link: { ...Type.bodyStrong },
  muted: { ...Type.body },
});
