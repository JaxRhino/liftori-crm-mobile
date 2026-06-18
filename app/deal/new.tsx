import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { LoadingView } from "@/components/ui/StateViews";
import { useContacts, useDeal, useSalesStages, useSaveDeal } from "@/lib/hooks/useSales";
import { contactName, type DealInput } from "@/lib/services/sales";
import { useAccent } from "@/lib/org";
import { theme } from "@/lib/theme";

export default function DealForm() {
  const { id, contactId } = useLocalSearchParams<{ id?: string; contactId?: string }>();
  const editing = !!id;
  const router = useRouter();
  const accent = useAccent();
  const existing = useDeal(id ?? "");
  const contacts = useContacts();
  const stages = useSalesStages();
  const save = useSaveDeal();

  const [f, setF] = useState<DealInput>({ contact_id: contactId ?? null });
  const [valueStr, setValueStr] = useState("");
  const [pickContact, setPickContact] = useState(false);
  const set = (k: keyof DealInput) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (editing && existing.data) {
      const d = existing.data;
      setF({
        contact_id: d.contact_id, title: d.title, service_type: d.service_type,
        stage: d.stage, deal_value: d.deal_value, probability: d.probability,
        expected_close_date: d.expected_close_date, notes: d.notes,
      });
      setValueStr(d.deal_value != null ? String(d.deal_value) : "");
    }
  }, [editing, existing.data]);

  if (editing && existing.isLoading) {
    return <ScreenContainer scroll={false}><LoadingView /></ScreenContainer>;
  }

  const selectedContact = (contacts.data ?? []).find((c) => c.id === f.contact_id);

  const onSave = () => {
    if (!f.title?.trim()) {
      Alert.alert("Add a title", "Give the deal a short title (e.g. Roof replacement).");
      return;
    }
    const payload: DealInput = {
      ...f,
      deal_value: valueStr ? Number(valueStr.replace(/[^0-9.]/g, "")) : null,
      probability: f.probability != null ? Number(f.probability) : null,
    };
    save.mutate(
      { id, input: payload },
      { onSuccess: () => router.back(), onError: (e) => Alert.alert("Could not save", (e as Error).message) }
    );
  };

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: editing ? "Edit Deal" : "New Deal" }} />
      <View style={{ height: theme.spacing.md }} />
      <Card style={{ marginBottom: theme.spacing.md }}>
        <Input label="Title" value={f.title ?? ""} onChangeText={set("title")} placeholder="Roof replacement — Oak St" />
        <Input label="Service type" value={f.service_type ?? ""} onChangeText={set("service_type")} placeholder="Re-roof, repair, inspection…" />

        <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginBottom: 6 }}>Customer</Text>
        <Pressable
          onPress={() => setPickContact(true)}
          style={{
            backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
            borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md - 2,
            flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: theme.spacing.md,
          }}
        >
          <Text style={{ color: selectedContact ? theme.colors.text : theme.colors.textMuted, fontSize: theme.fontSize.base }}>
            {selectedContact ? contactName(selectedContact) : "Select a customer"}
          </Text>
          <Ionicons name="chevron-down" size={18} color={theme.colors.textMuted} />
        </Pressable>

        <Input label="Deal value ($)" value={valueStr} onChangeText={setValueStr} keyboardType="numeric" placeholder="12000" />
        <Input label="Expected close (YYYY-MM-DD)" value={f.expected_close_date ?? ""} onChangeText={set("expected_close_date")} autoCapitalize="none" placeholder="2026-07-15" />
      </Card>

      <Card style={{ marginBottom: theme.spacing.md }}>
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginBottom: 8 }}>Stage</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {(stages.data ?? []).map((s) => {
            const active = (f.stage ?? "").toLowerCase() === s.key.toLowerCase();
            return (
              <Pressable
                key={s.id}
                onPress={() => setF((p) => ({ ...p, stage: s.key }))}
                style={{
                  paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.radius.pill,
                  backgroundColor: active ? accent : theme.colors.surfaceElevated,
                  borderWidth: 1, borderColor: active ? accent : theme.colors.border,
                }}
              >
                <Text style={{ color: active ? "#0b0f17" : theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: "600" }}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={{ marginBottom: theme.spacing.md }}>
        <Input label="Notes" value={f.notes ?? ""} onChangeText={set("notes")} multiline style={{ minHeight: 80, textAlignVertical: "top" }} />
      </Card>

      <Button label={save.isPending ? "Saving…" : editing ? "Save changes" : "Create deal"} loading={save.isPending} onPress={onSave} />

      <Sheet visible={pickContact} onClose={() => setPickContact(false)} title="Select customer">
        <View style={{ maxHeight: 360 }}>
          {(contacts.data ?? []).map((c) => (
            <Pressable
              key={c.id}
              onPress={() => { setF((p) => ({ ...p, contact_id: c.id })); setPickContact(false); }}
              style={{ paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}
            >
              <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base }}>{contactName(c)}</Text>
              {c.property_city ? <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>{c.property_city}</Text> : null}
            </Pressable>
          ))}
          {(contacts.data ?? []).length === 0 ? (
            <Text style={{ color: theme.colors.textMuted }}>No customers yet — create one first.</Text>
          ) : null}
        </View>
      </Sheet>
    </ScreenContainer>
  );
}
