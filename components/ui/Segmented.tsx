import { Pressable, Text, View } from "react-native";
import { useAccent } from "@/lib/org";
import { theme } from "@/lib/theme";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { key: T; label: string }[];
}) {
  const accent = useAccent();
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 4,
        gap: 4,
      }}
    >
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: theme.radius.sm,
              backgroundColor: active ? accent : "transparent",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: active ? "#0b0f17" : theme.colors.textMuted,
                fontWeight: "700",
                fontSize: theme.fontSize.sm,
              }}
              numberOfLines={1}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
