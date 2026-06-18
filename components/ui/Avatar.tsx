import { Text, View } from "react-native";
import { theme } from "@/lib/theme";

export function Avatar({
  initials,
  size = 40,
  color,
}: {
  initials: string;
  size?: number;
  color?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color ?? theme.colors.surfaceElevated,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: theme.colors.text,
          fontSize: size * 0.38,
          fontWeight: "700",
        }}
      >
        {initials}
      </Text>
    </View>
  );
}
