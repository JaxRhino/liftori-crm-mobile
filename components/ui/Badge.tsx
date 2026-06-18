import { Text, View } from "react-native";
import { theme } from "@/lib/theme";
import { titleCase } from "@/lib/format";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const TONES: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: "#2a3645", fg: "#cbd5e1" },
  accent: { bg: "rgba(14,165,233,0.16)", fg: "#38bdf8" },
  success: { bg: "rgba(52,211,153,0.16)", fg: "#34d399" },
  warning: { bg: "rgba(245,166,35,0.16)", fg: "#f5a623" },
  danger: { bg: "rgba(239,83,80,0.16)", fg: "#ef5350" },
  info: { bg: "rgba(147,161,181,0.16)", fg: "#93a1b5" },
};

/** Map a stage/status string to a sensible tone. */
export function toneForStatus(s?: string | null): Tone {
  const v = (s ?? "").toLowerCase();
  if (["won", "signed", "completed", "accepted", "active", "paid"].some((k) => v.includes(k)))
    return "success";
  if (["lost", "cancelled", "canceled", "rejected", "overdue", "declined"].some((k) => v.includes(k)))
    return "danger";
  if (["in_progress", "in progress", "scheduled", "sent", "pending", "on_hold", "viewed"].some((k) => v.includes(k)))
    return "warning";
  if (["new", "lead", "draft"].some((k) => v.includes(k))) return "info";
  return "neutral";
}

export function Badge({
  label,
  tone = "neutral",
  pretty = true,
}: {
  label: string;
  tone?: Tone;
  pretty?: boolean;
}) {
  const c = TONES[tone];
  return (
    <View
      style={{
        backgroundColor: c.bg,
        borderRadius: theme.radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 3,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color: c.fg, fontSize: theme.fontSize.xs, fontWeight: "700" }}>
        {pretty ? titleCase(label) : label}
      </Text>
    </View>
  );
}
