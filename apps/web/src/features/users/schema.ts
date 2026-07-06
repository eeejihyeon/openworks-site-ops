import { z } from "zod";

export const roleOptions = ["관리자", "일반"] as const;

export const userSchema = z.object({
  name: z.string().min(1, "이름을 입력하세요").max(30),
  department: z.string().min(1, "부서를 선택하세요"),
  role: z.enum(roleOptions),
  active: z.boolean(),
  phone: z.string().max(20).optional(),
  position: z.string().max(20).optional(),
  email: z
    .string()
    .max(100)
    .optional()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "올바른 이메일 형식이 아닙니다",
    }),
  extension: z.string().max(20).optional(),
  newPassword: z
    .string()
    .optional()
    .refine((v) => !v || v.length >= 6, {
      message: "비밀번호는 6자 이상이어야 합니다",
    }),
});

export type UserFormValues = z.infer<typeof userSchema>;

export const userDefaultValues: UserFormValues = {
  name: "",
  department: "",
  role: "일반",
  active: true,
  phone: "",
  position: "",
  email: "",
  extension: "",
  newPassword: "",
};
