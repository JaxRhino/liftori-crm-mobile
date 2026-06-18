import { Alert, Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Card } from "@/components/ui/Card";
import { useAddWorkOrderPhoto } from "@/lib/hooks/useOperations";
import type { WorkOrderPhoto } from "@/lib/services/operations";
import { useAccent } from "@/lib/org";
import { theme } from "@/lib/theme";

export function WorkOrderPhotos({
  workOrderId,
  before,
  after,
}: {
  workOrderId: string;
  before: WorkOrderPhoto[] | null;
  after: WorkOrderPhoto[] | null;
}) {
  const accent = useAccent();
  const add = useAddWorkOrderPhoto(workOrderId);

  const pick = async (phase: "before" | "after", fromCamera: boolean) => {
    try {
      const perm = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Allow access to add a photo.");
        return;
      }
      const opts = { quality: 0.6, base64: true, mediaTypes: ImagePicker.MediaTypeOptions.Images } as const;
      const res = fromCamera
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled || !res.assets?.[0]?.base64) return;
      add.mutate(
        { phase, base64: res.assets[0].base64 },
        { onError: (e) => Alert.alert("Upload failed", (e as Error).message) }
      );
    } catch (e) {
      Alert.alert("Could not add photo", (e as Error).message);
    }
  };

  const section = (label: string, phase: "before" | "after", items: WorkOrderPhoto[] | null) => (
    <View style={{ gap: theme.spacing.sm }}>
      <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "700" }}>{label}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {(items ?? []).map((p, i) =>
          p.url ? (
            <Image key={i} source={{ uri: p.url }} style={{ width: 84, height: 84, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surfaceElevated }} />
          ) : null
        )}
      </View>
      <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
        <Pressable onPress={() => pick(phase, true)} disabled={add.isPending} style={btn(accent)}>
          <Ionicons name="camera-outline" size={18} color="#0b0f17" />
          <Text style={{ color: "#0b0f17", fontWeight: "700", fontSize: theme.fontSize.sm }}>Camera</Text>
        </Pressable>
        <Pressable onPress={() => pick(phase, false)} disabled={add.isPending} style={btnGhost()}>
          <Ionicons name="images-outline" size={18} color={theme.colors.text} />
          <Text style={{ color: theme.colors.text, fontWeight: "700", fontSize: theme.fontSize.sm }}>Library</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Card style={{ gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
      <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>Job photos</Text>
      {section("Before", "before", before)}
      <View style={{ height: 1, backgroundColor: theme.colors.border }} />
      {section("After", "after", after)}
      {add.isPending ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>Uploading…</Text>
      ) : null}
    </Card>
  );
}

const btn = (accent: string) => ({
  flex: 1, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const,
  gap: 6, paddingVertical: 10, borderRadius: theme.radius.md, backgroundColor: accent,
});
const btnGhost = () => ({
  flex: 1, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const,
  gap: 6, paddingVertical: 10, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border,
});
