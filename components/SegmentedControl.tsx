import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MIN_TOUCH, Radius, Spacing, useTheme } from "@/constants/Theme";

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  const theme = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: theme.neutralSoft }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[styles.segment, selected && { backgroundColor: theme.surface }]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, { color: selected ? theme.text : theme.mutedText }]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    borderRadius: Radius.md,
    padding: 3,
  },
  segment: {
    flex: 1,
    minHeight: MIN_TOUCH - 8,
    borderRadius: Radius.md - 3,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
  },
  label: { fontSize: 15, fontWeight: "600" },
});
