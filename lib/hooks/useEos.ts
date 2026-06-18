import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createIssue,
  fetchIssues,
  fetchRocks,
  fetchTodos,
  setIssueStatus,
  setRockProgress,
  toggleTodo,
} from "@/lib/services/eos";

export function useRocks() {
  return useQuery({ queryKey: ["eos-rocks"], queryFn: fetchRocks });
}
export function useIssues() {
  return useQuery({ queryKey: ["eos-issues"], queryFn: fetchIssues });
}
export function useTodos() {
  return useQuery({ queryKey: ["eos-todos"], queryFn: fetchTodos });
}

export function useSetRockProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pct }: { id: string; pct: number }) =>
      setRockProgress(id, pct),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["eos-rocks"] }),
  });
}

export function useCreateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createIssue,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["eos-issues"] }),
  });
}

export function useSetIssueStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      setIssueStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["eos-issues"] }),
  });
}

export function useToggleTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      toggleTodo(id, done),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["eos-todos"] }),
  });
}
