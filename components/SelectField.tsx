import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MIN_TOUCH, Radius, Spacing, Type, useTheme } from "@/constants/Theme";

interface SelectFieldProps {
  label?: string;
  value?: string;
  placeholder?: string;
  onPress: () => void;
}

export function SelectField({ label, value, placeholder = "Select", onPress }: SelectFieldProps) {
  const theme = useTheme();
  return (
    <View style={styles.wrapper}>
      {label && <Text style={[styles.label, { color: theme.mutedText }]}>{label}</Text>}
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}: ${value || placeholder}` : value || placeholder}
        style={[styles.field, { backgroundColor: theme.surface, borderColor: theme.border }]}
        activeOpacity={0.7}
      >
        <Text style={[styles.value, { color: value ? theme.text : theme.mutedText }]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={theme.mutedText} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.xs },
  label: { ...Type.caption, fontWeight: "600" },
  field: {
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  value: { fontSize: 16 },
});
