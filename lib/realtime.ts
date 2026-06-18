/**
 * Realtime invalidation — subscribe to Postgres changes on a tenant table and
 * invalidate react-query keys so the UI updates live. Tables must be in the
 * `supabase_realtime` publication (enabled on the RoofX tenant for
 * chat_messages / customer_pipeline / ops_work_orders / customer_estimates /
 * admin_tasks / admin_notes).
 *
 * Polling stays as a low-frequency fallback in the hooks, so the app still
 * refreshes if realtime is unavailable (e.g. flaky network).
 */
import { useEffect } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { supabase } from "./supabase";

export function useRealtime(
  table: string,
  invalidateKeys: QueryKey[],
  filter?: string
) {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel(`rt:${table}:${filter ?? "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
        () => {
          for (const key of invalidateKeys) {
            qc.invalidateQueries({ queryKey: key });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter]);
}
