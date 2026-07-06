import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { equipmentApi, equipmentCategoriesApi } from "./api";
import type { EquipmentFormValues } from "./schema";

export const equipmentKeys = {
  all: ["equipment"] as const,
};

export const equipmentCategoriesKeys = {
  all: ["equipment-categories"] as const,
};

export function useEquipmentList() {
  return useQuery({ queryKey: equipmentKeys.all, queryFn: equipmentApi.list });
}

export function useCreateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: EquipmentFormValues) => equipmentApi.create(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: equipmentKeys.all }),
  });
}

export function useUpdateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: EquipmentFormValues }) =>
      equipmentApi.update(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: equipmentKeys.all }),
  });
}

export function useDeleteEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => equipmentApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: equipmentKeys.all }),
  });
}

export function useEquipmentCategories() {
  return useQuery({
    queryKey: equipmentCategoriesKeys.all,
    queryFn: equipmentCategoriesApi.list,
  });
}

export function useCreateEquipmentCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => equipmentCategoriesApi.create(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: equipmentCategoriesKeys.all }),
  });
}

export function useUpdateEquipmentCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      equipmentCategoriesApi.update(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: equipmentCategoriesKeys.all }),
  });
}

export function useDeleteEquipmentCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => equipmentCategoriesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: equipmentCategoriesKeys.all }),
  });
}
