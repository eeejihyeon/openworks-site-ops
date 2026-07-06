import { z } from "zod";

export const developerTypeOptions = ["자체개발", "외주개발", "협력사개발"] as const;

export const systemInfoSchema = z.object({
  operationInfo: z.string().min(1, "시스템 운영 정보를 입력하세요"),
  developerType: z.enum(developerTypeOptions),
  developerName: z.string().min(1, "개발사/담당팀명을 입력하세요"),
});

export type SystemInfoFormValues = z.infer<typeof systemInfoSchema>;

export const systemInfoDefaultValues: SystemInfoFormValues = {
  operationInfo: "",
  developerType: "자체개발",
  developerName: "",
};
