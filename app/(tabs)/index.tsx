import { Pressable, RefreshControl, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { LoadingView, ErrorView } from "@/components/ui/StateViews";
import { useDashboardStats, useRecentActivity } from "@/lib/hooks/useDashboard";
import { useRealtime } from "@/lib/realtime";
import { useOrg, useAccent } from "@/lib/org";
import { theme } from "@/lib/theme";
import { fmtCurrency, timeAgo } from "@/lib/format";

const ACTIVITY_ICON = {
  deal: "trending-up-outline",
  estimate: "document-text-outline",
  work_order: "construct-outline",
} as const;

// Map each activity kind to its CRM record detail route.
const ACTIVITY_ROUTE = {
  deal: "/deal",
  estimate: "/estimate",
  work_order: "/workorder",
} as const;

const ACTIVITY_LABEL = {
  deal: "deal",
  estimate: "estimate",
  work_order: "job",
} as const;

export default function DashboardScreen() {
  const org = useOrg();
  const accent = useAccent();
  const router = useRouter();
  const stats = useDashboardStats();
  const activity = useRecentActivity();

  // Live dashboard — refresh stats/activity + the lists when tenant data changes.
  useRealtime("customer_pipeline", [["dashboard"], ["deals"]]);
  useRealtime("ops_work_orders", [["dashboard"], ["work-orders"]]);
  useRealtime("customer_estimates", [["dashboard"], ["estimates"]]);

  const refreshing = stats.isFetching || activity.isFetching;
  const onRefresh = () => {
    stats.refetch();
    activity.refetch();
  };

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={accent}
        />
      }
    >
      <View style={{ paddingTop: theme.spacing.md, marginBottom: theme.spacing.lg }}>
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
          {org.companyName}
        </Text>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.fontSize["2xl"],
            fontWeight: "800",
          }}
        >
          Dashboard
        </Text>
      </View>

      {stats.isLoading ? (
        <LoadingView />
      ) : stats.isError ? (
        <ErrorView message={(stats.error as Error)?.message} />
      ) : (
        <View style={{ gap: theme.spacing.md }}>
          <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
            <StatTile
              label="Open Deals"
              value={String(stats.data!.openDeals)}
              hint={fmtCurrency(stats.data!.pipelineValue) + " pipeline"}
              accent={accent}
            />
            <StatTile
              label="Active Jobs"
              value={String(stats.data!.activeJobs)}
              hint="in progress / scheduled"
            />
          </View>
          <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
            <StatTile
              label="Est. Pending"
              value={String(stats.data!.estimatesPending)}
              hint="awaiting signature"
            />
            <StatTile
              label="Won (MTD)"
              value={fmtCurrency(stats.data!.wonThisMonthValue)}
              hint={`${stats.data!.estimatesSignedThisMonth} signed`}
              accent={theme.colors.success}
            />
          </View>
        </View>
      )}

      {/* Quick actions */}
      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.fontSize.lg,
            fontWeight: "700",
          }}
        >
          Quick actions
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md }}>
          <QuickAction icon="trending-up-outline" label="Pipeline" onPress={() => router.push("/(tabs)/sales")} />
          <QuickAction icon="construct-outline" label="Jobs" onPress={() => router.push("/(tabs)/operations")} />
          <QuickAction icon="document-text-outline" label="Estimates" onPress={() => router.push("/(tabs)/estimates")} />
        </View>
      </View>

      {/* Recent activity */}
      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.fontSize.lg,
            fontWeight: "700",
          }}
        >
          Recent activity
        </Text>
        {(activity.data ?? []).length === 0 ? (
          <Card>
            <Text style={{ color: theme.colors.textMuted }}>No recent activity.</Text>
          </Card>
        ) : (
          <Card style={{ gap: 0, paddingVertical: 0 }}>
            {(activity.data ?? []).map((a, i) => (
              <Pressable
                key={a.id}
                accessibilityRole="button"
                accessibilityLabel={`Open ${ACTIVITY_LABEL[a.kind]}: ${a.title}`}
                onPress={() => router.push(`${ACTIVITY_ROUTE[a.kind]}/${a.recordId}`)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  minHeight: 56,
                  paddingVertical: theme.spacing.md,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: theme.colors.border,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Ionicons name={ACTIVITY_ICON[a.kind]} size={20} color={accent} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "600" }}
                    numberOfLines={1}
                  >
                    {a.title}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>
                    {a.subtitle}
                  </Text>
                </View>
                <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>
                  {timeAgo(a.at)}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
              </Pressable>
            ))}
          </Card>
        )}
      </View>
    </ScreenContainer>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const accent = useAccent();
  return (
    <Card onPress={onPress} style={{ flexGrow: 1, alignItems: "center", gap: 6, minWidth: 96 }}>
      <Ionicons name={icon} size={24} color={accent} />
      <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: "600" }}>
        {label}
      </Text>
    </Card>
  );
}
