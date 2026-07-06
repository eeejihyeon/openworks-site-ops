import { http } from "@/lib/http";
import type { ShipmentRow } from "@/lib/mock/db";

import type { ShipmentFormValues } from "./schema";

export const shipmentsApi = {
  list: async (siteId?: string): Promise<ShipmentRow[]> => {
    const { data } = await http.get<ShipmentRow[]>("/shipments", {
      params: siteId ? { siteId } : undefined,
    });
    return data;
  },
  create: async (values: ShipmentFormValues): Promise<ShipmentRow> => {
    const { data } = await http.post<ShipmentRow>("/shipments", values);
    return data;
  },
  update: async (id: string, values: ShipmentFormValues): Promise<ShipmentRow> => {
    const { data } = await http.put<ShipmentRow>(`/shipments/${id}`, values);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await http.delete(`/shipments/${id}`);
  },
};
