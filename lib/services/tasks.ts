/** Tasks — admin_tasks. */
import { supabase } from "@/lib/supabase";

export type Task = {
  id: string;
  title: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  user_id: string | null;
  created_at: string | null;
};

export const TASK_STATUSES = ["todo", "in_progress", "completed"] as const;
export const TASK_PRIORITIES = ["low", "medium", "high"] as const;

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("admin_tasks")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function createTask(input: {
  title: string;
  description?: string;
  priority?: string;
  due_date?: string | null;
  userId: string | null;
}): Promise<void> {
  const { error } = await supabase.from("admin_tasks").insert({
    title: input.title.trim(),
    description: input.description?.trim() ?? null,
    status: "todo",
    priority: input.priority ?? "medium",
    due_date: input.due_date ?? null,
    user_id: input.userId,
  });
  if (error) throw error;
}

export async function setTaskStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from("admin_tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from("admin_tasks").delete().eq("id", id);
  if (error) throw error;
}

export function isDone(t: Pick<Task, "status">): boolean {
  return ["completed", "done", "complete"].includes((t.status ?? "").toLowerCase());
}
