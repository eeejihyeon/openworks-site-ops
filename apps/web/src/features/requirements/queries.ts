import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { requirementsApi } from "./api";
import type { SiteRequirementFormValues } from "./schema";

export const requirementsKeys = {
  bySite: (siteId: string) => ["requirements", siteId] as const,
};

export function useSiteRequirements(siteId: string | null) {
  return useQuery({
    queryKey: requirementsKeys.bySite(siteId ?? ""),
    queryFn: () => requirementsApi.get(siteId as string),
    enabled: !!siteId,
  });
}

export function useSaveSiteRequirements(siteId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: SiteRequirementFormValues) =>
      requirementsApi.save(siteId as string, values),
    onSuccess: () => {
      if (siteId) qc.invalidateQueries({ queryKey: requirementsKeys.bySite(siteId) });
    },
  });
}
