import { ActivityIndicator, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/lib/theme";

export function LoadingView({ label }: { label?: string }) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 200,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      }}
    >
      <ActivityIndicator color={theme.colors.accent} size="large" />
      {label ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon = "file-tray-outline",
  title,
  subtitle,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 200,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: theme.spacing.xl,
      }}
    >
      <Ionicons name={icon} size={40} color={theme.colors.textMuted} />
      <Text
        style={{
          color: theme.colors.text,
          fontSize: theme.fontSize.lg,
          fontWeight: "700",
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            color: theme.colors.textMuted,
            fontSize: theme.fontSize.sm,
            textAlign: "center",
            paddingHorizontal: theme.spacing.lg,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function ErrorView({ message }: { message?: string }) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 200,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingHorizontal: theme.spacing.lg,
      }}
    >
      <Ionicons name="alert-circle-outline" size={40} color={theme.colors.danger} />
      <Text
        style={{
          color: theme.colors.text,
          fontSize: theme.fontSize.base,
          fontWeight: "700",
        }}
      >
        Something went wrong
      </Text>
      {message ? (
        <Text
          style={{
            color: theme.colors.textMuted,
            fontSize: theme.fontSize.sm,
            textAlign: "center",
          }}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}
