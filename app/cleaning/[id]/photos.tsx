/**
 * CSC required-photo grid. HOOD_SECTIONS (Hood, Plenum, Filters, Duct, Fan,
 * Rooftop) x before/after. Each empty slot is tappable to capture; filled slots
 * show a thumbnail. All slots must be filled before close-out (completeness is
 * computed and surfaced on the detail screen + close-out gate).
 */
import { useMemo, useState } from "react";
import { Alert, Image, Pressable, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/StateViews";
import { useCleaning, useUploadCleaningPhoto } from "@/lib/hooks/useCsc";
import {
  HOOD_SECTIONS,
  PHOTO_SLOTS,
  photoCompleteness,
  type CscCleaningPhoto,
  type HoodSection,
  type PhotoSlot,
} from "@/lib/services/csc";
import { capturePhoto } from "@/lib/imagePicker";
import { useAccent } from "@/lib/org";
import { theme } from "@/lib/theme";

export default function PhotosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const accent = useAccent();
  const { width } = useWindowDimensions();
  const { data: c, isLoading, isError, error } = useCleaning(id!);
  const upload = useUploadCleaningPhoto();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const photosBySlot = useMemo(() => {
    const map: Record<string, CscCleaningPhoto> = {};
    for (const p of c?.photos ?? []) {
      if (p.required_slot && !map[p.required_slot]) map[p.required_slot] = p;
    }
    return map;
  }, [c?.photos]);

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
        <EmptyState icon="camera-outline" title="Cleaning not found" />
      </ScreenContainer>
    );

  const certified = !!c.certificate_id;
  const completeness = photoCompleteness(c.photos ?? []);
  // Two columns (before / after). Account for screen + card padding + gaps.
  const cell = Math.floor((width - theme.spacing.md * 2 - theme.spacing.md * 2 - 12) / 2);

  const onCapture = async (section: HoodSection, slot: PhotoSlot) => {
    if (certified) return;
    const key = `${section}:${slot}`;
    try {
      setBusyKey(key);
      const file = await capturePhoto();
      if (!file) return;
      await upload.mutateAsync({ cleaningId: c.id, slot, hoodSection: section, file });
    } catch (err) {
      Alert.alert("Could not add photo", (err as Error).message);
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <ScreenContainer>
      <View style={{ marginVertical: theme.spacing.md }}>
        <Text
          style={{ color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: "800" }}
        >
          Required photos
        </Text>
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: theme.spacing.sm }}
        >
          <Badge
            label={
              completeness.complete
                ? "All slots filled"
                : `${completeness.done} of ${completeness.total} filled`
            }
            tone={completeness.complete ? "success" : "warning"}
          />
        </View>
      </View>

      {HOOD_SECTIONS.map((section) => (
        <Card key={section} style={{ marginBottom: theme.spacing.md }}>
          <Text
            style={{
              color: theme.colors.text,
              fontSize: theme.fontSize.lg,
              fontWeight: "700",
              marginBottom: theme.spacing.sm,
            }}
          >
            {section}
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {PHOTO_SLOTS.map((slot) => {
              const key = `${section}:${slot}`;
              const photo = photosBySlot[key];
              const busy = busyKey === key;
              return (
                <View key={slot} style={{ width: cell }}>
                  <Text
                    style={{
                      color: theme.colors.textMuted,
                      fontSize: theme.fontSize.xs,
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                      marginBottom: 4,
                    }}
                  >
                    {slot}
                  </Text>
                  <Pressable
                    onPress={() => onCapture(section, slot)}
                    disabled={certified || busy}
                    style={({ pressed }) => ({
                      width: "100%",
                      aspectRatio: 1,
                      borderRadius: theme.radius.md,
                      borderWidth: photo ? 1 : 2,
                      borderColor: photo ? theme.colors.border : accent,
                      borderStyle: photo ? "solid" : "dashed",
                      backgroundColor: theme.colors.surface,
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    {photo?.storage_url ? (
                      <Image
                        source={{ uri: photo.storage_url }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{ alignItems: "center", gap: 6 }}>
                        <Ionicons
                          name={busy ? "hourglass-outline" : "camera-outline"}
                          size={28}
                          color={accent}
                        />
                        <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>
                          {busy ? "Uploading…" : certified ? "Locked" : "Tap to capture"}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        </Card>
      ))}
      <View style={{ height: theme.spacing.lg }} />
    </ScreenContainer>
  );
}
