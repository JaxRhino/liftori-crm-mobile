import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addWorkOrderPhoto,
  createWorkOrder,
  fetchCrews,
  fetchSchedule,
  fetchWorkOrder,
  fetchWorkOrders,
  fetchWorkOrdersForContact,
  updateWorkOrder,
  updateWorkOrderStatus,
  type WorkOrderInput,
} from "@/lib/services/operations";

export function useAddWorkOrderPhoto(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ phase, base64 }: { phase: "before" | "after"; base64: string }) =>
      addWorkOrderPhoto(id, phase, base64),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work-order", id] }),
  });
}

export function useSaveWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: WorkOrderInput }) =>
      id ? updateWorkOrder(id, input).then(() => id) : createWorkOrder(input),
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["work-orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      if (id) qc.invalidateQueries({ queryKey: ["work-order", id] });
    },
  });
}

export function useWorkOrders() {
  return useQuery({ queryKey: ["work-orders"], queryFn: fetchWorkOrders });
}

export function useWorkOrdersForContact(contactId: string) {
  return useQuery({
    queryKey: ["contact-jobs", contactId],
    queryFn: () => fetchWorkOrdersForContact(contactId),
    enabled: !!contactId,
  });
}

export function useWorkOrder(id: string) {
  return useQuery({
    queryKey: ["work-order", id],
    queryFn: () => fetchWorkOrder(id),
    enabled: !!id,
  });
}

export function useCrews() {
  return useQuery({
    queryKey: ["crews"],
    queryFn: fetchCrews,
    staleTime: 5 * 60_000,
  });
}

export function useSchedule(fromIso: string, toIso: string) {
  return useQuery({
    queryKey: ["schedule", fromIso, toIso],
    queryFn: () => fetchSchedule(fromIso, toIso),
  });
}

export function useUpdateWorkOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateWorkOrderStatus(id, status),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["work-orders"] });
      qc.invalidateQueries({ queryKey: ["work-order", vars.id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
