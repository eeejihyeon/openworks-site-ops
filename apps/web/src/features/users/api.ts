import { http } from "@/lib/http";
import type { DepartmentRow, UserRow } from "@/lib/mock/db";

import type { UserFormValues } from "./schema";

export const usersApi = {
  list: async (): Promise<UserRow[]> => {
    const { data } = await http.get<UserRow[]>("/users");
    return data;
  },
  create: async (values: UserFormValues): Promise<UserRow> => {
    const { data } = await http.post<UserRow>("/users", values);
    return data;
  },
  update: async (id: string, values: UserFormValues): Promise<UserRow> => {
    const { data } = await http.put<UserRow>(`/users/${id}`, values);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await http.delete(`/users/${id}`);
  },
};

export const departmentsApi = {
  list: async (): Promise<DepartmentRow[]> => {
    const { data } = await http.get<DepartmentRow[]>("/departments");
    return data;
  },
  create: async (name: string): Promise<DepartmentRow> => {
    const { data } = await http.post<DepartmentRow>("/departments", { name });
    return data;
  },
  update: async (id: string, name: string): Promise<DepartmentRow> => {
    const { data } = await http.put<DepartmentRow>(`/departments/${id}`, { name });
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await http.delete(`/departments/${id}`);
  },
};
