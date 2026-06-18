/**
 * CSC cleaning detail. Restaurant profile header, NFPA-96 checklist (toggle
 * list backed by csc_cleanings.checklist jsonb), prior open deficiencies, and
 * action buttons → Photos, Grease/AI, Close-out. Big touch targets, high
 * contrast for sunlight, color never the sole signal (badges carry text).
 *
 * A certified cleaning (certificate_id set) is immutable: toggles disabled,
 * close-out replaced by a "View certificate" link.
 */
import { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, toneForStatus } from "@/components/ui/Badge";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/StateViews";
import { useCleaning, useUpdateChecklist } from "@/lib/hooks/useCsc";
import {
  greaseLevel,
  normalizeStatus,
  openDeficiencies,
  photoCompleteness,
  readChecklist,
  restaurantAddress,
  type ChecklistItem,
} from "@/lib/services/csc";
import { useAccent } from "@/lib/org";
import { theme } from "@/lib/theme";
import { fmtDate, fmtDateTime, titleCase } from "@/lib/format";

export default function CleaningDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const accent = useAccent();
  const router = useRouter();
  const { data: c, isLoading, isError, error } = useCleaning(id!);
  const updateChecklist = useUpdateChecklist();

  const [items, setItems] = useState<ChecklistItem[]>([]);
  useEffect(() => {
    if (c) setItems(readChecklist(c.checklist));
  }, [c?.id, c?.updated_at]);

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
        <EmptyState icon="restaurant-outline" title="Cleaning not found" />
      </ScreenContainer>
    );

  const r = c.restaurant;
  const status = normalizeStatus(c.status);
  const certified = !!c.certificate_id;
  const photos = photoCompleteness(c.photos ?? []);
  const openDefs = openDeficiencies(c.deficiencies);
  const greaseDone = c.grease_depth_pre_inches != null;

  const toggle = (i: number) => {
    if (certified) return;
    const next = items.map((it, idx) => (idx === i ? { ...it, done: !it.done } : it));
    setItems(next);
    updateChecklist.mutate({ id: c.id, checklist: next });
  };

  const checkedCount = items.filter((it) => it.done).length;
  const address = restaurantAddress(r);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ marginVertical: theme.spacing.md }}>
        <Text
          style={{ color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: "800" }}
        >
          {r?.name ?? "Cleaning"}
        </Text>
        {r?.location_label ? (
          <Text
            style={{
              color: theme.colors.textMuted,
              fontSize: theme.fontSize.sm,
              marginTop: 2,
            }}
          >
            {r.location_label}
          </Text>
        ) : null}
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginTop: theme.spacing.sm,
            flexWrap: "wrap",
          }}
        >
          <Badge label={status} tone={toneForStatus(status)} />
          {certified ? <Badge label="Certified" tone="success" /> : null}
          {c.exceeded_threshold ? <Badge label="Over NFPA threshold" tone="warning" /> : null}
        </View>
      </View>

      {/* Restaurant profile */}
      <Card style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <RowLink
          label="Address"
          value={address}
          onPress={
            address !== "No address"
              ? () =>
                  Linking.openURL(
                    `https://maps.google.com/?q=${encodeURIComponent(address)}`
                  )
              : undefined
          }
        />
        <Row label="Scheduled" value={fmtDateTime(c.scheduled_at)} />
        <Row label="Cooking volume" value={titleCase(r?.cooking_volume) || "—"} />
        <Row label="Frequency" value={titleCase(r?.frequency_tier) || "—"} />
        <Row label="Hoods" value={r?.hood_count != null ? String(r.hood_count) : "—"} />
        <Row
          label="Duct length"
          value={r?.duct_length_feet != null ? `${r.duct_length_feet} ft` : "—"}
        />
        {c.tech_name ? <Row label="Tech" value={c.tech_name} /> : null}
      </Card>

      {r?.rooftop_access_notes ? (
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text
            style={{
              color: theme.colors.textMuted,
              fontSize: theme.fontSize.sm,
              marginBottom: 4,
            }}
          >
            Rooftop / access notes
          </Text>
          <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base }}>
            {r.rooftop_access_notes}
          </Text>
        </Card>
      ) : null}

      {/* NFPA-96 checklist */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: theme.spacing.sm,
        }}
      >
        <Text
          style={{ color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: "700" }}
        >
          NFPA-96 checklist
        </Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
          {checkedCount}/{items.length}
        </Text>
      </View>
      <Card style={{ gap: 0, paddingVertical: 0, marginBottom: theme.spacing.md }}>
        {items.map((it, i) => (
          <Pressable
            key={`${it.label}-${i}`}
            onPress={() => toggle(i)}
            disabled={certified}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingVertical: 14,
              minHeight: 48,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: theme.colors.border,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons
              name={it.done ? "checkbox" : "square-outline"}
              size={26}
              color={it.done ? accent : theme.colors.textMuted}
            />
            <Text
              style={{
                color: theme.colors.text,
                fontSize: theme.fontSize.base,
                flex: 1,
                textDecorationLine: it.done ? "line-through" : "none",
              }}
            >
              {it.label}
            </Text>
          </Pressable>
        ))}
      </Card>

      {/* Prior / open deficiencies */}
      {openDefs.length > 0 ? (
        <>
          <Text
            style={{
              color: theme.colors.text,
              fontSize: theme.fontSize.lg,
              fontWeight: "700",
              marginBottom: theme.spacing.sm,
            }}
          >
            Open deficiencies ({openDefs.length})
          </Text>
          <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
            {openDefs.map((d) => (
              <Card key={d.id} style={{ gap: 4 }}>
                <View
                  style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}
                >
                  <Text
                    style={{
                      color: theme.colors.text,
                      fontSize: theme.fontSize.base,
                      fontWeight: "700",
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {d.title ?? "Deficiency"}
                  </Text>
                  {d.severity ? (
                    <Badge label={d.severity} tone={toneForStatus(d.severity)} />
                  ) : null}
                </View>
                {d.description ? (
                  <Text
                    style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}
                    numberOfLines={3}
                  >
                    {d.description}
                  </Text>
                ) : null}
                {d.nfpa_code_ref ? (
                  <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>
                    {d.nfpa_code_ref}
                  </Text>
                ) : null}
              </Card>
            ))}
          </View>
        </>
      ) : null}

      {/* Actions */}
      <Card style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <Text
          style={{ color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: "700" }}
        >
          Field steps
        </Text>

        <ActionRow
          icon="camera-outline"
          label="Photos"
          hint={
            photos.complete
              ? "All required slots filled"
              : `${photos.done}/${photos.total} required slots`
          }
          tone={photos.complete ? "success" : "warning"}
          onPress={() => router.push(`/cleaning/${c.id}/photos`)}
        />
        <ActionRow
          icon="speedometer-outline"
          label="Grease depth / AI"
          hint={
            greaseDone
              ? `Pre ${c.grease_depth_pre_inches}" · ${titleCase(
                  greaseLevel(c.grease_depth_pre_inches)
                )}`
              : "Not measured"
          }
          tone={
            !greaseDone
              ? "neutral"
              : greaseLevel(c.grease_depth_pre_inches) === "mandatory"
              ? "danger"
              : greaseLevel(c.grease_depth_pre_inches) === "advisory"
              ? "warning"
              : "success"
          }
          onPress={() => router.push(`/cleaning/${c.id}/grease`)}
        />
      </Card>

      {certified ? (
        <Card
          elevated
          style={{ alignItems: "center", gap: 6, borderColor: theme.colors.success }}
        >
          <Ionicons name="ribbon-outline" size={36} color={theme.colors.success} />
          <Text
            style={{ color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: "800" }}
          >
            Certified
          </Text>
          {c.signature_manager_name ? (
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
              Signed by {c.signature_manager_name} · {fmtDate(c.signature_at)}
            </Text>
          ) : null}
          <View style={{ height: 4 }} />
          <Button
            label="View certificate & sticker"
            variant="secondary"
            onPress={() => router.push(`/cleaning/${c.id}/closeout`)}
          />
        </Card>
      ) : (
        <Button
          label="Close out & certify"
          iconLeft={<Ionicons name="shield-checkmark-outline" size={18} color="#0b0f17" />}
          onPress={() => router.push(`/cleaning/${c.id}/closeout`)}
        />
      )}
      <View style={{ height: theme.spacing.lg }} />
    </ScreenContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>{label}</Text>
      <Text
        style={{
          color: theme.colors.text,
          fontSize: theme.fontSize.sm,
          flex: 1,
          textAlign: "right",
        }}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function RowLink({
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
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  hint,
  tone,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  tone: "neutral" | "success" | "warning" | "danger";
  onPress: () => void;
}) {
  const accent = useAccent();
  const toneColor =
    tone === "success"
      ? theme.colors.success
      : tone === "warning"
      ? theme.colors.warning
      : tone === "danger"
      ? theme.colors.danger
      : theme.colors.textMuted;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        minHeight: 48,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Ionicons name={icon} size={24} color={accent} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "600" }}>
          {label}
        </Text>
        <Text style={{ color: toneColor, fontSize: theme.fontSize.xs, marginTop: 2 }}>{hint}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
    </Pressable>
  );
}
