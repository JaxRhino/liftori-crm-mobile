import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Badge, toneForStatus } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/StateViews";
import { useDeal, useSalesStages, useUpdateDealStage } from "@/lib/hooks/useSales";
import { contactName } from "@/lib/services/sales";
import { useAccent } from "@/lib/org";
import { theme } from "@/lib/theme";
import { fmtCurrency, fmtDate } from "@/lib/format";

export default function DealDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const accent = useAccent();
  const { data: d, isLoading, isError, error } = useDeal(id!);
  const stages = useSalesStages();
  const updateStage = useUpdateDealStage();

  if (isLoading) return <ScreenContainer scroll={false}><LoadingView /></ScreenContainer>;
  if (isError) return <ScreenContainer scroll={false}><ErrorView message={(error as Error)?.message} /></ScreenContainer>;
  if (!d) return <ScreenContainer scroll={false}><EmptyState icon="trending-up-outline" title="Deal not found" /></ScreenContainer>;

  return (
    <ScreenContainer>
      <View style={{ marginVertical: theme.spacing.md }}>
        <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: "800" }}>
          {d.title ?? contactName(d.contact)}
        </Text>
        <Text style={{ color: accent, fontSize: theme.fontSize["2xl"], fontWeight: "800", marginTop: 4 }}>
          {fmtCurrency(d.deal_value)}
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: theme.spacing.sm }}>
          {d.stage ? <Badge label={d.stage} tone={toneForStatus(d.stage)} /> : null}
          {d.lead_temperature ? <Badge label={d.lead_temperature} tone="warning" /> : null}
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
        <View style={{ flex: 1 }}>
          <Button label="Edit deal" variant="secondary" onPress={() => router.push(`/deal/new?id=${d.id}`)} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="Create job"
            onPress={() =>
              router.push(
                `/workorder/new?contactId=${d.contact_id ?? ""}&title=${encodeURIComponent(d.title ?? "")}`
              )
            }
          />
        </View>
      </View>
      <View style={{ height: theme.spacing.md }} />

      <Card
        onPress={d.contact ? () => router.push(`/contact/${d.contact!.id}`) : undefined}
        style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}
      >
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>Contact</Text>
        <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "700" }}>
          {contactName(d.contact)}
        </Text>
        {d.service_type ? (
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>{d.service_type}</Text>
        ) : null}
      </Card>

      <Card style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <Row label="Probability" value={d.probability != null ? `${d.probability}%` : "—"} />
        <Row label="Expected close" value={fmtDate(d.expected_close_date)} />
        <Row label="Created" value={fmtDate(d.created_at)} />
      </Card>

      {d.notes ? (
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginBottom: 4 }}>Notes</Text>
          <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base }}>{d.notes}</Text>
        </Card>
      ) : null}

      {/* Move stage */}
      {(stages.data ?? []).length > 0 ? (
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: "700" }}>
            Move stage
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
            {stages.data!.map((s) => {
              const active = (d.stage ?? "").toLowerCase() === s.key.toLowerCase();
              return (
                <View key={s.id} style={{ flexBasis: "48%" }}>
                  <Button
                    label={s.label}
                    variant={active ? "primary" : "ghost"}
                    loading={updateStage.isPending && updateStage.variables?.stage === s.key}
                    onPress={() => updateStage.mutate({ id: d.id, stage: s.key })}
                  />
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>{label}</Text>
      <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.sm }}>{value}</Text>
    </View>
  );
}
