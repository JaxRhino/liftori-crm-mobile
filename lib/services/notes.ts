/** Notes — admin_notes. */
import { supabase } from "@/lib/supabase";

export type Note = {
  id: string;
  title: string | null;
  body: string | null;
  tags: string[] | null;
  pinned: boolean | null;
  color: string | null;
  user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export async function fetchNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from("admin_notes")
    .select("*")
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as Note[];
}

export async function createNote(input: {
  title: string;
  body: string;
  userId: string | null;
}): Promise<void> {
  const { error } = await supabase.from("admin_notes").insert({
    title: input.title.trim() || "Untitled",
    body: input.body.trim(),
    pinned: false,
    user_id: input.userId,
  });
  if (error) throw error;
}

export async function togglePin(id: string, pinned: boolean): Promise<void> {
  const { error } = await supabase
    .from("admin_notes")
    .update({ pinned, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from("admin_notes").delete().eq("id", id);
  if (error) throw error;
}
