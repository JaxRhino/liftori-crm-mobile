/**
 * CSC close-out + certify — the demo wow.
 *
 * Pre-certify: areas-not-accessible note + manager typed-signature (name +
 * explicit consent + timestamp, same audited pattern as the estimate e-sign),
 * gated on all required photos being present. On submit → closeOutCleaning
 * mints the certificate + QR sticker and seals the cleaning.
 *
 * Post-certify (or once certified): render the certificate, the QR sticker,
 * "Submit to Fire Marshal" (pushToAhj), and "Send to Restaurant".
 */
import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, Share, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Sheet } from "@/components/ui/Sheet";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/StateViews";
import {
  useAhjJurisdictions,
  useCleaning,
  useCloseOutCleaning,
  usePushToAhj,
} from "@/lib/hooks/useCsc";
import {
  fetchCertificate,
  photoCompleteness,
  type CscCertificate,
} from "@/lib/services/csc";
import { useAccent } from "@/lib/org";
import { theme } from "@/lib/theme";
import { fmtDate, fmtDateTime } from "@/lib/format";

export default function CloseoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const accent = useAccent();
  const { data: c, isLoading, isError, error } = useCleaning(id!);
  const closeOut = useCloseOutCleaning();

  const [managerName, setManagerName] = useState("");
  const [areas, setAreas] = useState("");
  const [consent, setConsent] = useState(false);

  if (isLoading)
    return (
      <ScreenContainer scroll={false}>
        <LoadingView />
      </ScreenContainer>
    );
  if (isError)
    return (
      <ScreenContainer scroll={false}>
        <ErrorView message={(error as Error)?.message} />
      </ScreenContainer>
    );
  if (!c)
    return (
      <ScreenContainer scroll={false}>
        <EmptyState icon="shield-checkmark-outline" title="Cleaning not found" />
      </ScreenContainer>
    );

  // Already certified → show the certificate panel.
  if (c.certificate_id) {
    return <CertificatePanel cleaningId={c.id} certId={c.certificate_id} />;
  }

  const photos = photoCompleteness(c.photos ?? []);
  const r = c.restaurant;

  const onCertify = () => {
    if (!photos.complete) {
      Alert.alert(
        "Photos required",
        `Capture all ${photos.total} required before/after photos first (${photos.done} done).`
      );
      return;
    }
    if (!managerName.trim()) {
      Alert.alert("Name required", "Type the on-site manager's full name to sign off.");
      return;
    }
    if (!consent) {
      Alert.alert("Consent required", "Confirm the manager attests the work was completed.");
      return;
    }
    Alert.alert(
      "Certify cleaning",
      `Seal this cleaning and issue an NFPA-96 certificate signed by "${managerName.trim()}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Certify",
          onPress: () =>
            closeOut.mutate(
              {
                id: c.id,
                input: { managerName: managerName.trim(), areasNotAccessible: areas.trim() || null },
              },
              { onError: (err) => Alert.alert("Could not certify", (err as Error).message) }
            ),
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <View style={{ marginVertical: theme.spacing.md }}>
        <Text
          style={{ color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: "800" }}
        >
          Close out & certify
        </Text>
        <Text
          style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginTop: 2 }}
        >
          {r?.name ?? "Restaurant"}
          {r?.location_label ? ` · ${r.location_label}` : ""}
        </Text>
      </View>

      {/* Photo gate */}
      <Card
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: theme.spacing.md,
          borderColor: photos.complete ? theme.colors.success : theme.colors.warning,
        }}
      >
        <Ionicons
          name={photos.complete ? "checkmark-circle" : "camera-outline"}
          size={28}
          color={photos.complete ? theme.colors.success : theme.colors.warning}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "700" }}>
            Required photos
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
            {photos.complete
              ? "All before/after slots filled."
              : `${photos.done} of ${photos.total} slots filled — finish in Photos.`}
          </Text>
        </View>
        {photos.complete ? (
          <Badge label="Ready" tone="success" />
        ) : (
          <Badge label="Incomplete" tone="warning" />
        )}
      </Card>

      {/* Areas not accessible */}
      <Card style={{ marginBottom: theme.spacing.md }}>
        <Input
          label="Areas not accessible (optional)"
          value={areas}
          onChangeText={setAreas}
          placeholder="e.g. rooftop fan — locked roof hatch"
          multiline
          style={{ minHeight: 64, textAlignVertical: "top" }}
        />
      </Card>

      {/* Manager signature */}
      <Card elevated style={{ gap: theme.spacing.sm }}>
        <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: "800" }}>
          Manager sign-off
        </Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
          Have the on-site manager review, type their full legal name, and attest. This records an
          audited e-signature (name, consent, timestamp).
        </Text>
        <Input
          label="Manager full name"
          value={managerName}
          onChangeText={setManagerName}
          placeholder="Jordan Manager"
          autoCapitalize="words"
        />
        <Pressable
          onPress={() => setConsent((v) => !v)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingVertical: 6,
            minHeight: 44,
            marginBottom: theme.spacing.sm,
          }}
        >
          <Ionicons
            name={consent ? "checkbox" : "square-outline"}
            size={26}
            color={consent ? accent : theme.colors.textMuted}
          />
          <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.sm, flex: 1 }}>
            I confirm the kitchen-exhaust system was cleaned per NFPA-96 and the details above are
            accurate.
          </Text>
        </Pressable>
        <Button
          label={closeOut.isPending ? "Certifying…" : "Certify & issue certificate"}
          loading={closeOut.isPending}
          onPress={onCertify}
          iconLeft={
            <Ionicons name="shield-checkmark-outline" size={18} color="#0b0f17" />
          }
        />
      </Card>
      <View style={{ height: theme.spacing.lg }} />
    </ScreenContainer>
  );
}

// ── Certificate panel (post-certify) ─────────────────────────────────────────

function CertificatePanel({ cleaningId, certId }: { cleaningId: string; certId: string }) {
  const accent = useAccent();
  const { data: c } = useCleaning(cleaningId);
  const ahjQuery = useAhjJurisdictions();
  const pushAhj = usePushToAhj();
  const [cert, setCert] = useState<CscCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [ahjSheet, setAhjSheet] = useState(false);

  // Load the cert once.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchCertificate(certId)
      .then((data) => {
        if (alive) setCert(data);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [certId]);

  if (loading)
    return (
      <ScreenContainer scroll={false}>
        <LoadingView label="Loading certificate…" />
      </ScreenContainer>
    );
  if (!cert)
    return (
      <ScreenContainer scroll={false}>
        <EmptyState icon="ribbon-outline" title="Certificate not found" />
      </ScreenContainer>
    );

  const submitted = !!cert.ahj_submitted_at;
  const verifyUrl = cert.public_verify_url ?? cert.cert_number ?? "";

  const onSend = async () => {
    try {
      await Share.share({
        message: `${c?.restaurant?.name ?? "Your"} kitchen-exhaust cleaning is certified (NFPA-96). Certificate ${cert.cert_number}. Verify: ${verifyUrl}`,
      });
    } catch {
      /* user dismissed */
    }
  };

  const onPickAhj = (ahjId: string) => {
    setAhjSheet(false);
    pushAhj.mutate(
      { certId: cert.id, ahjId },
      {
        onSuccess: () => {
          setCert((prev) =>
            prev
              ? {
                  ...prev,
                  ahj_jurisdiction_id: ahjId,
                  ahj_submitted_at: new Date().toISOString(),
                  ahj_submission_method: "app",
                }
              : prev
          );
          Alert.alert("Submitted", "Certificate sent to the fire marshal.");
        },
        onError: (err) => Alert.alert("Could not submit", (err as Error).message),
      }
    );
  };

  return (
    <ScreenContainer>
      <Card
        elevated
        style={{ alignItems: "center", gap: theme.spacing.sm, marginTop: theme.spacing.md, borderColor: theme.colors.success }}
      >
        <Ionicons name="ribbon" size={40} color={theme.colors.success} />
        <Text
          style={{ color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: "800", textAlign: "center" }}
        >
          NFPA-96 Certificate
        </Text>
        <Text style={{ color: accent, fontSize: theme.fontSize.lg, fontWeight: "800" }}>
          {cert.cert_number}
        </Text>

        {/* QR sticker */}
        <View
          style={{
            backgroundColor: "#ffffff",
            padding: theme.spacing.md,
            borderRadius: theme.radius.md,
            marginVertical: theme.spacing.sm,
          }}
        >
          <QRCode value={verifyUrl || cert.cert_number || "CSC"} size={168} />
        </View>
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs, textAlign: "center" }}>
          Scan to verify · {verifyUrl}
        </Text>
      </Card>

      <Card style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
        <Row label="Issued" value={fmtDateTime(cert.issued_at)} />
        <Row label="Expires" value={fmtDate(cert.expires_at)} />
        {cert.tech_name ? <Row label="Tech" value={cert.tech_name} /> : null}
        {cert.supervisor_name ? <Row label="Supervisor" value={cert.supervisor_name} /> : null}
        {cert.grease_depth_pre_inches != null ? (
          <Row label="Grease (pre)" value={`${cert.grease_depth_pre_inches}"`} />
        ) : null}
        {cert.grease_depth_post_inches != null ? (
          <Row label="Grease (post)" value={`${cert.grease_depth_post_inches}"`} />
        ) : null}
        {cert.areas_not_accessible ? (
          <Row label="Not accessible" value={cert.areas_not_accessible} />
        ) : null}
        {c?.signature_manager_name ? (
          <Row label="Signed by" value={c.signature_manager_name} />
        ) : null}
      </Card>

      {/* Wave 2: PDF generated by edge fn (cert.pdf_url). */}
      {cert.pdf_url ? (
        <View style={{ marginTop: theme.spacing.md }}>
          <Button
            label="Open PDF"
            variant="secondary"
            onPress={() => Linking.openURL(cert.pdf_url!)}
          />
        </View>
      ) : null}

      <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
        {submitted ? (
          <Card
            style={{ flexDirection: "row", alignItems: "center", gap: 10, borderColor: theme.colors.success }}
          >
            <Ionicons name="checkmark-circle" size={22} color={theme.colors.success} />
            <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.sm, flex: 1 }}>
              Submitted to fire marshal · {fmtDateTime(cert.ahj_submitted_at)}
            </Text>
          </Card>
        ) : (
          <Button
            label={pushAhj.isPending ? "Submitting…" : "Submit to Fire Marshal"}
            loading={pushAhj.isPending}
            onPress={() => setAhjSheet(true)}
            iconLeft={<Ionicons name="flame-outline" size={18} color="#0b0f17" />}
          />
        )}
        <Button
          label="Send to Restaurant"
          variant="secondary"
          onPress={onSend}
          iconLeft={<Ionicons name="send-outline" size={18} color={theme.colors.text} />}
        />
      </View>

      <Sheet visible={ahjSheet} onClose={() => setAhjSheet(false)} title="Select jurisdiction">
        {ahjQuery.isLoading ? (
          <LoadingView />
        ) : (ahjQuery.data ?? []).length === 0 ? (
          <EmptyState icon="business-outline" title="No jurisdictions" subtitle="Add AHJs in the CSC office." />
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            {(ahjQuery.data ?? []).map((a) => (
              <Pressable
                key={a.id}
                onPress={() => onPickAhj(a.id)}
                style={({ pressed }) => ({
                  paddingVertical: 14,
                  minHeight: 48,
                  paddingHorizontal: theme.spacing.sm,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.surface,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "600" }}>
                  {a.name ?? "Jurisdiction"}
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>
                  {[a.city, a.county, a.state].filter(Boolean).join(", ")}
                  {a.accepts_digital_certs ? " · accepts digital" : ""}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </Sheet>
      <View style={{ height: theme.spacing.lg }} />
    </ScreenContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>{label}</Text>
      <Text
        style={{ color: theme.colors.text, fontSize: theme.fontSize.sm, flex: 1, textAlign: "right" }}
        numberOfLines={3}
      >
        {value}
      </Text>
    </View>
  );
}
