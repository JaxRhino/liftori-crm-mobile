import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchOrgSettings,
  updateOrgSettings,
  type OrgSettings,
} from "@/lib/services/settings";

export function useOrgSettings() {
  return useQuery({ queryKey: ["org-settings"], queryFn: fetchOrgSettings });
}

export function useUpdateOrgSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<OrgSettings> }) =>
      updateOrgSettings(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-settings"] }),
  });
}
