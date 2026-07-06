import {
  Button,
  FormField,
  Grid2,
  Input,
  Modal,
  Row,
  Select,
  Stack,
  Textarea,
  color,
  font,
  space,
} from "@facility/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import type { EquipmentRow } from "@/lib/mock/db";

import { useEquipmentCategories, useEquipmentList } from "./queries";
import {
  equipmentCategoryKeys,
  equipmentDefaultValues,
  equipmentSchema,
  equipmentStatusOptions,
  equipmentTypeOptions,
} from "./schema";
import type { EquipmentFormValues } from "./schema";

export interface EquipmentFormModalProps {
  initial?: EquipmentRow;
  /** 수정 시 이 장비에 연결된 출고 내역 존재 여부 */
  hasShipmentData?: boolean;
  onClose: () => void;
  onSubmit: (values: EquipmentFormValues) => void;
  submitting?: boolean;
}

export function EquipmentFormModal({
  initial,
  hasShipmentData = false,
  onClose,
  onSubmit,
  submitting,
}: EquipmentFormModalProps) {
  const { data: categories = [] } = useEquipmentCategories();
  const { data: allEquipment = [] } = useEquipmentList();

  // 수정 시 기존 코드 유지, 신규 등록 시 자동 생성
  const [manualCode, setManualCode] = useState(!!initial);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          code: initial.code,
          category: initial.category,
          equipmentType: initial.equipmentType ?? "",
          manufacturer: initial.manufacturer,
          model: initial.model,
          note: initial.note ?? "",
          ip: initial.ip ?? "",
          port: initial.port ?? "",
          status: initial.status ?? "입고",
        }
      : equipmentDefaultValues,
  });

  const watchedCategory = useWatch({ control, name: "category" });
  const watchedType = useWatch({ control, name: "equipmentType" });

  // 분류 변경 시 타입 초기화 (최초 마운트 제외 - 수정 폼의 기존값 보존)
  const prevCategoryRef = useRef(initial?.category ?? "");
  useEffect(() => {
    if (watchedCategory !== prevCategoryRef.current) {
      prevCategoryRef.current = watchedCategory;
      setValue("equipmentType", "", { shouldValidate: false });
    }
  }, [watchedCategory, setValue]);

  // 분류+타입이 설정되고 직접입력이 아닐 때 코드 자동 생성
  useEffect(() => {
    if (manualCode || !watchedCategory || !watchedType) return;

    const catKey = equipmentCategoryKeys[watchedCategory] ?? watchedCategory.toUpperCase().slice(0, 4);
    const typeOpts = equipmentTypeOptions[watchedCategory] ?? [];
    const typeEntry = typeOpts.find((t) => t.label === watchedType);
    const typeKey = typeEntry?.key ?? watchedType.toUpperCase().slice(0, 3);

    // 같은 분류+타입의 기존 장비 수 (수정 시 자기 자신 제외)
    const count = allEquipment.filter((e) => {
      if (initial && e.id === initial.id) return false;
      return e.category === watchedCategory && e.equipmentType === watchedType;
    }).length;

    const newCode = `${catKey}-${typeKey}-${String(count + 1).padStart(3, "0")}`;
    setValue("code", newCode, { shouldValidate: false });
  }, [watchedCategory, watchedType, manualCode, allEquipment, initial, setValue]);

  const typeOpts = watchedCategory ? (equipmentTypeOptions[watchedCategory] ?? []) : [];
  const hasPresetTypes = typeOpts.length > 0;

  return (
    <Modal title={initial ? "장비 수정" : "장비 등록"} onClose={onClose} width="580px">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="lg">
          {/* 1. 분류 → 타입 */}
          <Grid2>
            <FormField label="장비분류" required error={errors.category?.message}>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">분류 선택</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </FormField>

            <FormField label="장비 타입" required error={errors.equipmentType?.message}>
              {hasPresetTypes ? (
                <Controller
                  control={control}
                  name="equipmentType"
                  render={({ field }) => (
                    <Select {...field} disabled={!watchedCategory}>
                      <option value="">타입 선택</option>
                      {typeOpts.map((t) => (
                        <option key={t.key} value={t.label}>
                          {t.label}
                        </option>
                      ))}
                    </Select>
                  )}
                />
              ) : (
                <Input
                  {...register("equipmentType")}
                  placeholder={watchedCategory ? "타입 입력" : "분류를 먼저 선택하세요"}
                  disabled={!watchedCategory}
                />
              )}
            </FormField>
          </Grid2>

          {/* 2. 장비명 + 코드 (자동생성) */}
          <Grid2>
            <FormField label="장비명" required error={errors.name?.message}>
              <Input {...register("name")} placeholder="예: 고정형 IP카메라" />
            </FormField>

            <FormField
              label="장비코드"
              required
              error={errors.code?.message}
              hint={manualCode ? "직접 입력 중" : "분류·타입 선택 시 자동 생성"}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: space.xs }}>
                <Input
                  {...register("code")}
                  readOnly={!manualCode}
                  placeholder="분류·타입 선택 후 자동 입력"
                  style={{
                    fontFamily: font.mono,
                    background: manualCode ? color.surface : color.surfaceAlt,
                    color: manualCode ? color.ink : color.inkMuted,
                    cursor: manualCode ? "text" : "default",
                  }}
                />
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: space.xs,
                    fontSize: "12px",
                    color: color.inkMuted,
                    cursor: "pointer",
                    userSelect: "none",
                    width: "fit-content",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={manualCode}
                    onChange={(e) => setManualCode(e.target.checked)}
                    style={{ margin: 0, accentColor: color.primary }}
                  />
                  직접 입력
                </label>
              </div>
            </FormField>
          </Grid2>

          {/* 3. 제조사 / 모델명 */}
          <Grid2>
            <FormField label="제조사" required error={errors.manufacturer?.message}>
              <Input {...register("manufacturer")} />
            </FormField>
            <FormField label="모델명" required error={errors.model?.message}>
              <Input {...register("model")} />
            </FormField>
          </Grid2>

          {/* 4. 상태 */}
          <Grid2>
            <FormField
              label="상태"
              required
              error={errors.status?.message}
              hint={hasShipmentData ? "출고 내역이 있어 상태를 변경할 수 없습니다" : undefined}
            >
              <div style={{ position: "relative" }}>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      {...field}
                      disabled={hasShipmentData}
                      style={
                        hasShipmentData
                          ? { background: color.surfaceAlt, color: color.inkFaint, cursor: "not-allowed" }
                          : undefined
                      }
                    >
                      {equipmentStatusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  )}
                />
              </div>
            </FormField>
            <div />
          </Grid2>

          {/* 5. IP / PORT */}
          <Grid2>
            <FormField label="IP 주소" error={errors.ip?.message} hint="장비 접속 IP">
              <Input {...register("ip")} placeholder="예: 192.168.1.100" />
            </FormField>
            <FormField label="PORT" error={errors.port?.message} hint="장비 접속 포트">
              <Input {...register("port")} placeholder="예: 554" />
            </FormField>
          </Grid2>

          {/* 6. 비고 */}
          <FormField label="비고">
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
