/** EOS — rocks, issues, to-dos (eos_rocks / eos_issues / eos_todos). */
import { supabase } from "@/lib/supabase";

export type Rock = {
  id: string;
  title: string | null;
  description: string | null;
  owner_id: string | null;
  department: string | null;
  quarter: string | null;
  progress_percentage: number | null;
  status: string | null;
  is_complete: boolean | null;
  created_at: string | null;
};

export type Issue = {
  id: string;
  title: string | null;
  description: string | null;
  priority: string | null;
  status: string | null;
  department: string | null;
  created_at: string | null;
};

export type Todo = {
  id: string;
  task: string | null;
  description: string | null;
  owner_id: string | null;
  due_date: string | null;
  priority: string | null;
  status: string | null;
  completed_at: string | null;
  created_at: string | null;
};

export async function fetchRocks(): Promise<Rock[]> {
  const { data, error } = await supabase
    .from("eos_rocks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Rock[];
}

export async function fetchIssues(): Promise<Issue[]> {
  const { data, error } = await supabase
    .from("eos_issues")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Issue[];
}

export async function fetchTodos(): Promise<Todo[]> {
  const { data, error } = await supabase
    .from("eos_todos")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as Todo[];
}

export async function setRockProgress(
  id: string,
  pct: number
): Promise<void> {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const { error } = await supabase
    .from("eos_rocks")
    .update({
      progress_percentage: clamped,
      is_complete: clamped >= 100,
      status: clamped >= 100 ? "complete" : "on_track",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function createIssue(input: {
  title: string;
  priority?: string;
}): Promise<void> {
  const { error } = await supabase.from("eos_issues").insert({
    title: input.title.trim(),
    priority: input.priority ?? "medium",
    status: "open",
  });
  if (error) throw error;
}

export async function setIssueStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from("eos_issues")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function toggleTodo(id: string, done: boolean): Promise<void> {
  const { error } = await supabase
    .from("eos_todos")
    .update({
      status: done ? "complete" : "open",
      completed_at: done ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export function todoDone(t: Pick<Todo, "status" | "completed_at">): boolean {
  return !!t.completed_at || ["complete", "completed", "done"].includes((t.status ?? "").toLowerCase());
}
