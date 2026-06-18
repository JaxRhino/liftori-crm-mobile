import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboardStats,
  fetchRecentActivity,
} from "@/lib/services/dashboard";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: fetchDashboardStats,
    staleTime: 60_000,
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: fetchRecentActivity,
    staleTime: 60_000,
  });
}
