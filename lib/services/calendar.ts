/** Calendar — admin_calendar_events. */
import { supabase } from "@/lib/supabase";

export type CalendarEvent = {
  id: string;
  title: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean | null;
  color: string | null;
  user_id: string | null;
  created_at: string | null;
};

export async function fetchEvents(
  fromDate: string,
  toDate: string
): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("admin_calendar_events")
    .select("*")
    .gte("start_date", fromDate)
    .lte("start_date", toDate)
    .order("start_date", { ascending: true })
    .order("start_time", { ascending: true, nullsFirst: true });
  if (error) throw error;
  return (data ?? []) as CalendarEvent[];
}

export async function createEvent(input: {
  title: string;
  start_date: string;
  start_time?: string | null;
  all_day: boolean;
  userId: string | null;
}): Promise<void> {
  const { error } = await supabase.from("admin_calendar_events").insert({
    title: input.title.trim(),
    start_date: input.start_date,
    end_date: input.start_date,
    start_time: input.all_day ? null : input.start_time ?? null,
    all_day: input.all_day,
    user_id: input.userId,
  });
  if (error) throw error;
}

/** Group events by start_date (YYYY-MM-DD) preserving order. */
export function groupByDate(
  events: CalendarEvent[]
): { date: string; items: CalendarEvent[] }[] {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = e.start_date ?? "—";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}
