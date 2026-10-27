import React, { ComponentRef, useState } from "react";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { MIN_TOUCH, Radius, Spacing, Type, useTheme } from "@/constants/Theme";

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  inputRef?: React.Ref<ComponentRef<typeof TextInput>>;
}

export function TextField({ label, error, style, onFocus, onBlur, inputRef, ...rest }: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? theme.danger : focused ? theme.primary : theme.border;

  return (
    <View style={styles.wrapper}>
      {label && <Text style={[styles.label, { color: theme.mutedText }]}>{label}</Text>}
      <TextInput
        ref={inputRef}
        accessibilityLabel={label}
        placeholderTextColor={theme.mutedText}
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.surface, borderColor },
          style,
        ]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      {error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.xs },
  label: { ...Type.caption, fontWeight: "600" },
  input: {
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  error: { ...Type.caption },
});
