import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { MIN_TOUCH, Radius, Spacing, useTheme } from "@/constants/Theme";

export type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";

interface GeneralButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  autoWidth?: boolean;
  /** Less horizontal padding, for lists of short chips. */
  compact?: boolean;
  fontSize?: number;
  /** Legacy override; prefer `variant`. */
  backgroundColor?: string;
}

export function GeneralButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  autoWidth = true,
  compact = false,
  fontSize = 16,
  backgroundColor = undefined,
}: GeneralButtonProps) {
  const theme = useTheme();

  const palette = {
    primary: { bg: theme.primary, fg: theme.onPrimary, border: theme.primary },
    secondary: { bg: theme.neutralSoft, fg: theme.text, border: theme.neutralSoft },
    outline: { bg: "transparent", fg: theme.primary, border: theme.primary },
    danger: { bg: theme.danger, fg: theme.onDanger, border: theme.danger },
    ghost: { bg: "transparent", fg: theme.primary, border: "transparent" },
  }[variant];

  const inactive = disabled || loading;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        styles.button,
        {
          backgroundColor: backgroundColor ?? palette.bg,
          borderColor: backgroundColor ?? palette.border,
        },
        inactive && styles.disabled,
        compact && styles.compact,
        !autoWidth && { width: "100%" },
      ]}
      onPress={onPress}
      disabled={inactive}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <Text style={[styles.text, { color: backgroundColor ? "#ffffff" : palette.fg, fontSize }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  compact: {
    paddingHorizontal: Spacing.md,
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
  disabled: {
    opacity: 0.45,
  },
});
