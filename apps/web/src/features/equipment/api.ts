import { http } from "@/lib/http";
import type { EquipmentCategoryRow, EquipmentRow } from "@/lib/mock/db";

import type { EquipmentFormValues } from "./schema";

export const equipmentApi = {
  list: async (): Promise<EquipmentRow[]> => {
    const { data } = await http.get<EquipmentRow[]>("/equipment");
    return data;
  },
  create: async (values: EquipmentFormValues): Promise<EquipmentRow> => {
    const { data } = await http.post<EquipmentRow>("/equipment", values);
    return data;
  },
  update: async (id: string, values: EquipmentFormValues): Promise<EquipmentRow> => {
    const { data } = await http.put<EquipmentRow>(`/equipment/${id}`, values);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await http.delete(`/equipment/${id}`);
  },
};

export const equipmentCategoriesApi = {
  list: async (): Promise<EquipmentCategoryRow[]> => {
    const { data } = await http.get<EquipmentCategoryRow[]>("/equipment-categories");
    return data;
  },
  create: async (name: string): Promise<EquipmentCategoryRow> => {
    const { data } = await http.post<EquipmentCategoryRow>("/equipment-categories", { name });
    return data;
  },
  update: async (id: string, name: string): Promise<EquipmentCategoryRow> => {
    const { data } = await http.put<EquipmentCategoryRow>(`/equipment-categories/${id}`, { name });
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await http.delete(`/equipment-categories/${id}`);
  },
};
