import { Linking, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/StateViews";
import { useContact } from "@/lib/hooks/useSales";
import { theme } from "@/lib/theme";
import { fmtMoney, initials } from "@/lib/format";

export default function ContactDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: c, isLoading, isError, error } = useContact(id!);

  if (isLoading) return <ScreenContainer scroll={false}><LoadingView /></ScreenContainer>;
  if (isError) return <ScreenContainer scroll={false}><ErrorView message={(error as Error)?.message} /></ScreenContainer>;
  if (!c) return <ScreenContainer scroll={false}><EmptyState icon="person-outline" title="Contact not found" /></ScreenContainer>;

  const name = `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "Unnamed contact";
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

      {c.notes ? (
        <Card style={{ marginTop: theme.spacing.md }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginBottom: 4 }}>Notes</Text>
          <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base }}>{c.notes}</Text>
        </Card>
      ) : null}
    </ScreenContainer>
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
