import { http } from "@/lib/http";
import type { SiteRequirementDoc } from "@/lib/mock/db";

import type { SiteRequirementFormValues } from "./schema";

export const requirementsApi = {
  get: async (siteId: string): Promise<SiteRequirementDoc> => {
    const { data } = await http.get<SiteRequirementDoc>(`/sites/${siteId}/requirements`);
    return data;
  },
  save: async (siteId: string, values: SiteRequirementFormValues): Promise<SiteRequirementDoc> => {
    const { data } = await http.put<SiteRequirementDoc>(`/sites/${siteId}/requirements`, values);
    return data;
  },
};
