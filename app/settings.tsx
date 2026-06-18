import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingView, ErrorView } from "@/components/ui/StateViews";
import { useOrgSettings, useUpdateOrgSettings } from "@/lib/hooks/useSettings";
import { useOrgRefresh } from "@/lib/org";
import { theme } from "@/lib/theme";

export default function SettingsScreen() {
  const settings = useOrgSettings();
  const update = useUpdateOrgSettings();
  const refreshOrg = useOrgRefresh();

  const [form, setForm] = useState({
    company_name: "",
    company_phone: "",
    company_email: "",
    company_website: "",
    company_address: "",
    company_city: "",
    company_state: "",
    company_zip: "",
    license_number: "",
  });

  useEffect(() => {
    if (settings.data) {
      setForm({
        company_name: settings.data.company_name ?? "",
        company_phone: settings.data.company_phone ?? "",
        company_email: settings.data.company_email ?? "",
        company_website: settings.data.company_website ?? "",
        company_address: settings.data.company_address ?? "",
        company_city: settings.data.company_city ?? "",
        company_state: settings.data.company_state ?? "",
        company_zip: settings.data.company_zip ?? "",
        license_number: settings.data.license_number ?? "",
      });
    }
  }, [settings.data]);

  if (settings.isLoading) return <ScreenContainer scroll={false}><LoadingView /></ScreenContainer>;
  if (settings.isError) return <ScreenContainer scroll={false}><ErrorView message={(settings.error as Error)?.message} /></ScreenContainer>;

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSave = () => {
    if (!settings.data) return;
    update.mutate(
      { id: settings.data.id, patch: form },
      {
        onSuccess: async () => {
          await refreshOrg();
          Alert.alert("Saved", "Company settings updated.");
        },
        onError: (e) => Alert.alert("Could not save", (e as Error).message),
      }
    );
  };

  return (
    <ScreenContainer>
      <View style={{ height: theme.spacing.md }} />
      <Card style={{ marginBottom: theme.spacing.md }}>
        <Input label="Company name" value={form.company_name} onChangeText={set("company_name")} />
        <Input label="Phone" value={form.company_phone} onChangeText={set("company_phone")} keyboardType="phone-pad" />
        <Input label="Email" value={form.company_email} onChangeText={set("company_email")} autoCapitalize="none" keyboardType="email-address" />
        <Input label="Website" value={form.company_website} onChangeText={set("company_website")} autoCapitalize="none" />
        <Input label="License #" value={form.license_number} onChangeText={set("license_number")} />
      </Card>

      <Card style={{ marginBottom: theme.spacing.md }}>
        <Input label="Address" value={form.company_address} onChangeText={set("company_address")} />
        <Input label="City" value={form.company_city} onChangeText={set("company_city")} />
        <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <Input label="State" value={form.company_state} onChangeText={set("company_state")} autoCapitalize="characters" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="ZIP" value={form.company_zip} onChangeText={set("company_zip")} keyboardType="number-pad" />
          </View>
        </View>
      </Card>

      <Button label={update.isPending ? "Saving…" : "Save changes"} loading={update.isPending} onPress={onSave} />
    </ScreenContainer>
  );
}
