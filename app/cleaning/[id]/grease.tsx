/**
 * CSC grease-depth measurement. Pre/post numeric inputs with a live NFPA-96
 * threshold flag (>= 0.125" mandatory red, >= 0.078" advisory amber, else
 * green). "AI estimate from photo" is a clearly-marked Wave-2 stub.
 */
import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/StateViews";
import { useCleaning, useUpdateGreaseDepth } from "@/lib/hooks/useCsc";
import {
  GREASE_THRESHOLD_ADVISORY,
  GREASE_THRESHOLD_MANDATORY,
  greaseLevel,
} from "@/lib/services/csc";
import { theme } from "@/lib/theme";

export default function GreaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: c, isLoading, isError, error } = useCleaning(id!);
  const save = useUpdateGreaseDepth();

  const [pre, setPre] = useState("");
  const [post, setPost] = useState("");

  useEffect(() => {
    if (c) {
      setPre(c.grease_depth_pre_inches != null ? String(c.grease_depth_pre_inches) : "");
      setPost(c.grease_depth_post_inches != null ? String(c.grease_depth_post_inches) : "");
    }
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
        <EmptyState icon="speedometer-outline" title="Cleaning not found" />
      </ScreenContainer>
    );

  const certified = !!c.certificate_id;
  const preNum = pre.trim() === "" ? null : Number(pre);
  const level = greaseLevel(preNum);

  const onSave = () => {
    if (pre.trim() !== "" && Number.isNaN(Number(pre))) {
      Alert.alert("Invalid value", "Pre-cleaning depth must be a number (inches).");
      return;
    }
    if (post.trim() !== "" && Number.isNaN(Number(post))) {
      Alert.alert("Invalid value", "Post-cleaning depth must be a number (inches).");
      return;
    }
    save.mutate(
      {
        id: c.id,
        pre: pre.trim() === "" ? null : Number(pre),
        post: post.trim() === "" ? null : Number(post),
      },
      {
        onSuccess: () => router.back(),
        onError: (err) => Alert.alert("Could not save", (err as Error).message),
      }
    );
  };

  return (
    <ScreenContainer>
      <View style={{ marginVertical: theme.spacing.md }}>
        <Text
          style={{ color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: "800" }}
        >
          Grease depth
        </Text>
        <Text
          style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginTop: 2 }}
        >
          NFPA-96 measured grease depth, in inches.
        </Text>
      </View>

      {/* Live threshold flag */}
      <ThresholdBanner level={level} value={preNum} />

      <Card style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
        <Input
          label='Pre-cleaning depth (inches)'
          value={pre}
          onChangeText={setPre}
          editable={!certified}
          placeholder="0.000"
          keyboardType="decimal-pad"
        />
        <Input
          label='Post-cleaning depth (inches)'
          value={post}
          onChangeText={setPost}
          editable={!certified}
          placeholder="0.000"
          keyboardType="decimal-pad"
        />

        <Button
          label="AI estimate from photo"
          variant="ghost"
          iconLeft={<Ionicons name="sparkles-outline" size={18} color={theme.colors.text} />}
          onPress={() =>
            Alert.alert(
              "Coming soon",
              "AI grease estimate from a hood photo lands in Wave 2 (Supabase edge function reading ai_photo_measurements). For now, enter the manual gauge reading."
            )
          }
        />
      </Card>

      <View style={{ height: theme.spacing.md }} />
      {certified ? (
        <Text
          style={{
            color: theme.colors.textMuted,
            fontSize: theme.fontSize.sm,
            textAlign: "center",
          }}
        >
          This cleaning is certified — measurements are locked.
        </Text>
      ) : (
        <Button
          label={save.isPending ? "Saving…" : "Save measurement"}
          loading={save.isPending}
          onPress={onSave}
        />
      )}

      <Text
        style={{
          color: theme.colors.textMuted,
          fontSize: theme.fontSize.xs,
          textAlign: "center",
          marginTop: theme.spacing.md,
        }}
      >
        Thresholds: {GREASE_THRESHOLD_MANDATORY}" mandatory · {GREASE_THRESHOLD_ADVISORY}" advisory
      </Text>
    </ScreenContainer>
  );
}

function ThresholdBanner({
  level,
  value,
}: {
  level: ReturnType<typeof greaseLevel>;
  value: number | null;
}) {
  if (value == null) {
    return (
      <Card style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Ionicons name="ellipse-outline" size={22} color={theme.colors.textMuted} />
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.base, flex: 1 }}>
          Enter the pre-cleaning depth to see the NFPA-96 status.
        </Text>
      </Card>
    );
  }
  const map = {
    mandatory: {
      color: theme.colors.danger,
      icon: "alert-circle" as const,
      title: "Mandatory cleaning",
      body: "At or above 0.125\" — NFPA-96 requires cleaning. Recorded as over threshold.",
    },
    advisory: {
      color: theme.colors.warning,
      icon: "warning" as const,
      title: "Advisory",
      body: "At or above 0.078\" — monitor closely; cleaning recommended.",
    },
    ok: {
      color: theme.colors.success,
      icon: "checkmark-circle" as const,
      title: "Within limits",
      body: "Below the 0.078\" advisory threshold.",
    },
  }[level];

  return (
    <Card
      elevated
      style={{ flexDirection: "row", alignItems: "center", gap: 12, borderColor: map.color }}
    >
      <Ionicons name={map.icon} size={32} color={map.color} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: map.color, fontSize: theme.fontSize.lg, fontWeight: "800" }}>
          {map.title} · {value}"
        </Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginTop: 2 }}>
          {map.body}
        </Text>
      </View>
    </Card>
  );
}
