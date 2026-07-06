import { z } from "zod";

export const SHIPMENT_STATUSES = ["요청", "출고준비", "출고완료"] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const shipmentRequestItemSchema = z.object({
  category: z.string().min(1, "분류를 선택하세요"),
  equipmentType: z.string().min(1, "타입을 선택하세요"),
  quantity: z.number().min(1, "수량을 입력하세요"),
});

export const shipmentItemSchema = z.object({
  equipmentId: z.string().min(1, "장비를 선택하세요"),
});

export const shipmentSchema = z.object({
  siteId: z.string().min(1, "현장을 선택하세요"),
  status: z.enum(SHIPMENT_STATUSES),
  requesterName: z.string().optional().default(""),
  deliveryRequestedAt: z.string().optional().default(""),
  requestItems: z.array(shipmentRequestItemSchema).optional().default([]),
  shipperName: z.string().optional().default(""),
  delivererName: z.string().optional().default(""),
  items: z.array(shipmentItemSchema).optional().default([]),
  note: z.string().optional().default(""),
});

export type ShipmentFormValues = z.infer<typeof shipmentSchema>;
