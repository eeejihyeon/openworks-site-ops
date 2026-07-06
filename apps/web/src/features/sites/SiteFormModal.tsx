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
  Textarea,
  color,
  radius,
  space,
} from "@facility/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import { useUsers } from "@/features/users/queries";
import type { CompanyRow, SiteRow } from "@/lib/mock/db";

import { siteDefaultValues, siteSchema, siteStatusOptions, systemStatusOptions } from "./schema";
import type { SiteFormValues } from "./schema";

const SectionBox = styled.div({
  display: "flex",
  flexDirection: "column",
  gap: space.md,
  padding: `${space.md} ${space.lg}`,
  background: color.surfaceAlt,
  border: `1px solid ${color.border}`,
  borderRadius: radius.lg,
});

const SectionTitle = styled.div({
  fontSize: "12px",
  fontWeight: 700,
  color: color.inkMuted,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
});

const ManagerRow = styled.div({
  display: "grid",
  gridTemplateColumns: "1fr 1fr auto",
  gap: space.sm,
  alignItems: "end",
});

const AddButton = styled.button({
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "6px 12px",
  fontSize: "13px",
  fontWeight: 500,
  color: color.primary,
  background: "transparent",
  border: `1px dashed ${color.primary}`,
  borderRadius: radius.md,
  cursor: "pointer",
  transition: "background 0.15s",
  alignSelf: "flex-start",
  "&:hover": {
    background: `${color.primary}10`,
  },
});

const RemoveButton = styled.button({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "36px",
  flexShrink: 0,
  fontSize: "16px",
  color: color.inkMuted,
  background: "transparent",
  border: `1px solid ${color.border}`,
  borderRadius: radius.md,
  cursor: "pointer",
  transition: "color 0.15s, border-color 0.15s",
  marginBottom: "0px",
  "&:hover": {
    color: color.danger,
    borderColor: color.danger,
  },
});

const MAX_MANAGERS = 3;

export interface SiteFormModalProps {
  initial?: SiteRow;
  companies: CompanyRow[];
  onClose: () => void;
  onSubmit: (values: SiteFormValues) => void;
  submitting?: boolean;
}

export function SiteFormModal({
  initial,
  companies,
  onClose,
  onSubmit,
  submitting,
}: SiteFormModalProps) {
  const { data: users = [] } = useUsers();
  const activeUsers = users.filter((u) => u.active);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SiteFormValues>({
    resolver: zodResolver(siteSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          companyId: initial.companyId,
          address: initial.address,
          startDate: initial.startDate,
          endDateExpected: initial.endDateExpected,
          status: initial.status,
          siteManagers: initial.siteManagers?.length
            ? initial.siteManagers.map((m) => ({ name: m.name, phone: m.phone ?? "" }))
            : [{ name: "", phone: "" }],
          salesManagers: initial.salesManagers?.length
            ? initial.salesManagers.map((m) => ({ name: m.name, phone: m.phone ?? "" }))
            : [{ name: "", phone: "" }],
          note: initial.note ?? "",
          systemActive: initial.systemActive,
          systemStatus: initial.systemStatus ?? "구축중",
          systemDomain: initial.systemDomain ?? "",
          systemServerIp: initial.systemServerIp ?? "",
          systemDeveloper: initial.systemDeveloper ?? "",
        }
      : siteDefaultValues,
  });

  const systemActive = watch("systemActive");

  const {
    fields: siteManagerFields,
    append: appendSiteManager,
    remove: removeSiteManager,
  } = useFieldArray({ control, name: "siteManagers" });

  const {
    fields: salesManagerFields,
    append: appendSalesManager,
    remove: removeSalesManager,
  } = useFieldArray({ control, name: "salesManagers" });

  const handleSalesManagerChange = (index: number, name: string) => {
    const user = activeUsers.find((u) => u.name === name);
    setValue(`salesManagers.${index}.phone`, user?.phone ?? "");
  };

  return (
    <Modal title={initial ? "현장 수정" : "현장 등록"} onClose={onClose} width="640px">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="lg">
          {/* 기본 정보 */}
          <FormField label="현장명" required error={errors.name?.message}>
            <Input {...register("name")} placeholder="예: 송산그린시티 (시화도시사업단)" />
          </FormField>

          <Grid2>
            <FormField label="건설사" required error={errors.companyId?.message}>
              <Controller
                control={control}
                name="companyId"
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">선택하세요</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </FormField>
            <FormField label="현장 상태" required error={errors.status?.message}>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select {...field}>
                    {siteStatusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </FormField>
          </Grid2>

          <FormField label="현장 주소" required error={errors.address?.message}>
            <Input {...register("address")} />
          </FormField>

          <Grid2>
            <FormField label="현장 시작일" required error={errors.startDate?.message}>
              <Input type="date" {...register("startDate")} />
            </FormField>
            <FormField label="종료 예정일" required error={errors.endDateExpected?.message}>
              <Input type="date" {...register("endDateExpected")} />
            </FormField>
          </Grid2>

          {/* 담당자 정보 */}
          <SectionBox>
            <SectionTitle>담당자 정보</SectionTitle>

            {/* 현장 담당자 */}
            <div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: color.ink,
                  marginBottom: space.sm,
                }}
              >
                현장 담당자
                {(errors.siteManagers as { message?: string } | undefined)?.message && (
                  <span
                    style={{
                      color: color.danger,
                      fontWeight: 400,
                      marginLeft: 8,
                      fontSize: "12px",
                    }}
                  >
                    {(errors.siteManagers as { message?: string }).message}
                  </span>
                )}
              </div>
              <Stack gap="sm">
                {siteManagerFields.map((field, index) => (
                  <ManagerRow key={field.id}>
                    <FormField
                      label={index === 0 ? "이름" : undefined}
                      error={errors.siteManagers?.[index]?.name?.message}
                    >
                      <Input
                        {...register(`siteManagers.${index}.name`)}
                        placeholder="현장 담당자"
                      />
                    </FormField>
                    <FormField
                      label={index === 0 ? "연락처" : undefined}
                      error={errors.siteManagers?.[index]?.phone?.message}
                    >
                      <Input
                        {...register(`siteManagers.${index}.phone`)}
                        placeholder="010-0000-0000"
                      />
                    </FormField>
                    <RemoveButton
                      type="button"
                      onClick={() => removeSiteManager(index)}
                      disabled={siteManagerFields.length === 1}
                      title="삭제"
                      style={
                        siteManagerFields.length === 1
                          ? {
                              opacity: 0.3,
                              cursor: "not-allowed",
                              marginTop: index === 0 ? "20px" : "0",
                            }
                          : { marginTop: index === 0 ? "20px" : "0" }
                      }
                    >
                      ×
                    </RemoveButton>
                  </ManagerRow>
                ))}
                {siteManagerFields.length < MAX_MANAGERS && (
                  <AddButton
                    type="button"
                    onClick={() => appendSiteManager({ name: "", phone: "" })}
                  >
                    + 현장 담당자 추가
                  </AddButton>
                )}
              </Stack>
            </div>

            {/* 영업 담당자 */}
            <div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: color.ink,
                  marginBottom: space.sm,
                }}
              >
                영업 담당자
                {(errors.salesManagers as { message?: string } | undefined)?.message && (
                  <span
                    style={{
                      color: color.danger,
                      fontWeight: 400,
                      marginLeft: 8,
                      fontSize: "12px",
                    }}
                  >
                    {(errors.salesManagers as { message?: string }).message}
                  </span>
                )}
              </div>
              <Stack gap="sm">
                {salesManagerFields.map((field, index) => {
                  const selectedName = watch(`salesManagers.${index}.name`);
                  const selectedUser = activeUsers.find((u) => u.name === selectedName);
                  const autoFilled = !!selectedUser?.phone;

                  return (
                    <ManagerRow key={field.id}>
                      <FormField
                        label={index === 0 ? "담당자" : undefined}
                        error={errors.salesManagers?.[index]?.name?.message}
                      >
                        <Controller
                          control={control}
                          name={`salesManagers.${index}.name`}
                          render={({ field: f }) => (
                            <Select
                              value={f.value}
                              onChange={(e) => {
                                f.onChange(e.target.value);
                                handleSalesManagerChange(index, e.target.value);
                              }}
                            >
                              <option value="">담당자 선택</option>
                              {activeUsers.map((u) => (
                                <option key={u.id} value={u.name}>
                                  {u.name}
                                  {u.position ? ` (${u.position})` : ""}
                                </option>
                              ))}
                            </Select>
                          )}
                        />
                      </FormField>
                      <FormField
                        label={index === 0 ? "연락처" : undefined}
                        hint={autoFilled ? "자동 입력" : undefined}
                        error={errors.salesManagers?.[index]?.phone?.message}
                      >
                        <Input
                          {...register(`salesManagers.${index}.phone`)}
                          placeholder={autoFilled ? "" : "010-0000-0000"}
                        />
                      </FormField>
                      <RemoveButton
                        type="button"
                        onClick={() => removeSalesManager(index)}
                        disabled={salesManagerFields.length === 1}
                        title="삭제"
                        style={
                          salesManagerFields.length === 1
                            ? {
                                opacity: 0.3,
                                cursor: "not-allowed",
                                marginTop: index === 0 ? "20px" : "0",
                              }
                            : { marginTop: index === 0 ? "20px" : "0" }
                        }
                      >
                        ×
                      </RemoveButton>
                    </ManagerRow>
                  );
                })}
                {salesManagerFields.length < MAX_MANAGERS && (
                  <AddButton
                    type="button"
                    onClick={() => appendSalesManager({ name: "", phone: "" })}
                  >
                    + 영업 담당자 추가
                  </AddButton>
                )}
              </Stack>
            </div>
          </SectionBox>

          {/* 시스템 사용 여부 */}
          <Controller
            control={control}
            name="systemActive"
            render={({ field }) => (
              <CheckboxRow>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
                시스템 사용
              </CheckboxRow>
            )}
          />

          {/* 시스템 상태 + 정보 (systemActive=true 일 때만) */}
          {systemActive && (
            <SectionBox>
              <SectionTitle>시스템 상태 및 정보</SectionTitle>

              <FormField label="시스템 상태" required error={errors.systemStatus?.message}>
                <Controller
                  control={control}
                  name="systemStatus"
                  render={({ field }) => (
                    <Select {...field}>
                      {systemStatusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  )}
                />
              </FormField>

              <Grid2>
                <FormField label="도메인" error={errors.systemDomain?.message}>
                  <Input {...register("systemDomain")} placeholder="예: site.facility.co.kr" />
                </FormField>
                <FormField label="운영서버 IP" error={errors.systemServerIp?.message}>
                  <Input {...register("systemServerIp")} placeholder="예: 192.168.0.240" />
                </FormField>
              </Grid2>

              <FormField label="개발 담당자" error={errors.systemDeveloper?.message}>
                <Input {...register("systemDeveloper")} placeholder="예: 김도현" />
              </FormField>
            </SectionBox>
          )}

          {/* 특이사항 */}
          <FormField label="특이사항">
            <Textarea {...register("note")} />
          </FormField>

          <Row gap="sm" style={{ justifyContent: "flex-end" }}>
            <Button type="button" variant="secondary" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={submitting}>
              {initial ? "수정 저장" : "등록"}
            </Button>
          </Row>
        </Stack>
      </form>
    </Modal>
  );
}
