/**
 * Dashboard service — top-line stats for the Home tab. Fetches raw rows and
 * computes in JS so unknown stage/status enum values never break the math.
 */
import { supabase } from "@/lib/supabase";

export type DashboardStats = {
  openDeals: number;
  pipelineValue: number;
  wonThisMonthValue: number;
  activeJobs: number;
  estimatesPending: number;
  estimatesSignedThisMonth: number;
};

export type ActivityItem = {
  id: string;
  kind: "deal" | "estimate" | "work_order";
  title: string;
  subtitle: string;
  at: string | null;
};

function monthStartIso(): string {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), 1).toISOString();
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const monthStart = monthStartIso();

  const [pipelineRes, woRes, estRes] = await Promise.all([
    supabase
      .from("customer_pipeline")
      .select("deal_value, stage, won_date, lost_date"),
    supabase.from("ops_work_orders").select("status"),
    supabase
      .from("customer_estimates")
      .select("esign_status, esign_signed_at, total"),
  ]);

  if (pipelineRes.error) throw pipelineRes.error;
  if (woRes.error) throw woRes.error;
  if (estRes.error) throw estRes.error;

  const deals = (pipelineRes.data ?? []) as Array<{
    deal_value: number | null;
    won_date: string | null;
    lost_date: string | null;
  }>;
  const open = deals.filter((d) => !d.won_date && !d.lost_date);
  const pipelineValue = open.reduce((s, d) => s + Number(d.deal_value ?? 0), 0);
  const wonThisMonthValue = deals
    .filter((d) => d.won_date && new Date(d.won_date) >= new Date(monthStart))
    .reduce((s, d) => s + Number(d.deal_value ?? 0), 0);

  const wos = (woRes.data ?? []) as Array<{ status: string | null }>;
  const activeJobs = wos.filter((w) =>
    ["scheduled", "in_progress", "on_hold", "new"].includes(
      (w.status ?? "").toLowerCase()
    )
  ).length;

  const ests = (estRes.data ?? []) as Array<{
    esign_status: string | null;
    esign_signed_at: string | null;
  }>;
  const estimatesPending = ests.filter((e) =>
    ["sent", "pending", "viewed"].includes((e.esign_status ?? "").toLowerCase())
  ).length;
  const estimatesSignedThisMonth = ests.filter(
    (e) =>
      (e.esign_status ?? "").toLowerCase() === "signed" &&
      e.esign_signed_at &&
      new Date(e.esign_signed_at) >= new Date(monthStart)
  ).length;

  return {
    openDeals: open.length,
    pipelineValue,
    wonThisMonthValue,
    activeJobs,
    estimatesPending,
    estimatesSignedThisMonth,
  };
}

export async function fetchRecentActivity(): Promise<ActivityItem[]> {
  const [deals, ests, wos] = await Promise.all([
    supabase
      .from("customer_pipeline")
      .select("id, title, stage, deal_value, last_activity_at, created_at")
      .order("last_activity_at", { ascending: false, nullsFirst: false })
      .limit(5),
    supabase
      .from("customer_estimates")
      .select("id, title, estimate_number, status, total, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("ops_work_orders")
      .select("id, title, work_order_number, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const items: ActivityItem[] = [];
  for (const d of (deals.data ?? []) as any[]) {
    items.push({
      id: `deal-${d.id}`,
      kind: "deal",
      title: d.title ?? "Deal",
      subtitle: `Stage: ${d.stage ?? "—"}`,
      at: d.last_activity_at ?? d.created_at,
    });
  }
  for (const e of (ests.data ?? []) as any[]) {
    items.push({
      id: `est-${e.id}`,
      kind: "estimate",
      title: e.title ?? e.estimate_number ?? "Estimate",
      subtitle: `Status: ${e.status ?? "—"}`,
      at: e.created_at,
    });
  }
  for (const w of (wos.data ?? []) as any[]) {
    items.push({
      id: `wo-${w.id}`,
      kind: "work_order",
      title: w.title ?? w.work_order_number ?? "Work order",
      subtitle: `Status: ${w.status ?? "—"}`,
      at: w.created_at,
    });
  }

  return items
    .filter((i) => i.at)
    .sort((a, b) => new Date(b.at!).getTime() - new Date(a.at!).getTime())
    .slice(0, 8);
}
