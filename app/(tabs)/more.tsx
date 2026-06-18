import { Alert, Pressable, Text, View } from "react-native";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/lib/auth";
import { useOrg, useAccent } from "@/lib/org";
import { theme } from "@/lib/theme";
import { tenantConfig } from "@/lib/config";

type Hub = { icon: keyof typeof Ionicons.glyphMap; label: string; href: string };

const HUBS: Hub[] = [
  { icon: "chatbubbles-outline", label: "Team Chat", href: "/chat" },
  { icon: "document-outline", label: "Notes", href: "/notes" },
  { icon: "checkbox-outline", label: "Tasks", href: "/tasks" },
  { icon: "calendar-outline", label: "Calendar", href: "/calendar" },
  { icon: "compass-outline", label: "EOS", href: "/eos" },
  { icon: "settings-outline", label: "Company Settings", href: "/settings" },
];

export default function MoreScreen() {
  const { user, signOut } = useAuth();
  const org = useOrg();
  const accent = useAccent();
  const router = useRouter();

  const onSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  return (
    <ScreenContainer>
      <View style={{ paddingTop: theme.spacing.md, marginBottom: theme.spacing.md }}>
        <Text style={{ color: theme.colors.text, fontSize: theme.fontSize["2xl"], fontWeight: "800" }}>
          More
        </Text>
      </View>

      <Card style={{ marginBottom: theme.spacing.lg }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Avatar initials={(user?.email ?? "?").slice(0, 2).toUpperCase()} color={accent} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "700" }} numberOfLines={1}>
              {user?.email ?? "Signed in"}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
              {org.companyName}
            </Text>
          </View>
        </View>
      </Card>

      <Card style={{ marginBottom: theme.spacing.lg, gap: 0, paddingVertical: 0 }}>
        {HUBS.map((h, i) => (
          <Pressable
            key={h.href}
            onPress={() => router.push(h.href as any)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingVertical: theme.spacing.md,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: theme.colors.border,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name={h.icon} size={22} color={accent} />
            <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base, flex: 1, fontWeight: "600" }}>
              {h.label}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </Pressable>
        ))}
      </Card>

      <Button label="Sign out" variant="danger" onPress={onSignOut} />

      <Text
        style={{
          color: theme.colors.textMuted,
          fontSize: theme.fontSize.xs,
          textAlign: "center",
          marginTop: theme.spacing.lg,
        }}
      >
        {tenantConfig.appName} · v{Constants.expoConfig?.version ?? "0.1.0"} · Liftori CRM
      </Text>
    </ScreenContainer>
  );
}
