import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Radius, Spacing, Type, useTheme } from "@/constants/Theme";

export type BadgeTone = "gain" | "loss" | "neutral";

export function Badge({ label, tone = "neutral" }: { label: string; tone?: BadgeTone }) {
  const theme = useTheme();
  const colors = {
    gain: { bg: theme.gainSoft, fg: theme.gain },
    loss: { bg: theme.lossSoft, fg: theme.loss },
    neutral: { bg: theme.neutralSoft, fg: theme.mutedText },
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  text: {
    ...Type.caption,
    fontWeight: "600",
  },
});
