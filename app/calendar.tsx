import { useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/StateViews";
import { useCreateEvent, useEvents } from "@/lib/hooks/useCalendar";
import { groupByDate } from "@/lib/services/calendar";
import { useMe } from "@/lib/hooks/useMe";
import { useAccent } from "@/lib/org";
import { theme } from "@/lib/theme";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function prettyDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function CalendarScreen() {
  const accent = useAccent();
  const me = useMe();
  const create = useCreateEvent();

  const { fromDate, toDate } = useMemo(() => {
    const from = new Date();
    from.setDate(1);
    const to = new Date(from);
    to.setDate(to.getDate() + 75);
    return { fromDate: isoDate(from), toDate: isoDate(to) };
  }, []);
  const events = useEvents(fromDate, toDate);
  const groups = groupByDate(events.data ?? []);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(isoDate(new Date()));
  const [time, setTime] = useState("");
  const [allDay, setAllDay] = useState(true);

  const onCreate = () => {
    if (!title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert("Check fields", "Title and a date (YYYY-MM-DD) are required.");
      return;
    }
    create.mutate(
      { title, start_date: date, start_time: time || null, all_day: allDay, userId: me.data?.userId ?? null },
      {
        onSuccess: () => { setTitle(""); setTime(""); setOpen(false); },
        onError: (e) => Alert.alert("Could not add event", (e as Error).message),
      }
    );
  };

  return (
    <ScreenContainer
      refreshControl={<RefreshControl refreshing={events.isFetching} onRefresh={() => events.refetch()} tintColor={accent} />}
    >
      <View style={{ height: theme.spacing.md }} />
      <Button label="+ New event" onPress={() => setOpen(true)} />
      <View style={{ height: theme.spacing.md }} />

      {events.isLoading ? (
        <LoadingView />
      ) : events.isError ? (
        <ErrorView message={(events.error as Error)?.message} />
      ) : groups.length === 0 ? (
        <EmptyState icon="calendar-outline" title="Nothing scheduled" subtitle="Add events for inspections, installs, and meetings." />
      ) : (
        <View style={{ gap: theme.spacing.md }}>
          {groups.map((g) => (
            <View key={g.date} style={{ gap: theme.spacing.sm }}>
              <Text style={{ color: accent, fontSize: theme.fontSize.sm, fontWeight: "800", letterSpacing: 0.4 }}>
                {prettyDate(g.date)}
              </Text>
              {g.items.map((e) => (
                <Card key={e.id}>
                  <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                    <View style={{ width: 4, alignSelf: "stretch", borderRadius: 2, backgroundColor: e.color ?? accent }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "700" }}>
                        {e.title}
                      </Text>
                      <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
                        {e.all_day ? "All day" : (e.start_time ?? "").slice(0, 5) || "—"}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ))}
        </View>
      )}

      <Sheet visible={open} onClose={() => setOpen(false)} title="New event">
        <Input label="Title" value={title} onChangeText={setTitle} placeholder="Roof inspection — 123 Oak St" />
        <Input label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-06-20" autoCapitalize="none" />
        <Pressable
          onPress={() => setAllDay((v) => !v)}
          style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: theme.spacing.md }}
        >
          <Ionicons name={allDay ? "checkbox" : "square-outline"} size={24} color={allDay ? accent : theme.colors.textMuted} />
          <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base }}>All day</Text>
        </Pressable>
        {!allDay ? (
          <Input label="Time (HH:MM)" value={time} onChangeText={setTime} placeholder="14:30" autoCapitalize="none" />
        ) : null}
        <Button label={create.isPending ? "Adding…" : "Add event"} loading={create.isPending} onPress={onCreate} />
      </Sheet>
    </ScreenContainer>
  );
}
