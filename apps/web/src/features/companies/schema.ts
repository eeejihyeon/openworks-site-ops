import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(1, "건설사명을 입력하세요"),
  contactName: z.string().optional(),
  contactPhone: z
    .string()
    .optional()
    .refine((v) => !v || /^[0-9-]+$/.test(v), "숫자와 -만 입력하세요"),
  contactEmail: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "올바른 이메일 형식이 아닙니다"
    ),
  address: z.string().optional(),
  note: z.string().optional().default(""),
  active: z.boolean(),
  logoUrl: z.string().optional().default(""),
  colors: z.array(z.string()).optional().default([]),
});

export type CompanyFormValues = z.infer<typeof companySchema>;

export const companyDefaultValues: CompanyFormValues = {
  name: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  address: "",
  note: "",
  active: true,
  logoUrl: "",
  colors: [],
};
