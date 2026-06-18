import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContact,
  createDeal,
  fetchContact,
  fetchContacts,
  fetchDeal,
  fetchDeals,
  fetchSalesStages,
  updateContact,
  updateDeal,
  updateDealStage,
  type ContactInput,
  type DealInput,
} from "@/lib/services/sales";

export function useContacts() {
  return useQuery({ queryKey: ["contacts"], queryFn: fetchContacts });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ["contact", id],
    queryFn: () => fetchContact(id),
    enabled: !!id,
  });
}

export function useDeals() {
  return useQuery({ queryKey: ["deals"], queryFn: fetchDeals });
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: ["deal", id],
    queryFn: () => fetchDeal(id),
    enabled: !!id,
  });
}

export function useSalesStages() {
  return useQuery({
    queryKey: ["sales-stages"],
    queryFn: fetchSalesStages,
    staleTime: 5 * 60_000,
  });
}

export function useUpdateDealStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      updateDealStage(id, stage),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["deal", vars.id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useSaveContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ContactInput }) =>
      id ? updateContact(id, input).then(() => id) : createContact(input),
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      if (id) qc.invalidateQueries({ queryKey: ["contact", id] });
    },
  });
}

export function useSaveDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: DealInput }) =>
      id ? updateDeal(id, input).then(() => id) : createDeal(input),
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      if (id) qc.invalidateQueries({ queryKey: ["deal", id] });
    },
  });
}
