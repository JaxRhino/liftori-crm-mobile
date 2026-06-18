import { Text, TextInput, View, type TextInputProps } from "react-native";
import { useState } from "react";
import { theme } from "@/lib/theme";

type Props = TextInputProps & {
  label?: string;
  error?: string | null;
};

export function Input({ label, error, style, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: 6, marginBottom: theme.spacing.md }}>
      {label ? (
        <Text
          style={{
            color: theme.colors.textMuted,
            fontSize: theme.fontSize.sm,
            letterSpacing: 0.3,
          }}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          {
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: error
              ? theme.colors.danger
              : focused
              ? theme.colors.accent
              : theme.colors.border,
            borderRadius: theme.radius.md,
            color: theme.colors.text,
            fontSize: theme.fontSize.base,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.md - 2,
          },
          style,
        ]}
      />
      {error ? (
        <Text style={{ color: theme.colors.danger, fontSize: theme.fontSize.xs }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
