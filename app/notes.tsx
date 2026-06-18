import { useState } from "react";
import { Alert, Pressable, RefreshControl, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/StateViews";
import { useCreateNote, useDeleteNote, useNotes, useTogglePin } from "@/lib/hooks/useNotes";
import { useMe } from "@/lib/hooks/useMe";
import { useAccent } from "@/lib/org";
import { theme } from "@/lib/theme";
import { fmtDate } from "@/lib/format";

export default function NotesScreen() {
  const accent = useAccent();
  const notes = useNotes();
  const me = useMe();
  const create = useCreateNote();
  const pin = useTogglePin();
  const del = useDeleteNote();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const onCreate = () => {
    if (!title.trim() && !body.trim()) return;
    create.mutate(
      { title, body, userId: me.data?.userId ?? null },
      {
        onSuccess: () => {
          setTitle(""); setBody(""); setOpen(false);
        },
        onError: (e) => Alert.alert("Could not save", (e as Error).message),
      }
    );
  };

  const confirmDelete = (id: string) =>
    Alert.alert("Delete note", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => del.mutate(id) },
    ]);

  return (
    <ScreenContainer
      refreshControl={<RefreshControl refreshing={notes.isFetching} onRefresh={() => notes.refetch()} tintColor={accent} />}
    >
      <View style={{ height: theme.spacing.md }} />
      <Button label="+ New note" onPress={() => setOpen(true)} />
      <View style={{ height: theme.spacing.md }} />

      {notes.isLoading ? (
        <LoadingView />
      ) : notes.isError ? (
        <ErrorView message={(notes.error as Error)?.message} />
      ) : (notes.data ?? []).length === 0 ? (
        <EmptyState icon="document-outline" title="No notes yet" subtitle="Jot field notes, reminders, or job details." />
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {notes.data!.map((n) => (
            <Card key={n.id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: "700", flex: 1 }}>
                  {n.title || "Untitled"}
                </Text>
                <Pressable onPress={() => pin.mutate({ id: n.id, pinned: !n.pinned })} hitSlop={8}>
                  <Ionicons name={n.pinned ? "star" : "star-outline"} size={20} color={n.pinned ? accent : theme.colors.textMuted} />
                </Pressable>
              </View>
              {n.body ? (
                <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginTop: 4 }}>{n.body}</Text>
              ) : null}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: theme.spacing.sm }}>
                <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>{fmtDate(n.updated_at ?? n.created_at)}</Text>
                <Pressable onPress={() => confirmDelete(n.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      )}

      <Sheet visible={open} onClose={() => setOpen(false)} title="New note">
        <Input label="Title" value={title} onChangeText={setTitle} placeholder="Note title" />
        <Input
          label="Body"
          value={body}
          onChangeText={setBody}
          placeholder="Write something…"
          multiline
          style={{ minHeight: 100, textAlignVertical: "top" }}
        />
        <Button label={create.isPending ? "Saving…" : "Save note"} loading={create.isPending} onPress={onCreate} />
      </Sheet>
    </ScreenContainer>
  );
}
