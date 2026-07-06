import { z } from "zod";

export const requirementItemSchema = z.object({
  title: z.string().min(1, "요구사항 제목을 입력하세요"),
  detail: z.string().optional().default(""),
});

export const routeRowSchema = z.object({
  routeName: z.string().min(1, "노선명을 입력하세요"),
  location: z.string().min(1, "위치/구간을 입력하세요"),
  equipmentCategory: z.string().optional().default(""),
  note: z.string().optional().default(""),
});

export const siteRequirementFormSchema = z.object({
  requirements: z.array(requirementItemSchema),
  routes: z.array(routeRowSchema),
});

export type SiteRequirementFormValues = z.infer<typeof siteRequirementFormSchema>;
