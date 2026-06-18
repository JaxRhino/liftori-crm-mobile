import { Text, View } from "react-native";
import { Card } from "./Card";
import { theme } from "@/lib/theme";

export function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <Card style={{ flex: 1, minWidth: 0 }}>
      <Text
        style={{
          color: theme.colors.textMuted,
          fontSize: theme.fontSize.xs,
          letterSpacing: 0.4,
          textTransform: "uppercase",
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        style={{
          color: accent ?? theme.colors.text,
          fontSize: theme.fontSize["2xl"],
          fontWeight: "800",
          marginTop: 4,
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      {hint ? (
        <Text
          style={{
            color: theme.colors.textMuted,
            fontSize: theme.fontSize.xs,
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}
