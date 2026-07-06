import { http } from "@/lib/http";
import type { SiteRow } from "@/lib/mock/db";

import type { SiteFormValues } from "./schema";

export const sitesApi = {
  list: async (): Promise<SiteRow[]> => {
    const { data } = await http.get<SiteRow[]>("/sites");
    return data;
  },
  get: async (id: string): Promise<SiteRow> => {
    const { data } = await http.get<SiteRow>(`/sites/${id}`);
    return data;
  },
  create: async (values: SiteFormValues): Promise<SiteRow> => {
    const { data } = await http.post<SiteRow>("/sites", values);
    return data;
  },
  update: async (id: string, values: SiteFormValues): Promise<SiteRow> => {
    const { data } = await http.put<SiteRow>(`/sites/${id}`, values);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await http.delete(`/sites/${id}`);
  },
};
