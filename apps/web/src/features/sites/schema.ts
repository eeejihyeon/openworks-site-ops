import { z } from "zod";

export const siteStatusOptions = ["입찰대기", "계약전", "계약완료", "종료"] as const;
export const systemStatusOptions = ["구축중", "운영중", "종료"] as const;

export const managerSchema = z.object({
  name: z.string().min(1, "담당자 이름을 입력하세요"),
  phone: z.string().optional(),
});

export type ManagerEntry = z.infer<typeof managerSchema>;

export const siteSchema = z.object({
  name: z.string().min(1, "현장명을 입력하세요"),
  companyId: z.string().min(1, "건설사를 선택하세요"),
  address: z.string().min(1, "현장 주소를 입력하세요"),
  startDate: z.string().min(1, "현장 시작일을 입력하세요"),
  endDateExpected: z.string().min(1, "종료 예정일을 입력하세요"),
  status: z.enum(siteStatusOptions),
  siteManagers: z
    .array(managerSchema)
    .min(1, "현장 담당자를 최소 1명 입력하세요")
    .max(3),
  salesManagers: z
    .array(managerSchema)
    .min(1, "영업 담당자를 최소 1명 선택하세요")
    .max(3),
  note: z.string().optional().default(""),
  systemActive: z.boolean(),
  systemStatus: z.enum(systemStatusOptions).optional(),
  systemDomain: z.string().optional(),
  systemServerIp: z.string().optional(),
  systemDeveloper: z.string().optional(),
});

export type SiteFormValues = z.infer<typeof siteSchema>;

export const siteDefaultValues: SiteFormValues = {
  name: "",
  companyId: "",
  address: "",
  startDate: "",
  endDateExpected: "",
  status: "입찰대기",
  siteManagers: [{ name: "", phone: "" }],
  salesManagers: [{ name: "", phone: "" }],
  note: "",
  systemActive: false,
  systemStatus: "구축중",
  systemDomain: "",
  systemServerIp: "",
  systemDeveloper: "",
};
