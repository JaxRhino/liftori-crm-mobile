import "../global.css";
import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/lib/auth";
import { OrgProvider } from "@/lib/org";
import { QueryProvider } from "@/lib/query";
import { theme } from "@/lib/theme";

const detailScreen = {
  headerShown: true,
  headerStyle: { backgroundColor: theme.colors.bg },
  headerTintColor: theme.colors.text,
  headerTitleStyle: { fontWeight: "700" as const },
  contentStyle: { backgroundColor: theme.colors.bg },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <QueryProvider>
        <AuthProvider>
          <OrgProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.colors.bg },
                animation: "fade",
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="contact/[id]"
                options={{ ...detailScreen, title: "Contact" }}
              />
              <Stack.Screen
                name="contact/new"
                options={{ ...detailScreen, title: "New Contact" }}
              />
              <Stack.Screen
                name="deal/[id]"
                options={{ ...detailScreen, title: "Deal" }}
              />
              <Stack.Screen
                name="deal/new"
                options={{ ...detailScreen, title: "New Deal" }}
              />
              <Stack.Screen
                name="estimate/[id]"
                options={{ ...detailScreen, title: "Estimate" }}
              />
              <Stack.Screen
                name="estimate/new"
                options={{ ...detailScreen, title: "New Estimate" }}
              />
              <Stack.Screen
                name="workorder/[id]"
                options={{ ...detailScreen, title: "Work Order" }}
              />
              <Stack.Screen
                name="workorder/new"
                options={{ ...detailScreen, title: "New Work Order" }}
              />
              {/* CSC (kitchen-exhaust-cleaning) field flow — gated at runtime; the
                  routes are always registered (harmless on RoofX, never navigated to). */}
              <Stack.Screen
                name="cleaning/[id]/index"
                options={{ ...detailScreen, title: "Cleaning" }}
              />
              <Stack.Screen
                name="cleaning/[id]/photos"
                options={{ ...detailScreen, title: "Photos" }}
              />
              <Stack.Screen
                name="cleaning/[id]/grease"
                options={{ ...detailScreen, title: "Grease Depth" }}
              />
              <Stack.Screen
                name="cleaning/[id]/closeout"
                options={{ ...detailScreen, title: "Close Out" }}
              />
              <Stack.Screen
                name="chat/index"
                options={{ ...detailScreen, title: "Team Chat" }}
              />
              <Stack.Screen
                name="chat/[id]"
                options={{ ...detailScreen, title: "Channel" }}
              />
              <Stack.Screen
                name="notes"
                options={{ ...detailScreen, title: "Notes" }}
              />
              <Stack.Screen
                name="tasks"
                options={{ ...detailScreen, title: "Tasks" }}
              />
              <Stack.Screen
                name="calendar"
                options={{ ...detailScreen, title: "Calendar" }}
              />
              <Stack.Screen
                name="eos"
                options={{ ...detailScreen, title: "EOS" }}
              />
              <Stack.Screen
                name="settings"
                options={{ ...detailScreen, title: "Company Settings" }}
              />
            </Stack>
          </OrgProvider>
        </AuthProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
