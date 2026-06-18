import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEstimate,
  fetchEstimate,
  fetchEstimates,
  fetchEstimateTemplates,
  markEstimateSent,
  signEstimate,
  updateEstimate,
  type EstimateInput,
} from "@/lib/services/estimates";

export function useEstimateTemplates() {
  return useQuery({
    queryKey: ["estimate-templates"],
    queryFn: fetchEstimateTemplates,
    staleTime: 5 * 60_000,
  });
}

export function useSaveEstimate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: EstimateInput }) =>
      id ? updateEstimate(id, input).then(() => id) : createEstimate(input),
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["estimates"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      if (id) qc.invalidateQueries({ queryKey: ["estimate", id] });
    },
  });
}

export function useEstimates() {
  return useQuery({ queryKey: ["estimates"], queryFn: fetchEstimates });
}

export function useEstimate(id: string) {
  return useQuery({
    queryKey: ["estimate", id],
    queryFn: () => fetchEstimate(id),
    enabled: !!id,
  });
}

export function useSignEstimate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signerName, signatureBase64 }: { id: string; signerName: string; signatureBase64?: string | null }) =>
      signEstimate(id, signerName, signatureBase64),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["estimates"] });
      qc.invalidateQueries({ queryKey: ["estimate", vars.id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useMarkEstimateSent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markEstimateSent(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["estimates"] });
      qc.invalidateQueries({ queryKey: ["estimate", id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
