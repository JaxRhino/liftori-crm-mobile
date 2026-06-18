import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/lib/auth";
import { theme } from "@/lib/theme";

export default function IndexRedirect() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={theme.colors.accent} size="large" />
      </View>
    );
  }

  return session ? <Redirect href="/(tabs)" /> : <Redirect href="/(auth)/login" />;
}
