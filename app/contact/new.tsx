import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Segmented } from "@/components/ui/Segmented";
import { LoadingView } from "@/components/ui/StateViews";
import { useContact, useSaveContact } from "@/lib/hooks/useSales";
import type { ContactInput } from "@/lib/services/sales";
import { theme } from "@/lib/theme";

const TYPES = ["lead", "customer", "past_customer"] as const;

export default function ContactForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = !!id;
  const router = useRouter();
  const existing = useContact(id ?? "");
  const save = useSaveContact();

  const [f, setF] = useState<ContactInput>({ contact_type: "lead" });
  const set = (k: keyof ContactInput) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (editing && existing.data) {
      const c = existing.data;
      setF({
        first_name: c.first_name, last_name: c.last_name, email: c.email, phone: c.phone,
        property_address: c.property_address, property_city: c.property_city,
        property_state: c.property_state, property_zip: c.property_zip,
        property_type: c.property_type, contact_type: c.contact_type ?? "lead",
        lead_source: c.lead_source, notes: c.notes,
      });
    }
  }, [editing, existing.data]);

  if (editing && existing.isLoading) {
    return <ScreenContainer scroll={false}><LoadingView /></ScreenContainer>;
  }

  const onSave = () => {
    if (!f.first_name?.trim() && !f.last_name?.trim() && !f.phone?.trim()) {
      Alert.alert("Add a name or phone", "Give the contact at least a name or phone number.");
      return;
    }
    save.mutate(
      { id, input: f },
      {
        onSuccess: () => router.back(),
        onError: (e) => Alert.alert("Could not save", (e as Error).message),
      }
    );
  };

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: editing ? "Edit Contact" : "New Contact" }} />
      <View style={{ height: theme.spacing.md }} />
      <Card style={{ marginBottom: theme.spacing.md }}>
        <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <Input label="First name" value={f.first_name ?? ""} onChangeText={set("first_name")} autoCapitalize="words" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Last name" value={f.last_name ?? ""} onChangeText={set("last_name")} autoCapitalize="words" />
          </View>
        </View>
        <Input label="Phone" value={f.phone ?? ""} onChangeText={set("phone")} keyboardType="phone-pad" />
        <Input label="Email" value={f.email ?? ""} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" />
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginBottom: 6 }}>Type</Text>
        <Segmented
          value={(f.contact_type as (typeof TYPES)[number]) ?? "lead"}
          onChange={(v) => setF((p) => ({ ...p, contact_type: v }))}
          options={TYPES.map((t) => ({ key: t, label: t === "past_customer" ? "Past" : t[0].toUpperCase() + t.slice(1) }))}
        />
        <View style={{ height: theme.spacing.md }} />
        <Input label="Lead source" value={f.lead_source ?? ""} onChangeText={set("lead_source")} placeholder="Referral, Google, door knock…" />
      </Card>

      <Card style={{ marginBottom: theme.spacing.md }}>
        <Input label="Property address" value={f.property_address ?? ""} onChangeText={set("property_address")} />
        <Input label="City" value={f.property_city ?? ""} onChangeText={set("property_city")} />
        <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <Input label="State" value={f.property_state ?? ""} onChangeText={set("property_state")} autoCapitalize="characters" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="ZIP" value={f.property_zip ?? ""} onChangeText={set("property_zip")} keyboardType="number-pad" />
          </View>
        </View>
        <Input label="Property type" value={f.property_type ?? ""} onChangeText={set("property_type")} placeholder="Residential, commercial…" />
      </Card>

      <Card style={{ marginBottom: theme.spacing.md }}>
        <Input label="Notes" value={f.notes ?? ""} onChangeText={set("notes")} multiline style={{ minHeight: 80, textAlignVertical: "top" }} />
      </Card>

      <Button label={save.isPending ? "Saving…" : editing ? "Save changes" : "Create contact"} loading={save.isPending} onPress={onSave} />
    </ScreenContainer>
  );
}
