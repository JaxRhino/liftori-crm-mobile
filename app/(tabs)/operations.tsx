import { useMemo, useState } from "react";
import { RefreshControl, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, toneForStatus } from "@/components/ui/Badge";
import { Segmented } from "@/components/ui/Segmented";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/StateViews";
import { useSchedule, useWorkOrders } from "@/lib/hooks/useOperations";
import { contactName } from "@/lib/services/sales";
import { workOrderAddress } from "@/lib/services/operations";
import { useAccent } from "@/lib/org";
import { theme } from "@/lib/theme";
import { fmtDateTime } from "@/lib/format";
import { isCsc } from "@/lib/config";
import { CleaningsScreen } from "@/components/csc/CleaningsScreen";

type Tab = "jobs" | "schedule";

export default function OperationsScreen() {
  // CSC (kitchen-exhaust-cleaning) tenant gets the Cleanings flow. The RoofX
  // (and any other tenant) work-orders path below is untouched.
  if (isCsc()) return <CleaningsScreen />;
  return <RoofXOperationsScreen />;
}

function RoofXOperationsScreen() {
  const [tab, setTab] = useState<Tab>("jobs");
  const accent = useAccent();
  const router = useRouter();
  const workOrders = useWorkOrders();

  const { fromIso, toIso } = useMemo(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 21);
    return { fromIso: from.toISOString(), toIso: to.toISOString() };
  }, []);
  const schedule = useSchedule(fromIso, toIso);

  const refreshing = workOrders.isFetching || schedule.isFetching;
  const onRefresh = () => {
    workOrders.refetch();
    schedule.refetch();
  };

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />
      }
    >
      <View style={{ paddingTop: theme.spacing.md, marginBottom: theme.spacing.md }}>
        <Text style={{ color: theme.colors.text, fontSize: theme.fontSize["2xl"], fontWeight: "800" }}>
          Jobs
        </Text>
      </View>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { key: "jobs", label: `Jobs (${workOrders.data?.length ?? 0})` },
          { key: "schedule", label: `Schedule (${schedule.data?.length ?? 0})` },
        ]}
      />
      <View style={{ height: theme.spacing.md }} />

      {tab === "jobs" ? (
        <View style={{ marginBottom: theme.spacing.md }}>
          <Button label="+ New job" onPress={() => router.push("/workorder/new")} />
        </View>
      ) : null}

      {tab === "jobs" ? (
        workOrders.isLoading ? (
          <LoadingView />
        ) : workOrders.isError ? (
          <ErrorView message={(workOrders.error as Error)?.message} />
        ) : (workOrders.data ?? []).length === 0 ? (
          <EmptyState icon="construct-outline" title="No jobs yet" subtitle="Jobs created in the CRM appear here." />
        ) : (
          <View style={{ gap: theme.spacing.md }}>
            {workOrders.data!.map((w) => (
              <Card key={w.id} onPress={() => router.push(`/workorder/${w.id}`)}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                  <Text
                    style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "700", flex: 1 }}
                    numberOfLines={1}
                  >
                    {w.title ?? w.work_order_number ?? "Job"}
                  </Text>
                  {w.status ? <Badge label={w.status} tone={toneForStatus(w.status)} /> : null}
                </View>
                <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginTop: 2 }} numberOfLines={1}>
                  {contactName(w.contact)} · {workOrderAddress(w)}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: theme.spacing.sm }}>
                  {w.scheduled_start ? (
                    <Row icon="calendar-outline" text={fmtDateTime(w.scheduled_start)} />
                  ) : null}
                  {w.crew?.name ? <Row icon="people-outline" text={w.crew.name} /> : null}
                  {w.priority ? <Badge label={w.priority} tone={toneForStatus(w.priority)} /> : null}
                </View>
              </Card>
            ))}
          </View>
        )
      ) : schedule.isLoading ? (
        <LoadingView />
      ) : schedule.isError ? (
        <ErrorView message={(schedule.error as Error)?.message} />
      ) : (schedule.data ?? []).length === 0 ? (
        <EmptyState icon="calendar-outline" title="Nothing scheduled" subtitle="Next 3 weeks are clear." />
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {schedule.data!.map((e) => (
            <Card key={e.id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "700", flex: 1 }} numberOfLines={1}>
                  {e.title ?? "Event"}
                </Text>
                {e.event_type ? <Badge label={e.event_type} tone="info" /> : null}
              </View>
              <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginTop: 2 }}>
                {fmtDateTime(e.start_time)}
                {e.address ? ` · ${e.address}` : ""}
              </Text>
            </Card>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

function Row({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Ionicons name={icon} size={14} color={theme.colors.textMuted} />
      <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>{text}</Text>
    </View>
  );
}
