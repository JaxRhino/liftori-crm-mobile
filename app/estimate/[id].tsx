import { useState } from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge, toneForStatus } from "@/components/ui/Badge";
import { SignaturePad } from "@/components/SignaturePad";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/StateViews";
import {
  useEstimate,
  useMarkEstimateSent,
  useSignEstimate,
} from "@/lib/hooks/useEstimates";
import { isSigned, type EstimateLineItem } from "@/lib/services/estimates";
import { contactName } from "@/lib/services/sales";
import { useAccent } from "@/lib/org";
import { theme } from "@/lib/theme";
import { fmtMoney, fmtDate, fmtDateTime } from "@/lib/format";

export default function EstimateDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const accent = useAccent();
  const router = useRouter();
  const { data: e, isLoading, isError, error } = useEstimate(id!);
  const sign = useSignEstimate();
  const markSent = useMarkEstimateSent();

  const [signerName, setSignerName] = useState("");
  const [consent, setConsent] = useState(false);
  const [sigB64, setSigB64] = useState<string | null>(null);

  if (isLoading) return <ScreenContainer scroll={false}><LoadingView /></ScreenContainer>;
  if (isError) return <ScreenContainer scroll={false}><ErrorView message={(error as Error)?.message} /></ScreenContainer>;
  if (!e) return <ScreenContainer scroll={false}><EmptyState icon="document-text-outline" title="Estimate not found" /></ScreenContainer>;

  const signed = isSigned(e);
  const items: EstimateLineItem[] = Array.isArray(e.line_items) ? e.line_items : [];

  const onSign = () => {
    if (!signerName.trim()) {
      Alert.alert("Name required", "Please type the customer's full name to sign.");
      return;
    }
    if (!consent) {
      Alert.alert("Consent required", "Please confirm the customer authorizes this estimate.");
      return;
    }
    Alert.alert(
      "Confirm signature",
      `Sign this estimate as "${signerName.trim()}"? This records an accepted, audited e-signature.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign",
          onPress: () =>
            sign.mutate(
              { id: e.id, signerName: signerName.trim(), signatureBase64: sigB64 },
              { onError: (err) => Alert.alert("Could not sign", (err as Error).message) }
            ),
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <View style={{ marginVertical: theme.spacing.md }}>
        <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: "800" }}>
          {e.title ?? e.estimate_number ?? "Estimate"}
        </Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginTop: 2 }}>
          {contactName(e.contact)}
          {e.estimate_number ? ` · ${e.estimate_number}` : ""}
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: theme.spacing.sm }}>
          {signed ? (
            <Badge label="Signed" tone="success" />
          ) : (
            <Badge label={e.esign_status ?? e.status ?? "draft"} tone={toneForStatus(e.esign_status ?? e.status)} />
          )}
          {e.valid_until ? (
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs, alignSelf: "center" }}>
              Valid to {fmtDate(e.valid_until)}
            </Text>
          ) : null}
        </View>
      </View>

      {!signed ? (
        <View style={{ marginBottom: theme.spacing.md }}>
          <Button label="Edit estimate" variant="secondary" onPress={() => router.push(`/estimate/new?id=${e.id}`)} />
        </View>
      ) : null}

      {e.intro ? (
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base }}>{e.intro}</Text>
        </Card>
      ) : null}

      {/* Line items */}
      <Card style={{ marginBottom: theme.spacing.md, gap: 0, paddingVertical: 0 }}>
        {items.length === 0 ? (
          <Text style={{ color: theme.colors.textMuted, paddingVertical: theme.spacing.md }}>
            No line items.
          </Text>
        ) : (
          items.map((it, i) => {
            const name = (it.name as string) || (it.description as string) || `Item ${i + 1}`;
            const qty = Number(it.quantity ?? 1);
            const price = Number(it.unit_price ?? 0);
            const total = it.total != null ? Number(it.total) : qty * price;
            return (
              <View
                key={i}
                style={{
                  paddingVertical: theme.spacing.md,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: theme.colors.border,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                  <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "600", flex: 1 }}>
                    {name}
                  </Text>
                  <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "700" }}>
                    {fmtMoney(total)}
                  </Text>
                </View>
                <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs, marginTop: 2 }}>
                  {qty} {(it.unit as string) || "ea"} × {fmtMoney(price)}
                </Text>
              </View>
            );
          })
        )}
      </Card>

      {/* Totals */}
      <Card style={{ marginBottom: theme.spacing.md, gap: 6 }}>
        <TotalRow label="Subtotal" value={fmtMoney(e.subtotal)} />
        {e.discount_amount ? <TotalRow label="Discount" value={`- ${fmtMoney(e.discount_amount)}`} /> : null}
        <TotalRow label={`Tax${e.tax_rate ? ` (${e.tax_rate}%)` : ""}`} value={fmtMoney(e.tax_amount)} />
        <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 4 }} />
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: "800" }}>Total</Text>
          <Text style={{ color: accent, fontSize: theme.fontSize.lg, fontWeight: "800" }}>{fmtMoney(e.total)}</Text>
        </View>
      </Card>

      {e.terms ? (
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginBottom: 4 }}>Terms</Text>
          <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.sm }}>{e.terms}</Text>
        </Card>
      ) : null}

      {/* Signature */}
      {signed ? (
        <Card elevated style={{ alignItems: "center", gap: 6, borderColor: theme.colors.success }}>
          <Ionicons name="checkmark-circle" size={36} color={theme.colors.success} />
          <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: "800" }}>
            Signed by {e.signer_name ?? "customer"}
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
            {fmtDateTime(e.esign_signed_at)}
          </Text>
          {e.signer_ip ? (
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>
              IP {e.signer_ip}
            </Text>
          ) : null}
          {e.signature_url ? (
            <Image
              source={{ uri: e.signature_url }}
              resizeMode="contain"
              style={{ width: "100%", height: 120, backgroundColor: "#fff", borderRadius: theme.radius.md, marginTop: theme.spacing.sm }}
            />
          ) : null}
        </Card>
      ) : (
        <Card elevated style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: "800" }}>
            Sign-off
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
            Have the customer review the estimate, type their full legal name, and authorize. This records an audited e-signature (name, consent, timestamp, IP).
          </Text>
          <Input
            label="Customer full name"
            value={signerName}
            onChangeText={setSignerName}
            placeholder="Jane Homeowner"
            autoCapitalize="words"
          />
          <Pressable
            onPress={() => setConsent((v) => !v)}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4, marginBottom: theme.spacing.sm }}
          >
            <Ionicons
              name={consent ? "checkbox" : "square-outline"}
              size={24}
              color={consent ? accent : theme.colors.textMuted}
            />
            <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.sm, flex: 1 }}>
              I authorize {contactName(e.contact)} to perform the work for {fmtMoney(e.total)} as described above.
            </Text>
          </Pressable>

          <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginBottom: 6 }}>
            Signature {sigB64 ? "✓ captured" : "(optional — draw below)"}
          </Text>
          <SignaturePad accent={accent} onCapture={setSigB64} />
          <View style={{ height: theme.spacing.sm }} />

          <Button
            label={sign.isPending ? "Signing…" : "Authorize & sign"}
            loading={sign.isPending}
            onPress={onSign}
          />
          {(e.esign_status ?? "").toLowerCase() !== "sent" ? (
            <Button
              label="Mark as sent"
              variant="ghost"
              loading={markSent.isPending}
              onPress={() => markSent.mutate(e.id)}
            />
          ) : null}
        </Card>
      )}
    </ScreenContainer>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>{label}</Text>
      <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.sm }}>{value}</Text>
    </View>
  );
}
