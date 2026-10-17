import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MIN_TOUCH, Radius, Spacing, Type, useTheme } from "@/constants/Theme";

export interface Option {
  key: string;
  label: string;
}

interface OptionModalProps {
  visible: boolean;
  title?: string;
  options: Option[];
  selectedKey?: string;
  onSelect: (key: string) => void;
  onClose: () => void;
}

export function OptionModal({ visible, title, options, selectedKey, onSelect, onClose }: OptionModalProps) {
  const theme = useTheme();
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {title && <Text style={[styles.title, { color: theme.text }]}>{title}</Text>}
            {options.map((option) => {
              const selected = option.key === selectedKey;
              return (
                <TouchableOpacity
                  key={option.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[styles.option, { borderColor: theme.border }]}
                  onPress={() => {
                    onSelect(option.key);
                    onClose();
                  }}
                >
                  <Text style={[styles.optionText, { color: selected ? theme.primary : theme.text }]}>
                    {option.label}
                  </Text>
                  {selected && <Ionicons name="checkmark" size={20} color={theme.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: Spacing.xl,
  },
  sheet: {
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
  },
  title: {
    ...Type.bodyStrong,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  option: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  optionText: { ...Type.body },
});
