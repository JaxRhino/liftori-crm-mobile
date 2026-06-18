/**
 * CSC Cleanings list — the operations tab for the kitchen-exhaust-cleaning
 * tenant. Segmented: Today / Upcoming / Needs sign-off. Rendered only when
 * isCsc() is true (gated in app/(tabs)/operations.tsx). RoofX never reaches it.
 */
import { useMemo, useState } from "react";
import { RefreshControl, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Badge, toneForStatus } from "@/components/ui/Badge";
import { Segmented } from "@/components/ui/Segmented";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/StateViews";
import { useCleanings } from "@/lib/hooks/useCsc";
import {
  normalizeStatus,
  restaurantAddress,
  type CscCleaning,
} from "@/lib/services/csc";
import { useAccent } from "@/lib/org";
import { theme } from "@/lib/theme";
import { fmtDateTime } from "@/lib/format";

type Bucket = "today" | "upcoming" | "signoff";

function isToday(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/** Completed clean with no certificate yet, OR in_progress = needs sign-off. */
function needsSignoff(c: CscCleaning): boolean {
  const s = normalizeStatus(c.status);
  if (c.certificate_id) return false;
  return s === "in_progress" || s === "completed";
}

export function CleaningsScreen() {
  const [bucket, setBucket] = useState<Bucket>("today");
  const accent = useAccent();
  const router = useRouter();
  const cleanings = useCleanings();

  const { today, upcoming, signoff } = useMemo(() => {
    const all = (cleanings.data ?? []).filter(
      (c) => normalizeStatus(c.status) !== "cancelled"
    );
    const today: CscCleaning[] = [];
    const upcoming: CscCleaning[] = [];
    const signoff: CscCleaning[] = [];
    for (const c of all) {
      if (needsSignoff(c)) signoff.push(c);
      else if (isToday(c.scheduled_at)) today.push(c);
      else if (c.scheduled_at && new Date(c.scheduled_at) >= new Date())
        upcoming.push(c);
      else today.push(c); // overdue / past-scheduled but not done → surface today
    }
    return { today, upcoming, signoff };
  }, [cleanings.data]);

  const lists: Record<Bucket, CscCleaning[]> = { today, upcoming, signoff };
  const rows = lists[bucket];

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl
          refreshing={cleanings.isFetching}
          onRefresh={() => cleanings.refetch()}
          tintColor={accent}
        />
      }
    >
      <View style={{ paddingTop: theme.spacing.md, marginBottom: theme.spacing.md }}>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.fontSize["2xl"],
            fontWeight: "800",
          }}
        >
          Cleanings
        </Text>
      </View>

      <Segmented
        value={bucket}
        onChange={setBucket}
        options={[
          { key: "today", label: `Today (${today.length})` },
          { key: "upcoming", label: `Upcoming (${upcoming.length})` },
          { key: "signoff", label: `Sign-off (${signoff.length})` },
        ]}
      />
      <View style={{ height: theme.spacing.md }} />

      {cleanings.isLoading ? (
        <LoadingView />
      ) : cleanings.isError ? (
        <ErrorView message={(cleanings.error as Error)?.message} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="restaurant-outline"
          title={
            bucket === "signoff"
              ? "Nothing awaiting sign-off"
              : bucket === "today"
              ? "No cleanings today"
              : "Nothing upcoming"
          }
          subtitle="Cleanings scheduled in the CSC office appear here."
        />
      ) : (
        <View style={{ gap: theme.spacing.md }}>
          {rows.map((c) => (
            <CleaningRow
              key={c.id}
              cleaning={c}
              onPress={() => router.push(`/cleaning/${c.id}`)}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

function overdue(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso) < new Date(new Date().setHours(0, 0, 0, 0));
}

function CleaningRow({
  cleaning: c,
  onPress,
}: {
  cleaning: CscCleaning;
  onPress: () => void;
}) {
  const r = c.restaurant;
  const status = normalizeStatus(c.status);
  const isOverdue = overdue(c.scheduled_at) && status !== "completed";
  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.fontSize.base,
            fontWeight: "700",
            flex: 1,
          }}
          numberOfLines={1}
        >
          {r?.name ?? "Restaurant"}
        </Text>
        <Badge label={status} tone={toneForStatus(status)} />
      </View>

      {r?.location_label ? (
        <Text
          style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginTop: 2 }}
          numberOfLines={1}
        >
          {r.location_label}
        </Text>
      ) : null}

      <Text
        style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs, marginTop: 2 }}
        numberOfLines={1}
      >
        {restaurantAddress(r)}
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginTop: theme.spacing.sm,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="calendar-outline" size={14} color={theme.colors.textMuted} />
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>
            {fmtDateTime(c.scheduled_at)}
          </Text>
        </View>
        {c.tech_name ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="person-outline" size={14} color={theme.colors.textMuted} />
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>
              {c.tech_name}
            </Text>
          </View>
        ) : null}
        {isOverdue ? <Badge label="Overdue" tone="danger" /> : null}
        {c.exceeded_threshold ? <Badge label="Over threshold" tone="warning" /> : null}
        {c.certificate_id ? <Badge label="Certified" tone="success" /> : null}
      </View>
    </Card>
  );
}
