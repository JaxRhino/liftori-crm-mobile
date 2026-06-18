import { RefreshControl, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, toneForStatus } from "@/components/ui/Badge";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/StateViews";
import { useEstimates } from "@/lib/hooks/useEstimates";
import { isSigned } from "@/lib/services/estimates";
import { contactName } from "@/lib/services/sales";
import { useAccent } from "@/lib/org";
import { theme } from "@/lib/theme";
import { fmtMoney, fmtDate } from "@/lib/format";

export default function EstimatesScreen() {
  const accent = useAccent();
  const router = useRouter();
  const estimates = useEstimates();

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl
          refreshing={estimates.isFetching}
          onRefresh={() => estimates.refetch()}
          tintColor={accent}
        />
      }
    >
      <View style={{ paddingTop: theme.spacing.md, marginBottom: theme.spacing.md }}>
        <Text style={{ color: theme.colors.text, fontSize: theme.fontSize["2xl"], fontWeight: "800" }}>
          Estimates
        </Text>
      </View>

      <Button label="+ New estimate" onPress={() => router.push("/estimate/new")} />
      <View style={{ height: theme.spacing.md }} />

      {estimates.isLoading ? (
        <LoadingView />
      ) : estimates.isError ? (
        <ErrorView message={(estimates.error as Error)?.message} />
      ) : (estimates.data ?? []).length === 0 ? (
        <EmptyState icon="document-text-outline" title="No estimates yet" subtitle="Estimates created in the CRM appear here, ready to sign in the field." />
      ) : (
        <View style={{ gap: theme.spacing.md }}>
          {estimates.data!.map((e) => {
            const signed = isSigned(e);
            return (
              <Card key={e.id} onPress={() => router.push(`/estimate/${e.id}`)}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                  <Text
                    style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "700", flex: 1 }}
                    numberOfLines={1}
                  >
                    {e.title ?? e.estimate_number ?? "Estimate"}
                  </Text>
                  <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "800" }}>
                    {fmtMoney(e.total)}
                  </Text>
                </View>
                <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginTop: 2 }} numberOfLines={1}>
                  {contactName(e.contact)}
                  {e.estimate_number ? ` · ${e.estimate_number}` : ""}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: theme.spacing.sm }}>
                  {signed ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                      <Text style={{ color: theme.colors.success, fontSize: theme.fontSize.xs, fontWeight: "700" }}>
                        Signed {fmtDate(e.esign_signed_at)}
                      </Text>
                    </View>
                  ) : (
                    <Badge label={e.esign_status ?? e.status ?? "draft"} tone={toneForStatus(e.esign_status ?? e.status)} />
                  )}
                  {e.valid_until && !signed ? (
                    <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>
                      Valid to {fmtDate(e.valid_until)}
                    </Text>
                  ) : null}
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </ScreenContainer>
  );
}
