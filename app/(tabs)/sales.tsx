import { useState } from "react";
import { RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, toneForStatus } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Segmented } from "@/components/ui/Segmented";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/StateViews";
import { useContacts, useDeals } from "@/lib/hooks/useSales";
import { contactName, type Deal } from "@/lib/services/sales";
import { useAccent } from "@/lib/org";
import { theme } from "@/lib/theme";
import { fmtCurrency, fmtDate, initials } from "@/lib/format";

type Tab = "pipeline" | "contacts";

export default function SalesScreen() {
  const [tab, setTab] = useState<Tab>("pipeline");
  const accent = useAccent();
  const router = useRouter();
  const deals = useDeals();
  const contacts = useContacts();

  const refreshing = deals.isFetching || contacts.isFetching;
  const onRefresh = () => {
    deals.refetch();
    contacts.refetch();
  };

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />
      }
    >
      <View style={{ paddingTop: theme.spacing.md, marginBottom: theme.spacing.md }}>
        <Text
          style={{ color: theme.colors.text, fontSize: theme.fontSize["2xl"], fontWeight: "800" }}
        >
          Sales
        </Text>
      </View>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { key: "pipeline", label: `Pipeline (${deals.data?.length ?? 0})` },
          { key: "contacts", label: `Customers (${contacts.data?.length ?? 0})` },
        ]}
      />

      <View style={{ height: theme.spacing.md }} />

      <Button
        label={tab === "pipeline" ? "+ New deal" : "+ New customer"}
        onPress={() => router.push(tab === "pipeline" ? "/deal/new" : "/contact/new")}
      />

      <View style={{ height: theme.spacing.md }} />

      {tab === "pipeline" ? (
        deals.isLoading ? (
          <LoadingView />
        ) : deals.isError ? (
          <ErrorView message={(deals.error as Error)?.message} />
        ) : (deals.data ?? []).length === 0 ? (
          <EmptyState icon="trending-up-outline" title="No deals yet" subtitle="Deals from your pipeline show up here." />
        ) : (
          <PipelineList deals={deals.data!} />
        )
      ) : contacts.isLoading ? (
        <LoadingView />
      ) : contacts.isError ? (
        <ErrorView message={(contacts.error as Error)?.message} />
      ) : (contacts.data ?? []).length === 0 ? (
        <EmptyState icon="people-outline" title="No customers yet" />
      ) : (
        <ContactsList contacts={contacts.data!} />
      )}
    </ScreenContainer>
  );
}

function PipelineList({ deals }: { deals: Deal[] }) {
  const router = useRouter();
  return (
    <View style={{ gap: theme.spacing.md }}>
      {deals.map((d) => (
        <Card key={d.id} onPress={() => router.push(`/deal/${d.id}`)}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <Text
              style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "700", flex: 1 }}
              numberOfLines={1}
            >
              {d.title ?? contactName(d.contact)}
            </Text>
            <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "800" }}>
              {fmtCurrency(d.deal_value)}
            </Text>
          </View>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginTop: 2 }} numberOfLines={1}>
            {contactName(d.contact)}
            {d.service_type ? ` · ${d.service_type}` : ""}
          </Text>
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
  );
}

function ContactsList({ contacts }: { contacts: ReturnType<typeof useContacts>["data"] }) {
  const router = useRouter();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      {(contacts ?? []).map((c) => (
        <Card key={c.id} onPress={() => router.push(`/contact/${c.id}`)}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Avatar initials={initials(c.first_name, c.last_name)} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "700" }} numberOfLines={1}>
                {`${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || c.email || "Unnamed"}
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }} numberOfLines={1}>
                {[c.property_city, c.property_state].filter(Boolean).join(", ") || c.phone || c.email || ""}
              </Text>
            </View>
            {c.contact_type ? <Badge label={c.contact_type} tone="info" /> : null}
          </View>
        </Card>
      ))}
    </View>
  );
}
