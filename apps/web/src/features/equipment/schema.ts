import { z } from "zod";

// requirements/schema.ts에서 참조하므로 유지
export const equipmentCategoryOptions = ["CCTV", "가스센서", "DID", "방송장비"] as const;

export const equipmentStatusOptions = ["입고", "출고준비", "출고완료"] as const;
export type EquipmentStatusOption = (typeof equipmentStatusOptions)[number];

/** 장비 분류별 타입 목록 (label: 표시명, key: 코드 약어) */
export const equipmentTypeOptions: Record<string, { label: string; key: string }[]> = {
  CCTV: [
    { label: "이동형", key: "MOB" },
    { label: "고정형", key: "FIX" },
    { label: "대차형", key: "CAR" },
  ],
  가스센서: [
    { label: "복합형", key: "MX" },
    { label: "단독형", key: "SG" },
  ],
  DID: [
    { label: "옥외형", key: "OUT" },
    { label: "옥내형", key: "IN" },
  ],
  방송장비: [
    { label: "앰프", key: "AMP" },
    { label: "스피커", key: "SPK" },
  ],
};

/** 장비 분류별 코드 접두어 */
export const equipmentCategoryKeys: Record<string, string> = {
  CCTV: "CCTV",
  가스센서: "GAS",
  DID: "DID",
  방송장비: "BC",
};

export const equipmentSchema = z.object({
  name: z.string().min(1, "장비명을 입력하세요"),
  code: z
    .string()
    .min(1, "장비코드를 입력하세요")
    .regex(/^[A-Za-z0-9-]+$/, "영문/숫자/-만 입력하세요"),
  category: z.string().min(1, "장비분류를 선택하세요"),
  equipmentType: z.string().min(1, "장비 타입을 선택하세요"),
  manufacturer: z.string().min(1, "제조사를 입력하세요"),
  model: z.string().min(1, "모델명을 입력하세요"),
  note: z.string().optional().default(""),
  ip: z.string().optional().default(""),
  port: z.string().optional().default(""),
  status: z.enum(equipmentStatusOptions),
});

export type EquipmentFormValues = z.infer<typeof equipmentSchema>;

export const equipmentDefaultValues: EquipmentFormValues = {
  name: "",
  code: "",
  category: "",
  equipmentType: "",
  manufacturer: "",
  model: "",
  note: "",
  ip: "",
  port: "",
  status: "입고",
};
