import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { companiesApi } from "./api";
import type { CompanyFormValues } from "./schema";

export const companiesKeys = {
  all: ["companies"] as const,
};

export function useCompanies() {
  return useQuery({ queryKey: companiesKeys.all, queryFn: companiesApi.list });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: CompanyFormValues) => companiesApi.create(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: companiesKeys.all }),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CompanyFormValues }) =>
      companiesApi.update(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: companiesKeys.all }),
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => companiesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: companiesKeys.all }),
  });
}
