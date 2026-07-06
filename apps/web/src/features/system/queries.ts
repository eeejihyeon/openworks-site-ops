import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { systemInfoApi } from "./api";
import type { SystemInfoFormValues } from "./schema";

export const systemInfoKeys = {
  bySite: (siteId: string) => ["system-info", siteId] as const,
};

export function useSystemInfo(siteId: string | null) {
  return useQuery({
    queryKey: systemInfoKeys.bySite(siteId ?? ""),
    queryFn: () => systemInfoApi.get(siteId as string),
    enabled: !!siteId,
  });
}

export function useSaveSystemInfo(siteId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: SystemInfoFormValues) => systemInfoApi.save(siteId as string, values),
    onSuccess: () => {
      if (siteId) qc.invalidateQueries({ queryKey: systemInfoKeys.bySite(siteId) });
    },
  });
}
