import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { equipmentKeys } from "@/features/equipment/queries";

import { shipmentsApi } from "./api";
import type { ShipmentFormValues } from "./schema";

export const shipmentsKeys = {
  all: ["shipments"] as const,
  bySite: (siteId?: string) => ["shipments", { siteId }] as const,
};

/** 출고 변경 후 출고 + 장비 양쪽 캐시를 동시에 무효화 */
function invalidateBoth(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: shipmentsKeys.all });
  qc.invalidateQueries({ queryKey: equipmentKeys.all });
}

export function useShipments(siteId?: string) {
  return useQuery({
    queryKey: shipmentsKeys.bySite(siteId),
    queryFn: () => shipmentsApi.list(siteId),
  });
}

export function useCreateShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: ShipmentFormValues) => shipmentsApi.create(values),
    onSuccess: () => invalidateBoth(qc),
  });
}

export function useUpdateShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ShipmentFormValues }) =>
      shipmentsApi.update(id, values),
    onSuccess: () => invalidateBoth(qc),
  });
}

export function useDeleteShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shipmentsApi.remove(id),
    onSuccess: () => invalidateBoth(qc),
  });
}
