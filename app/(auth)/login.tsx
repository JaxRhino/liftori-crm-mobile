import { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth";
import { useOrg } from "@/lib/org";
import { theme } from "@/lib/theme";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const org = useOrg();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setLoading(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    router.replace("/(tabs)");
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: "center", gap: theme.spacing.lg }}>
          <View style={{ alignItems: "center", marginBottom: theme.spacing.lg }}>
            <Text
              style={{
                color: org.accentColor,
                fontSize: theme.fontSize["3xl"],
                fontWeight: "800",
                letterSpacing: 2,
              }}
            >
              {org.companyName}
            </Text>
            <Text
              style={{
                color: theme.colors.textMuted,
                fontSize: theme.fontSize.sm,
                marginTop: 4,
                letterSpacing: 1,
              }}
            >
              POWERED BY LIFTORI
            </Text>
            <Text
              style={{
                color: theme.colors.text,
                fontSize: theme.fontSize.base,
                marginTop: theme.spacing.md,
                textAlign: "center",
              }}
            >
              Your whole roofing business in your back pocket.
            </Text>
          </View>

          <Card elevated>
            <Text
              style={{
                color: theme.colors.text,
                fontSize: theme.fontSize.xl,
                fontWeight: "700",
                marginBottom: theme.spacing.md,
              }}
            >
              Sign in
            </Text>

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@company.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="username"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              error={error}
            />

            <Button
              label={loading ? "Signing in…" : "Sign in"}
              onPress={onSubmit}
              loading={loading}
            />
          </Card>

          <Text
            style={{
              color: theme.colors.textMuted,
              fontSize: theme.fontSize.xs,
              textAlign: "center",
            }}
          >
            Trouble signing in? Contact your office admin.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
