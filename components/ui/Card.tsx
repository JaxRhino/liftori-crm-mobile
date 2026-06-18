import { Pressable, View, type ViewProps } from "react-native";
import { theme } from "@/lib/theme";

type Props = ViewProps & {
  elevated?: boolean;
  onPress?: () => void;
};

export function Card({ elevated = false, style, children, onPress, ...rest }: Props) {
  const body = (
    <View
      {...rest}
      style={[
        {
          backgroundColor: elevated
            ? theme.colors.surfaceElevated
            : theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: theme.spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        {body}
      </Pressable>
    );
  }
  return body;
}
