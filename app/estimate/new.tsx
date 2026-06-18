import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { LoadingView } from "@/components/ui/StateViews";
import {
  useEstimate,
  useEstimateTemplates,
  useSaveEstimate,
} from "@/lib/hooks/useEstimates";
import { useContacts } from "@/lib/hooks/useSales";
import { computeTotals, fetchTemplateItems, type EstimateInput } from "@/lib/services/estimates";
import { contactName } from "@/lib/services/sales";
import { useAccent } from "@/lib/org";
import { theme } from "@/lib/theme";
import { fmtMoney } from "@/lib/format";

type Row = { name: string; qty: string; price: string; unit: string };

export default function EstimateForm() {
  const { id, contactId } = useLocalSearchParams<{ id?: string; contactId?: string }>();
  const editing = !!id;
  const router = useRouter();
  const accent = useAccent();
  const existing = useEstimate(id ?? "");
  const contacts = useContacts();
  const templates = useEstimateTemplates();
  const save = useSaveEstimate();

  const [title, setTitle] = useState("");
  const [contactIdState, setContactIdState] = useState<string | null>(contactId ?? null);
  const [rows, setRows] = useState<Row[]>([{ name: "", qty: "1", price: "", unit: "ea" }]);
  const [taxRate, setTaxRate] = useState("0");
  const [discount, setDiscount] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [pickContact, setPickContact] = useState(false);
  const [pickTemplate, setPickTemplate] = useState(false);

  useEffect(() => {
    if (editing && existing.data) {
      const e = existing.data;
      setTitle(e.title ?? "");
      setContactIdState(e.contact_id ?? null);
      setTaxRate(String(e.tax_rate ?? 0));
      setDiscount(e.discount_amount ? String(e.discount_amount) : "");
      setValidUntil(e.valid_until ?? "");
      setNotes(e.notes ?? "");
      setTerms(e.terms ?? "");
      const items = Array.isArray(e.line_items) ? e.line_items : [];
      setRows(
        items.length
          ? items.map((it) => ({
              name: (it.name as string) || (it.description as string) || "",
              qty: String(it.quantity ?? 1),
              price: String(it.unit_price ?? 0),
              unit: (it.unit as string) || "ea",
            }))
          : [{ name: "", qty: "1", price: "", unit: "ea" }]
      );
    }
  }, [editing, existing.data]);

  const lineItems = useMemo(
    () =>
      rows
        .filter((r) => r.name.trim())
        .map((r) => {
          const quantity = Number(r.qty.replace(/[^0-9.]/g, "")) || 0;
          const unit_price = Number(r.price.replace(/[^0-9.]/g, "")) || 0;
          return { name: r.name.trim(), quantity, unit: r.unit, unit_price, total: +(quantity * unit_price).toFixed(2) };
        }),
    [rows]
  );
  const totals = computeTotals(lineItems, Number(taxRate) || 0, Number(discount) || 0);

  if (editing && existing.isLoading) {
    return <ScreenContainer scroll={false}><LoadingView /></ScreenContainer>;
  }

  const selectedContact = (contacts.data ?? []).find((c) => c.id === contactIdState);
  const setRow = (i: number, k: keyof Row, v: string) =>
    setRows((p) => p.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  const addRow = () => setRows((p) => [...p, { name: "", qty: "1", price: "", unit: "ea" }]);
  const removeRow = (i: number) => setRows((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : p));

  const loadTemplate = async (templateId: string) => {
    setPickTemplate(false);
    try {
      const items = await fetchTemplateItems(templateId);
      if (items.length) {
        setRows(items.map((it) => ({
          name: (it.name as string) ?? "",
          qty: String(it.quantity ?? 1),
          price: String(it.unit_price ?? 0),
          unit: (it.unit as string) || "ea",
        })));
      }
      const tmpl = (templates.data ?? []).find((t) => t.id === templateId);
      if (tmpl?.default_tax_rate != null) setTaxRate(String(tmpl.default_tax_rate));
      if (tmpl?.default_terms) setTerms(tmpl.default_terms);
      if (tmpl?.default_notes) setNotes(tmpl.default_notes);
    } catch (e) {
      Alert.alert("Could not load template", (e as Error).message);
    }
  };

  const onSave = () => {
    if (!title.trim()) { Alert.alert("Add a title", "Give the estimate a title."); return; }
    if (lineItems.length === 0) { Alert.alert("Add a line item", "Add at least one line item with a name."); return; }
    const input: EstimateInput = {
      contact_id: contactIdState,
      title,
      line_items: lineItems,
      tax_rate: Number(taxRate) || 0,
      discount_amount: Number(discount) || 0,
      valid_until: validUntil || null,
      notes,
      terms,
    };
    save.mutate(
      { id, input },
      { onSuccess: () => router.back(), onError: (e) => Alert.alert("Could not save", (e as Error).message) }
    );
  };

  const cellInput = {
    color: theme.colors.text, backgroundColor: theme.colors.bg, borderWidth: 1,
    borderColor: theme.colors.border, borderRadius: theme.radius.sm,
    paddingHorizontal: 8, paddingVertical: 8, fontSize: theme.fontSize.sm,
  } as const;

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: editing ? "Edit Estimate" : "New Estimate" }} />
      <View style={{ height: theme.spacing.md }} />

      <Card style={{ marginBottom: theme.spacing.md }}>
        <Input label="Title" value={title} onChangeText={setTitle} placeholder="Roof replacement — Oak St" />
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginBottom: 6 }}>Customer</Text>
        <Pressable
          onPress={() => setPickContact(true)}
          style={{ backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md - 2, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.md }}
        >
          <Text style={{ color: selectedContact ? theme.colors.text : theme.colors.textMuted, fontSize: theme.fontSize.base }}>
            {selectedContact ? contactName(selectedContact) : "Select a customer"}
          </Text>
          <Ionicons name="chevron-down" size={18} color={theme.colors.textMuted} />
        </Pressable>
        <Button label="Start from template" variant="ghost" onPress={() => setPickTemplate(true)} />
      </Card>

      {/* Line items */}
      <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: "700", marginBottom: theme.spacing.sm }}>
        Line items
      </Text>
      <Card style={{ marginBottom: theme.spacing.md, gap: theme.spacing.sm }}>
        {rows.map((r, i) => (
          <View key={i} style={{ gap: 6, paddingBottom: theme.spacing.sm, borderBottomWidth: i < rows.length - 1 ? 1 : 0, borderBottomColor: theme.colors.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TextInput value={r.name} onChangeText={(v) => setRow(i, "name", v)} placeholder={`Item ${i + 1}`} placeholderTextColor={theme.colors.textMuted} style={[cellInput, { flex: 1 }]} />
              <Pressable onPress={() => removeRow(i)} hitSlop={8}>
                <Ionicons name="close-circle" size={22} color={theme.colors.textMuted} />
              </Pressable>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.textMuted, fontSize: 10, marginBottom: 2 }}>Qty</Text>
                <TextInput value={r.qty} onChangeText={(v) => setRow(i, "qty", v)} keyboardType="numeric" style={cellInput} />
              </View>
              <View style={{ flex: 1.4 }}>
                <Text style={{ color: theme.colors.textMuted, fontSize: 10, marginBottom: 2 }}>Unit price</Text>
                <TextInput value={r.price} onChangeText={(v) => setRow(i, "price", v)} keyboardType="numeric" placeholder="0.00" placeholderTextColor={theme.colors.textMuted} style={cellInput} />
              </View>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={{ color: theme.colors.textMuted, fontSize: 10, marginBottom: 2 }}>Total</Text>
                <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: "700", paddingVertical: 8 }}>
                  {fmtMoney((Number(r.qty) || 0) * (Number(r.price) || 0))}
                </Text>
              </View>
            </View>
          </View>
        ))}
        <Pressable onPress={addRow} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 4 }}>
          <Ionicons name="add-circle" size={20} color={accent} />
          <Text style={{ color: accent, fontWeight: "700", fontSize: theme.fontSize.sm }}>Add line item</Text>
        </Pressable>
      </Card>

      {/* Pricing */}
      <Card style={{ marginBottom: theme.spacing.md }}>
        <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
          <View style={{ flex: 1 }}><Input label="Tax rate (%)" value={taxRate} onChangeText={setTaxRate} keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><Input label="Discount ($)" value={discount} onChangeText={setDiscount} keyboardType="numeric" placeholder="0" /></View>
        </View>
        <Input label="Valid until (YYYY-MM-DD)" value={validUntil} onChangeText={setValidUntil} autoCapitalize="none" placeholder="2026-07-31" />
        <View style={{ gap: 4, marginTop: 4 }}>
          <Row label="Subtotal" value={fmtMoney(totals.subtotal)} />
          {Number(discount) ? <Row label="Discount" value={`- ${fmtMoney(Number(discount))}`} /> : null}
          <Row label={`Tax (${Number(taxRate) || 0}%)`} value={fmtMoney(totals.tax_amount)} />
          <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 4 }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: "800" }}>Total</Text>
            <Text style={{ color: accent, fontSize: theme.fontSize.lg, fontWeight: "800" }}>{fmtMoney(totals.total)}</Text>
          </View>
        </View>
      </Card>

      <Card style={{ marginBottom: theme.spacing.md }}>
        <Input label="Notes" value={notes} onChangeText={setNotes} multiline style={{ minHeight: 60, textAlignVertical: "top" }} />
        <Input label="Terms" value={terms} onChangeText={setTerms} multiline style={{ minHeight: 60, textAlignVertical: "top" }} />
      </Card>

      <Button label={save.isPending ? "Saving…" : editing ? "Save estimate" : "Create estimate"} loading={save.isPending} onPress={onSave} />

      <Sheet visible={pickContact} onClose={() => setPickContact(false)} title="Select customer">
        <View style={{ maxHeight: 360 }}>
          {(contacts.data ?? []).map((c) => (
            <Pressable key={c.id} onPress={() => { setContactIdState(c.id); setPickContact(false); }} style={{ paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
              <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base }}>{contactName(c)}</Text>
            </Pressable>
          ))}
        </View>
      </Sheet>

      <Sheet visible={pickTemplate} onClose={() => setPickTemplate(false)} title="Start from template">
        <View style={{ maxHeight: 360 }}>
          {(templates.data ?? []).map((t) => (
            <Pressable key={t.id} onPress={() => loadTemplate(t.id)} style={{ paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
              <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base }}>{t.name ?? "Template"}</Text>
              {t.service_type ? <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>{t.service_type}</Text> : null}
            </Pressable>
          ))}
          {(templates.data ?? []).length === 0 ? <Text style={{ color: theme.colors.textMuted }}>No templates yet.</Text> : null}
        </View>
      </Sheet>
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
