import { useState } from "react";
import { Alert, Pressable, RefreshControl, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { Badge, toneForStatus } from "@/components/ui/Badge";
import { Segmented } from "@/components/ui/Segmented";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/StateViews";
import { useCreateTask, useDeleteTask, useSetTaskStatus, useTasks } from "@/lib/hooks/useTasks";
import { isDone, TASK_PRIORITIES } from "@/lib/services/tasks";
import { useMe } from "@/lib/hooks/useMe";
import { useAccent } from "@/lib/org";
import { theme } from "@/lib/theme";
import { fmtDate, titleCase } from "@/lib/format";

export default function TasksScreen() {
  const accent = useAccent();
  const tasks = useTasks();
  const me = useMe();
  const create = useCreateTask();
  const setStatus = useSetTaskStatus();
  const del = useDeleteTask();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<(typeof TASK_PRIORITIES)[number]>("medium");

  const onCreate = () => {
    if (!title.trim()) return;
    create.mutate(
      { title, priority, userId: me.data?.userId ?? null },
      {
        onSuccess: () => { setTitle(""); setPriority("medium"); setOpen(false); },
        onError: (e) => Alert.alert("Could not add task", (e as Error).message),
      }
    );
  };

  const toggle = (id: string, done: boolean) =>
    setStatus.mutate({ id, status: done ? "todo" : "completed" });

  const confirmDelete = (id: string) =>
    Alert.alert("Delete task", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => del.mutate(id) },
    ]);

  const data = tasks.data ?? [];
  const openTasks = data.filter((t) => !isDone(t));
  const doneTasks = data.filter((t) => isDone(t));

  return (
    <ScreenContainer
      refreshControl={<RefreshControl refreshing={tasks.isFetching} onRefresh={() => tasks.refetch()} tintColor={accent} />}
    >
      <View style={{ height: theme.spacing.md }} />
      <Button label="+ New task" onPress={() => setOpen(true)} />
      <View style={{ height: theme.spacing.md }} />

      {tasks.isLoading ? (
        <LoadingView />
      ) : tasks.isError ? (
        <ErrorView message={(tasks.error as Error)?.message} />
      ) : data.length === 0 ? (
        <EmptyState icon="checkbox-outline" title="No tasks yet" subtitle="Track what needs doing across the team." />
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {[...openTasks, ...doneTasks].map((t) => {
            const done = isDone(t);
            return (
              <Card key={t.id}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                  <Pressable onPress={() => toggle(t.id, done)} hitSlop={8} style={{ paddingTop: 1 }}>
                    <Ionicons
                      name={done ? "checkmark-circle" : "ellipse-outline"}
                      size={24}
                      color={done ? theme.colors.success : theme.colors.textMuted}
                    />
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: done ? theme.colors.textMuted : theme.colors.text,
                        fontSize: theme.fontSize.base,
                        fontWeight: "600",
                        textDecorationLine: done ? "line-through" : "none",
                      }}
                    >
                      {t.title}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                      {t.priority ? <Badge label={t.priority} tone={toneForStatus(t.priority === "high" ? "overdue" : t.priority)} /> : null}
                      {t.due_date ? (
                        <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>Due {fmtDate(t.due_date)}</Text>
                      ) : null}
                    </View>
                  </View>
                  <Pressable onPress={() => confirmDelete(t.id)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
                  </Pressable>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      <Sheet visible={open} onClose={() => setOpen(false)} title="New task">
        <Input label="Task" value={title} onChangeText={setTitle} placeholder="What needs doing?" />
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginBottom: 6 }}>Priority</Text>
        <Segmented
          value={priority}
          onChange={setPriority}
          options={TASK_PRIORITIES.map((p) => ({ key: p, label: titleCase(p) }))}
        />
        <View style={{ height: theme.spacing.md }} />
        <Button label={create.isPending ? "Adding…" : "Add task"} loading={create.isPending} onPress={onCreate} />
      </Sheet>
    </ScreenContainer>
  );
}
