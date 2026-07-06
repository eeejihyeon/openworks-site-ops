import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { sitesApi } from "./api";
import type { SiteFormValues } from "./schema";

export const sitesKeys = {
  all: ["sites"] as const,
  detail: (id: string) => ["sites", id] as const,
};

export function useSites() {
  return useQuery({ queryKey: sitesKeys.all, queryFn: sitesApi.list });
}

export function useSite(id: string | null) {
  return useQuery({
    queryKey: sitesKeys.detail(id ?? ""),
    queryFn: () => sitesApi.get(id as string),
    enabled: !!id,
  });
}

export function useCreateSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: SiteFormValues) => sitesApi.create(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: sitesKeys.all }),
  });
}

export function useUpdateSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SiteFormValues }) =>
      sitesApi.update(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: sitesKeys.all }),
  });
}

export function useDeleteSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sitesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: sitesKeys.all }),
  });
}
