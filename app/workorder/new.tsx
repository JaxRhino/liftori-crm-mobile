import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { Segmented } from "@/components/ui/Segmented";
import { LoadingView } from "@/components/ui/StateViews";
import { useCrews, useSaveWorkOrder, useWorkOrder } from "@/lib/hooks/useOperations";
import { useContacts } from "@/lib/hooks/useSales";
import { contactName } from "@/lib/services/sales";
import type { WorkOrderInput } from "@/lib/services/operations";
import { theme } from "@/lib/theme";

const PRIORITIES = ["low", "medium", "high"] as const;

export default function WorkOrderForm() {
  const { id, contactId, title: titleParam } = useLocalSearchParams<{ id?: string; contactId?: string; title?: string }>();
  const editing = !!id;
  const router = useRouter();
  const existing = useWorkOrder(id ?? "");
  const contacts = useContacts();
  const crews = useCrews();
  const save = useSaveWorkOrder();

  const [f, setF] = useState<WorkOrderInput>({ priority: "medium", contact_id: contactId ?? null, title: titleParam ?? "" });
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [costStr, setCostStr] = useState("");
  const [hoursStr, setHoursStr] = useState("");
  const [pickContact, setPickContact] = useState(false);
  const [pickCrew, setPickCrew] = useState(false);
  const set = (k: keyof WorkOrderInput) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (editing && existing.data) {
      const w = existing.data;
      setF({
        title: w.title, description: w.description, status: w.status, priority: w.priority ?? "medium",
        category: w.category, contact_id: w.contact_id, address: w.address, city: w.city,
        state: w.state, zip: w.zip, assigned_crew_id: w.assigned_crew_id, notes: w.notes,
      });
      setCostStr(w.estimated_cost != null ? String(w.estimated_cost) : "");
      setHoursStr(w.estimated_duration_hours != null ? String(w.estimated_duration_hours) : "");
      if (w.scheduled_start) {
        const d = new Date(w.scheduled_start);
        if (!Number.isNaN(d.getTime())) {
          setDate(d.toISOString().slice(0, 10));
          setTime(d.toTimeString().slice(0, 5));
        }
      }
    }
  }, [editing, existing.data]);

  // Prefill address from the chosen contact when address is empty (e.g. deal convert).
  useEffect(() => {
    if (editing) return;
    const c = (contacts.data ?? []).find((x) => x.id === f.contact_id);
    if (c && !f.address) {
      setF((p) => ({
        ...p,
        address: c.property_address ?? p.address,
        city: c.property_city ?? p.city,
        state: c.property_state ?? p.state,
        zip: c.property_zip ?? p.zip,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.contact_id, contacts.data]);

  if (editing && existing.isLoading) {
    return <ScreenContainer scroll={false}><LoadingView /></ScreenContainer>;
  }

  const selectedContact = (contacts.data ?? []).find((c) => c.id === f.contact_id);
  const selectedCrew = (crews.data ?? []).find((c) => c.id === f.assigned_crew_id);

  const onSave = () => {
    if (!f.title?.trim()) { Alert.alert("Add a title", "Give the work order a title."); return; }
    let scheduled_start: string | null = null;
    if (date) {
      const d = new Date(`${date}T${time || "09:00"}:00`);
      if (!Number.isNaN(d.getTime())) scheduled_start = d.toISOString();
    }
    const input: WorkOrderInput = {
      ...f,
      scheduled_start,
      estimated_cost: costStr ? Number(costStr.replace(/[^0-9.]/g, "")) : null,
      estimated_duration_hours: hoursStr ? Number(hoursStr.replace(/[^0-9.]/g, "")) : null,
    };
    save.mutate(
      { id, input },
      { onSuccess: () => router.back(), onError: (e) => Alert.alert("Could not save", (e as Error).message) }
    );
  };

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: editing ? "Edit Work Order" : "New Work Order" }} />
      <View style={{ height: theme.spacing.md }} />

      <Card style={{ marginBottom: theme.spacing.md }}>
        <Input label="Title" value={f.title ?? ""} onChangeText={set("title")} placeholder="Tear-off + install" />
        <Input label="Category" value={f.category ?? ""} onChangeText={set("category")} placeholder="Re-roof, repair, inspection…" />
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginBottom: 6 }}>Priority</Text>
        <Segmented
          value={(f.priority as (typeof PRIORITIES)[number]) ?? "medium"}
          onChange={(v) => setF((p) => ({ ...p, priority: v }))}
          options={PRIORITIES.map((p) => ({ key: p, label: p[0].toUpperCase() + p.slice(1) }))}
        />
      </Card>

      <Card style={{ marginBottom: theme.spacing.md }}>
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginBottom: 6 }}>Customer</Text>
        <Pressable onPress={() => setPickContact(true)} style={pickStyle}>
          <Text style={{ color: selectedContact ? theme.colors.text : theme.colors.textMuted, fontSize: theme.fontSize.base }}>
            {selectedContact ? contactName(selectedContact) : "Select a contact"}
          </Text>
          <Ionicons name="chevron-down" size={18} color={theme.colors.textMuted} />
        </Pressable>
        <View style={{ height: theme.spacing.md }} />
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginBottom: 6 }}>Crew</Text>
        <Pressable onPress={() => setPickCrew(true)} style={pickStyle}>
          <Text style={{ color: selectedCrew ? theme.colors.text : theme.colors.textMuted, fontSize: theme.fontSize.base }}>
            {selectedCrew ? selectedCrew.name : "Unassigned"}
          </Text>
          <Ionicons name="chevron-down" size={18} color={theme.colors.textMuted} />
        </Pressable>
      </Card>

      <Card style={{ marginBottom: theme.spacing.md }}>
        <Input label="Job address" value={f.address ?? ""} onChangeText={set("address")} />
        <Input label="City" value={f.city ?? ""} onChangeText={set("city")} />
        <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
          <View style={{ flex: 1 }}><Input label="State" value={f.state ?? ""} onChangeText={set("state")} autoCapitalize="characters" /></View>
          <View style={{ flex: 1 }}><Input label="ZIP" value={f.zip ?? ""} onChangeText={set("zip")} keyboardType="number-pad" /></View>
        </View>
      </Card>

      <Card style={{ marginBottom: theme.spacing.md }}>
        <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
          <View style={{ flex: 1.4 }}><Input label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} autoCapitalize="none" placeholder="2026-07-01" /></View>
          <View style={{ flex: 1 }}><Input label="Time" value={time} onChangeText={setTime} autoCapitalize="none" placeholder="08:00" /></View>
        </View>
        <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
          <View style={{ flex: 1 }}><Input label="Est. cost ($)" value={costStr} onChangeText={setCostStr} keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><Input label="Est. hours" value={hoursStr} onChangeText={setHoursStr} keyboardType="numeric" /></View>
        </View>
      </Card>

      <Card style={{ marginBottom: theme.spacing.md }}>
        <Input label="Description" value={f.description ?? ""} onChangeText={set("description")} multiline style={{ minHeight: 60, textAlignVertical: "top" }} />
        <Input label="Internal notes" value={f.notes ?? ""} onChangeText={set("notes")} multiline style={{ minHeight: 60, textAlignVertical: "top" }} />
      </Card>

      <Button label={save.isPending ? "Saving…" : editing ? "Save work order" : "Create work order"} loading={save.isPending} onPress={onSave} />

      <Sheet visible={pickContact} onClose={() => setPickContact(false)} title="Select contact">
        <View style={{ maxHeight: 360 }}>
          {(contacts.data ?? []).map((c) => (
            <Pressable key={c.id} onPress={() => { setF((p) => ({ ...p, contact_id: c.id })); setPickContact(false); }} style={rowStyle}>
              <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base }}>{contactName(c)}</Text>
            </Pressable>
          ))}
        </View>
      </Sheet>

      <Sheet visible={pickCrew} onClose={() => setPickCrew(false)} title="Assign crew">
        <View style={{ maxHeight: 360 }}>
          <Pressable onPress={() => { setF((p) => ({ ...p, assigned_crew_id: null })); setPickCrew(false); }} style={rowStyle}>
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.base }}>Unassigned</Text>
          </Pressable>
          {(crews.data ?? []).map((c) => (
            <Pressable key={c.id} onPress={() => { setF((p) => ({ ...p, assigned_crew_id: c.id })); setPickCrew(false); }} style={rowStyle}>
              <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base }}>{c.name}</Text>
            </Pressable>
          ))}
        </View>
      </Sheet>
    </ScreenContainer>
  );
}

const pickStyle = {
  backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
  borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md - 2,
  flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const,
};
const rowStyle = {
  paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
};
