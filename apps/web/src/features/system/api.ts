import { http } from "@/lib/http";
import type { SystemInfoRow } from "@/lib/mock/db";

import type { SystemInfoFormValues } from "./schema";

export const systemInfoApi = {
  get: async (siteId: string): Promise<SystemInfoRow> => {
    const { data } = await http.get<SystemInfoRow>(`/sites/${siteId}/system-info`);
    return data;
  },
  save: async (siteId: string, values: SystemInfoFormValues): Promise<SystemInfoRow> => {
    const { data } = await http.put<SystemInfoRow>(`/sites/${siteId}/system-info`, values);
    return data;
  },
};
