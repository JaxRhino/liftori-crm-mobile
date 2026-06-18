import { Linking, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, toneForStatus } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/StateViews";
import { useContact, useDealsForContact } from "@/lib/hooks/useSales";
import { useWorkOrdersForContact } from "@/lib/hooks/useOperations";
import { theme } from "@/lib/theme";
import { fmtMoney, fmtCurrency, fmtDate, fmtDateTime, initials } from "@/lib/format";

export default function ContactDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: c, isLoading, isError, error } = useContact(id!);

  if (isLoading) return <ScreenContainer scroll={false}><LoadingView /></ScreenContainer>;
  if (isError) return <ScreenContainer scroll={false}><ErrorView message={(error as Error)?.message} /></ScreenContainer>;
  if (!c) return <ScreenContainer scroll={false}><EmptyState icon="person-outline" title="Customer not found" /></ScreenContainer>;

  const name = `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "Unnamed customer";
  const address = [c.property_address, c.property_city, c.property_state, c.property_zip].filter(Boolean).join(", ");

  return (
    <ScreenContainer>
      <View style={{ alignItems: "center", gap: 8, marginVertical: theme.spacing.lg }}>
        <Avatar initials={initials(c.first_name, c.last_name)} size={64} />
        <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: "800" }}>
          {name}
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {c.contact_type ? <Badge label={c.contact_type} tone="info" /> : null}
          {c.lead_source ? <Badge label={c.lead_source} tone="neutral" /> : null}
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
        <View style={{ flex: 1 }}>
          <Button label="Call" variant="secondary" disabled={!c.phone} onPress={() => c.phone && Linking.openURL(`tel:${c.phone}`)} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Text" variant="secondary" disabled={!c.phone} onPress={() => c.phone && Linking.openURL(`sms:${c.phone}`)} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Email" variant="secondary" disabled={!c.email} onPress={() => c.email && Linking.openURL(`mailto:${c.email}`)} />
        </View>
      </View>

      <Card style={{ gap: theme.spacing.sm }}>
        <DetailRow label="Phone" value={c.phone ?? "—"} />
        <DetailRow label="Email" value={c.email ?? "—"} />
        <DetailRow
          label="Property"
          value={address || "—"}
          onPress={address ? () => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`) : undefined}
        />
        <DetailRow label="Property type" value={c.property_type ?? "—"} />
        <DetailRow label="Lifetime value" value={c.lifetime_value != null ? fmtMoney(c.lifetime_value) : "—"} />
      </Card>

      <View style={{ flexDirection: "row", gap: theme.spacing.md, marginTop: theme.spacing.md }}>
        <View style={{ flex: 1 }}>
          <Button label="Edit" variant="secondary" onPress={() => router.push(`/contact/new?id=${c.id}`)} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="+ New deal" onPress={() => router.push(`/deal/new?contactId=${c.id}`)} />
        </View>
      </View>

      <DealsSection contactId={c.id} />
      <JobsSection contactId={c.id} />

      {c.notes ? (
        <Card style={{ marginTop: theme.spacing.md }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginBottom: 4 }}>Notes</Text>
          <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base }}>{c.notes}</Text>
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <Text
      style={{
        color: theme.colors.text,
        fontSize: theme.fontSize.lg,
        fontWeight: "700",
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
      }}
    >
      {title}
      {count != null ? ` (${count})` : ""}
    </Text>
  );
}

function DealsSection({ contactId }: { contactId: string }) {
  const router = useRouter();
  const { data, isLoading, isError } = useDealsForContact(contactId);

  return (
    <View>
      <SectionHeader title="Deals" count={data?.length} />
      {isLoading ? (
        <Card><Text style={{ color: theme.colors.textMuted }}>Loading deals…</Text></Card>
      ) : isError ? (
        <Card><Text style={{ color: theme.colors.danger }}>Couldn't load deals.</Text></Card>
      ) : (data ?? []).length === 0 ? (
        <Card><Text style={{ color: theme.colors.textMuted }}>No deals yet for this customer.</Text></Card>
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {data!.map((d) => (
            <Card key={d.id} onPress={() => router.push(`/deal/${d.id}`)}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "700", flex: 1 }} numberOfLines={1}>
                  {d.title ?? "Deal"}
                </Text>
                <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "800" }}>
                  {fmtCurrency(d.deal_value)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: theme.spacing.sm }}>
                {d.stage ? <Badge label={d.stage} tone={toneForStatus(d.stage)} /> : null}
                {d.expected_close_date ? (
                  <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>
                    Close {fmtDate(d.expected_close_date)}
                  </Text>
                ) : null}
              </View>
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}

function JobsSection({ contactId }: { contactId: string }) {
  const router = useRouter();
  const { data, isLoading, isError } = useWorkOrdersForContact(contactId);

  return (
    <View>
      <SectionHeader title="Jobs" count={data?.length} />
      {isLoading ? (
        <Card><Text style={{ color: theme.colors.textMuted }}>Loading jobs…</Text></Card>
      ) : isError ? (
        <Card><Text style={{ color: theme.colors.danger }}>Couldn't load jobs.</Text></Card>
      ) : (data ?? []).length === 0 ? (
        <Card><Text style={{ color: theme.colors.textMuted }}>No jobs yet for this customer.</Text></Card>
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {data!.map((w) => (
            <Card key={w.id} onPress={() => router.push(`/workorder/${w.id}`)}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "700", flex: 1 }} numberOfLines={1}>
                  {w.title ?? w.work_order_number ?? "Job"}
                </Text>
                {w.status ? <Badge label={w.status} tone={toneForStatus(w.status)} /> : null}
              </View>
              {w.scheduled_start ? (
                <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs, marginTop: theme.spacing.sm }}>
                  Scheduled {fmtDateTime(w.scheduled_start)}
                </Text>
              ) : null}
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}

function DetailRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>{label}</Text>
      <Text
        onPress={onPress}
        style={{
          color: onPress ? theme.colors.accent : theme.colors.text,
          fontSize: theme.fontSize.sm,
          flex: 1,
          textAlign: "right",
        }}
      >
        {value}
      </Text>
    </View>
  );
}
