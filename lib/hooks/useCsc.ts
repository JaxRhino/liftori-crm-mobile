/**
 * CSC react-query hooks (kitchen-exhaust-cleaning field flow).
 * ADDITIVE — only used on the CSC code path. Mirrors useOperations.ts:
 * useQuery for reads, useMutation with invalidateQueries for writes.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  closeOutCleaning,
  fetchAhjJurisdictions,
  fetchCleaning,
  fetchCleanings,
  fetchRestaurants,
  pushToAhj,
  updateCleaningChecklist,
  updateGreaseDepth,
  uploadCleaningPhoto,
  type ChecklistItem,
  type CloseOutInput,
  type HoodSection,
  type PhotoSlot,
  type PhotoUploadFile,
} from "@/lib/services/csc";

export function useCleanings() {
  return useQuery({ queryKey: ["cleanings"], queryFn: fetchCleanings });
}

export function useCleaning(id: string) {
  return useQuery({
    queryKey: ["cleaning", id],
    queryFn: () => fetchCleaning(id),
    enabled: !!id,
  });
}

export function useRestaurants() {
  return useQuery({
    queryKey: ["csc-restaurants"],
    queryFn: fetchRestaurants,
    staleTime: 5 * 60_000,
  });
}

export function useAhjJurisdictions() {
  return useQuery({
    queryKey: ["csc-ahj"],
    queryFn: fetchAhjJurisdictions,
    staleTime: 10 * 60_000,
  });
}

function invalidateCleaning(qc: ReturnType<typeof useQueryClient>, id: string) {
  qc.invalidateQueries({ queryKey: ["cleanings"] });
  qc.invalidateQueries({ queryKey: ["cleaning", id] });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
}

export function useUpdateChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, checklist }: { id: string; checklist: ChecklistItem[] }) =>
      updateCleaningChecklist(id, checklist),
    onSuccess: (_d, vars) => invalidateCleaning(qc, vars.id),
  });
}

export function useUpdateGreaseDepth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      pre,
      post,
    }: {
      id: string;
      pre: number | null;
      post: number | null;
    }) => updateGreaseDepth(id, pre, post),
    onSuccess: (_d, vars) => invalidateCleaning(qc, vars.id),
  });
}

export function useUploadCleaningPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      cleaningId,
      slot,
      hoodSection,
      file,
    }: {
      cleaningId: string;
      slot: PhotoSlot;
      hoodSection: HoodSection;
      file: PhotoUploadFile;
    }) => uploadCleaningPhoto(cleaningId, slot, hoodSection, file),
    onSuccess: (_d, vars) => invalidateCleaning(qc, vars.cleaningId),
  });
}

export function useCloseOutCleaning() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CloseOutInput }) =>
      closeOutCleaning(id, input),
    onSuccess: (_d, vars) => invalidateCleaning(qc, vars.id),
  });
}

export function usePushToAhj() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ certId, ahjId }: { certId: string; ahjId: string }) =>
      pushToAhj(certId, ahjId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cleanings"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
