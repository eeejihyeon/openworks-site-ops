import { http } from "@/lib/http";
import type { CompanyRow } from "@/lib/mock/db";

import type { CompanyFormValues } from "./schema";

export const companiesApi = {
  list: async (): Promise<CompanyRow[]> => {
    const { data } = await http.get<CompanyRow[]>("/companies");
    return data;
  },
  create: async (values: CompanyFormValues): Promise<CompanyRow> => {
    const { data } = await http.post<CompanyRow>("/companies", values);
    return data;
  },
  update: async (id: string, values: CompanyFormValues): Promise<CompanyRow> => {
    const { data } = await http.put<CompanyRow>(`/companies/${id}`, values);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await http.delete(`/companies/${id}`);
  },
};
