import styled from "@emotion/styled";
import {
  Button,
  CheckboxRow,
  FormField,
  Grid2,
  Input,
  Modal,
  Row,
  Select,
  Stack,
  color,
  font,
} from "@facility/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import type { UserRow } from "@/lib/mock/db";

import { useDepartments } from "./queries";
import { roleOptions, userDefaultValues, userSchema } from "./schema";
import type { UserFormValues } from "./schema";

const SectionDivider = styled.div({
  borderTop: `1px solid ${color.border}`,
  paddingTop: 16,
});

const SectionLabel = styled.p({
  margin: "0 0 12px",
  fontSize: 12,
  fontWeight: 700,
  color: color.inkMuted,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontFamily: font.mono,
});

const PasswordHint = styled.p({
  margin: "4px 0 0",
  fontSize: 11,
  color: color.inkFaint,
});

export interface UserFormModalProps {
  initial?: UserRow;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
  submitting?: boolean;
}

export function UserFormModal({ initial, onClose, onSubmit, submitting }: UserFormModalProps) {
  const { data: departments = [] } = useDepartments();
  const isEditing = Boolean(initial);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          department: initial.department,
          role: initial.role,
          active: initial.active,
          phone: initial.phone ?? "",
          position: initial.position ?? "",
          email: initial.email ?? "",
          extension: initial.extension ?? "",
          newPassword: "",
        }
      : userDefaultValues,
  });

  return (
    <Modal title={isEditing ? "사용자 수정" : "사용자 등록"} onClose={onClose} width="520px">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="lg">
          <Grid2>
            <FormField label="이름" required error={errors.name?.message}>
              <Input {...register("name")} placeholder="예: 김도현" />
            </FormField>

            <FormField label="직급" error={errors.position?.message}>
              <Input {...register("position")} placeholder="예: 팀장" />
            </FormField>
          </Grid2>

          <Grid2>
            <FormField label="부서" required error={errors.department?.message}>
              <Controller
                control={control}
                name="department"
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">부서 선택</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </FormField>

            <FormField label="권한" required error={errors.role?.message}>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select {...field}>
                    {roleOptions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </FormField>
          </Grid2>

          <Grid2>
            <FormField label="연락처" error={errors.phone?.message}>
              <Input {...register("phone")} placeholder="예: 010-1234-5678" />
            </FormField>

            <FormField label="내선 번호" error={errors.extension?.message}>
              <Input {...register("extension")} placeholder="예: 101" />
            </FormField>
          </Grid2>

          <FormField label="이메일" error={errors.email?.message}>
            <Input {...register("email")} type="email" placeholder="예: user@company.com" />
          </FormField>

          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <CheckboxRow>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
                사용 여부 (체크 시 사용중)
              </CheckboxRow>
            )}
          />

          {/* 비밀번호 섹션 */}
          <SectionDivider>
            <SectionLabel>
              {isEditing ? "비밀번호 변경" : "초기 비밀번호"}
            </SectionLabel>
            <FormField
              label={isEditing ? "새 비밀번호" : "비밀번호"}
              error={errors.newPassword?.message}
            >
              <Input
                {...register("newPassword")}
                type="password"
                placeholder={
                  isEditing
                    ? "변경하지 않으려면 비워두세요"
                    : "미입력 시 password123 으로 설정됩니다"
                }
                autoComplete="new-password"
              />
            </FormField>
            {isEditing && (
              <PasswordHint>비밀번호는 6자 이상이어야 합니다.</PasswordHint>
            )}
          </SectionDivider>

          <Row gap="sm" style={{ justifyContent: "flex-end" }}>
            <Button type="button" variant="secondary" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={submitting}>
              {isEditing ? "수정 저장" : "등록"}
            </Button>
          </Row>
        </Stack>
      </form>
    </Modal>
  );
}
