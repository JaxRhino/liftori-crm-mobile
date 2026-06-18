import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type PressableProps,
} from "react-native";
import { useAccent } from "@/lib/org";
import { theme } from "@/lib/theme";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = Omit<PressableProps, "children"> & {
  label: string;
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
};

export function Button({
  label,
  variant = "primary",
  loading = false,
  fullWidth = true,
  iconLeft,
  disabled,
  ...rest
}: Props) {
  const accent = useAccent();
  const isDisabled = disabled || loading;

  const bg =
    variant === "primary"
      ? accent
      : variant === "danger"
      ? theme.colors.danger
      : variant === "secondary"
      ? theme.colors.surfaceElevated
      : "transparent";

  const fg =
    variant === "primary" || variant === "danger"
      ? "#0b0f17"
      : theme.colors.text;

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md - 2,
          alignSelf: fullWidth ? "stretch" : "flex-start",
          borderWidth: variant === "ghost" ? 1 : 0,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <>
            {iconLeft}
            <Text
              style={{
                color: fg,
                fontSize: theme.fontSize.base,
                fontWeight: "700",
                letterSpacing: 0.2,
              }}
            >
              {label}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}
