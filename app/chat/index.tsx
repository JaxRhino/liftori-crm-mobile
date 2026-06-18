import { RefreshControl, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/StateViews";
import { useChannels } from "@/lib/hooks/useChat";
import { useAccent } from "@/lib/org";
import { theme } from "@/lib/theme";

export default function ChannelListScreen() {
  const router = useRouter();
  const accent = useAccent();
  const channels = useChannels();

  if (channels.isLoading) return <ScreenContainer scroll={false}><LoadingView /></ScreenContainer>;
  if (channels.isError) return <ScreenContainer scroll={false}><ErrorView message={(channels.error as Error)?.message} /></ScreenContainer>;

  return (
    <ScreenContainer
      refreshControl={<RefreshControl refreshing={channels.isFetching} onRefresh={() => channels.refetch()} tintColor={accent} />}
    >
      <View style={{ height: theme.spacing.md }} />
      {(channels.data ?? []).length === 0 ? (
        <EmptyState icon="chatbubbles-outline" title="No channels yet" />
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {channels.data!.map((c) => (
            <Card key={c.id} onPress={() => router.push(`/chat/${c.id}?name=${encodeURIComponent(c.name ?? "channel")}`)}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View
                  style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: theme.colors.surfaceElevated,
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Ionicons name="pricetag" size={18} color={accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "700" }}>
                    #{c.name}
                  </Text>
                  {c.description ? (
                    <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }} numberOfLines={1}>
                      {c.description}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}
