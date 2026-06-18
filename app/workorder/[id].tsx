import { Linking, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, toneForStatus } from "@/components/ui/Badge";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/StateViews";
import { useWorkOrder, useUpdateWorkOrderStatus } from "@/lib/hooks/useOperations";
import { WorkOrderPhotos } from "@/components/WorkOrderPhotos";
import { WORK_ORDER_STATUSES, workOrderAddress } from "@/lib/services/operations";
import { contactName } from "@/lib/services/sales";
import { theme } from "@/lib/theme";
import { fmtMoney, fmtDateTime, titleCase } from "@/lib/format";

export default function WorkOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: w, isLoading, isError, error } = useWorkOrder(id!);
  const updateStatus = useUpdateWorkOrderStatus();

  if (isLoading) return <ScreenContainer scroll={false}><LoadingView /></ScreenContainer>;
  if (isError) return <ScreenContainer scroll={false}><ErrorView message={(error as Error)?.message} /></ScreenContainer>;
  if (!w) return <ScreenContainer scroll={false}><EmptyState icon="construct-outline" title="Work order not found" /></ScreenContainer>;

  const address = workOrderAddress(w);

  return (
    <ScreenContainer>
      <View style={{ marginVertical: theme.spacing.md }}>
        <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: "800" }}>
          {w.title ?? w.work_order_number ?? "Work order"}
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: theme.spacing.sm }}>
          {w.status ? <Badge label={w.status} tone={toneForStatus(w.status)} /> : null}
          {w.priority ? <Badge label={w.priority} tone={toneForStatus(w.priority)} /> : null}
          {w.category ? <Badge label={w.category} tone="neutral" /> : null}
        </View>
      </View>

      <View style={{ marginBottom: theme.spacing.md }}>
        <Button label="Edit work order" variant="secondary" onPress={() => router.push(`/workorder/new?id=${w.id}`)} />
      </View>

      <Card
        onPress={w.contact ? () => router.push(`/contact/${w.contact!.id}`) : undefined}
        style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}
      >
        <Row label="Customer" value={contactName(w.contact)} />
        <RowLink label="Address" value={address} onPress={address !== "No address" ? () => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`) : undefined} />
        <Row label="Crew" value={w.crew?.name ?? "Unassigned"} />
      </Card>

      <Card style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <Row label="Scheduled" value={fmtDateTime(w.scheduled_start)} />
        <Row label="Est. duration" value={w.estimated_duration_hours != null ? `${w.estimated_duration_hours} hrs` : "—"} />
        <Row label="Est. cost" value={w.estimated_cost != null ? fmtMoney(w.estimated_cost) : "—"} />
      </Card>

      {w.description ? (
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginBottom: 4 }}>Description</Text>
          <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base }}>{w.description}</Text>
        </Card>
      ) : null}

      {w.internal_notes || w.notes ? (
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginBottom: 4 }}>Notes</Text>
          <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base }}>{w.internal_notes || w.notes}</Text>
        </Card>
      ) : null}

      <WorkOrderPhotos workOrderId={w.id} before={w.before_photos} after={w.after_photos} />

      <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: "700", marginBottom: theme.spacing.sm }}>
        Update status
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
        {WORK_ORDER_STATUSES.map((s) => {
          const active = (w.status ?? "").toLowerCase() === s;
          return (
            <View key={s} style={{ flexBasis: "48%" }}>
              <Button
                label={titleCase(s)}
                variant={active ? "primary" : "ghost"}
                loading={updateStatus.isPending && updateStatus.variables?.status === s}
                onPress={() => updateStatus.mutate({ id: w.id, status: s })}
              />
            </View>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>{label}</Text>
      <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.sm, flex: 1, textAlign: "right" }} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function RowLink({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>{label}</Text>
      <Text
        onPress={onPress}
        style={{ color: onPress ? theme.colors.accent : theme.colors.text, fontSize: theme.fontSize.sm, flex: 1, textAlign: "right" }}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}
