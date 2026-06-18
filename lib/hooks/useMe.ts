import { useQuery } from "@tanstack/react-query";
import { fetchMe, fetchTeam } from "@/lib/services/me";

export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: fetchMe, staleTime: 5 * 60_000 });
}

export function useTeam() {
  return useQuery({ queryKey: ["team"], queryFn: fetchTeam, staleTime: 5 * 60_000 });
}
