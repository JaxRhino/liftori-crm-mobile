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
import {
  useCreateIssue,
  useIssues,
  useRocks,
  useSetIssueStatus,
  useSetRockProgress,
  useToggleTodo,
  useTodos,
} from "@/lib/hooks/useEos";
import { todoDone } from "@/lib/services/eos";
import { useAccent } from "@/lib/org";
import { theme } from "@/lib/theme";
import { fmtDate } from "@/lib/format";

type Tab = "rocks" | "issues" | "todos";

export default function EosScreen() {
  const [tab, setTab] = useState<Tab>("rocks");
  const accent = useAccent();
  const rocks = useRocks();
  const issues = useIssues();
  const todos = useTodos();

  const setProgress = useSetRockProgress();
  const setIssueStatus = useSetIssueStatus();
  const createIssue = useCreateIssue();
  const toggleTodo = useToggleTodo();

  const [open, setOpen] = useState(false);
  const [issueTitle, setIssueTitle] = useState("");

  const refreshing = rocks.isFetching || issues.isFetching || todos.isFetching;
  const onRefresh = () => { rocks.refetch(); issues.refetch(); todos.refetch(); };

  return (
    <ScreenContainer
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
    >
      <View style={{ height: theme.spacing.md }} />
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { key: "rocks", label: `Rocks (${rocks.data?.length ?? 0})` },
          { key: "issues", label: `Issues (${issues.data?.length ?? 0})` },
          { key: "todos", label: `To-Dos (${todos.data?.length ?? 0})` },
        ]}
      />
      <View style={{ height: theme.spacing.md }} />

      {tab === "rocks" ? (
        rocks.isLoading ? <LoadingView /> :
        rocks.isError ? <ErrorView message={(rocks.error as Error)?.message} /> :
        (rocks.data ?? []).length === 0 ? <EmptyState icon="flag-outline" title="No rocks" subtitle="Quarterly priorities show here." /> :
        <View style={{ gap: theme.spacing.sm }}>
          {rocks.data!.map((r) => {
            const pct = r.progress_percentage ?? 0;
            return (
              <Card key={r.id}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                  <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "700", flex: 1 }}>{r.title}</Text>
                  {r.quarter ? <Badge label={r.quarter} tone="neutral" pretty={false} /> : null}
                </View>
                {r.description ? <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginTop: 2 }}>{r.description}</Text> : null}
                <View style={{ height: 8, backgroundColor: theme.colors.surfaceElevated, borderRadius: 4, marginTop: theme.spacing.sm, overflow: "hidden" }}>
                  <View style={{ width: `${pct}%`, height: "100%", backgroundColor: pct >= 100 ? theme.colors.success : accent }} />
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: theme.spacing.sm }}>
                  <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>{pct}% complete</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Round icon="remove" onPress={() => setProgress.mutate({ id: r.id, pct: pct - 10 })} />
                    <Round icon="add" onPress={() => setProgress.mutate({ id: r.id, pct: pct + 10 })} />
                    <Round icon="checkmark" tint={theme.colors.success} onPress={() => setProgress.mutate({ id: r.id, pct: 100 })} />
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      ) : tab === "issues" ? (
        <>
          <Button label="+ New issue" onPress={() => setOpen(true)} />
          <View style={{ height: theme.spacing.md }} />
          {issues.isLoading ? <LoadingView /> :
           issues.isError ? <ErrorView message={(issues.error as Error)?.message} /> :
           (issues.data ?? []).length === 0 ? <EmptyState icon="alert-circle-outline" title="No issues" subtitle="Log blockers for the IDS list." /> :
           <View style={{ gap: theme.spacing.sm }}>
             {issues.data!.map((i) => {
               const solved = ["solved", "closed", "done", "resolved"].includes((i.status ?? "").toLowerCase());
               return (
                 <Card key={i.id}>
                   <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                     <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "700", flex: 1, textDecorationLine: solved ? "line-through" : "none" }}>{i.title}</Text>
                     {i.priority ? <Badge label={i.priority} tone={toneForStatus(i.priority === "high" ? "overdue" : i.priority)} /> : null}
                   </View>
                   <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: theme.spacing.sm }}>
                     <Badge label={i.status ?? "open"} tone={toneForStatus(i.status)} />
                     {!solved ? (
                       <Pressable onPress={() => setIssueStatus.mutate({ id: i.id, status: "solved" })} hitSlop={6}>
                         <Text style={{ color: theme.colors.success, fontWeight: "700", fontSize: theme.fontSize.sm }}>Mark solved</Text>
                       </Pressable>
                     ) : null}
                   </View>
                 </Card>
               );
             })}
           </View>}
        </>
      ) : (
        todos.isLoading ? <LoadingView /> :
        todos.isError ? <ErrorView message={(todos.error as Error)?.message} /> :
        (todos.data ?? []).length === 0 ? <EmptyState icon="list-outline" title="No to-dos" subtitle="Weekly action items appear here." /> :
        <View style={{ gap: theme.spacing.sm }}>
          {todos.data!.map((t) => {
            const done = todoDone(t);
            return (
              <Card key={t.id}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                  <Pressable onPress={() => toggleTodo.mutate({ id: t.id, done: !done })} hitSlop={8} style={{ paddingTop: 1 }}>
                    <Ionicons name={done ? "checkmark-circle" : "ellipse-outline"} size={24} color={done ? theme.colors.success : theme.colors.textMuted} />
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: done ? theme.colors.textMuted : theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "600", textDecorationLine: done ? "line-through" : "none" }}>
                      {t.task}
                    </Text>
                    {t.due_date ? <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs, marginTop: 2 }}>Due {fmtDate(t.due_date)}</Text> : null}
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      <Sheet visible={open} onClose={() => setOpen(false)} title="New issue">
        <Input label="Issue" value={issueTitle} onChangeText={setIssueTitle} placeholder="What's the blocker?" />
        <Button
          label={createIssue.isPending ? "Adding…" : "Add issue"}
          loading={createIssue.isPending}
          onPress={() => {
            if (!issueTitle.trim()) return;
            createIssue.mutate({ title: issueTitle }, {
              onSuccess: () => { setIssueTitle(""); setOpen(false); },
              onError: (e) => Alert.alert("Could not add", (e as Error).message),
            });
          }}
        />
      </Sheet>
    </ScreenContainer>
  );
}

function Round({ icon, onPress, tint }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; tint?: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 32, height: 32, borderRadius: 16,
        borderWidth: 1, borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceElevated,
        alignItems: "center", justifyContent: "center",
      }}
    >
      <Ionicons name={icon} size={18} color={tint ?? theme.colors.text} />
    </Pressable>
  );
}
