import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Spacing, Type, useTheme } from "@/constants/Theme";

interface EmptyStateProps {
  title: string;
  message?: string;
  children?: React.ReactNode;
}

export function EmptyState({ title, message, children }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {message && <Text style={[styles.message, { color: theme.mutedText }]}>{message}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: Spacing.sm, padding: Spacing.xl },
  title: { ...Type.bodyStrong, textAlign: "center" },
  message: { ...Type.body, textAlign: "center" },
});
