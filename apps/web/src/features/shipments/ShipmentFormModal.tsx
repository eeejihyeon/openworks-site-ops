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
  radius,
  space,
} from "@facility/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import type {
  EquipmentCategoryRow,
  EquipmentRow,
  ShipmentItem,
  ShipmentRow,
  SiteRow,
  UserRow,
} from "@/lib/mock/db";

import { SHIPMENT_STATUSES, type ShipmentStatus } from "./schema";
import type { ShipmentFormValues } from "./schema";

export interface ShipmentFormModalProps {
  initial?: ShipmentRow;
  sites: SiteRow[];
  equipment: EquipmentRow[];
  equipmentCategories: EquipmentCategoryRow[];
  users: UserRow[];
  onClose: () => void;
  onSubmit: (values: ShipmentFormValues) => void;
  submitting?: boolean;
}

// 실제 출고 장비 행 (출고준비/출고완료)
type EquipmentRowItem = { _key: string; equipmentId: string; installLocation: string };

// 출고 요청 항목 행 (요청)
type RequestRowItem = {
  _key: string;
  category: string;
  equipmentType: string;
  quantity: number;
};

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  요청: "출고 요청",
  출고준비: "출고 준비",
  출고완료: "출고 완료",
};

const baseSchema = z.object({
  siteId: z.string().min(1, "현장을 선택하세요"),
  status: z.enum(SHIPMENT_STATUSES),
  requesterName: z.string().optional().default(""),
  deliveryRequestedAt: z.string().optional().default(""),
  shipperName: z.string().optional().default(""),
  delivererName: z.string().optional().default(""),
  note: z.string().optional().default(""),
});
type BaseFormValues = z.infer<typeof baseSchema>;

function initCatRows(
  categories: EquipmentCategoryRow[],
  equipment: EquipmentRow[],
  items?: ShipmentItem[]
): Record<string, EquipmentRowItem[]> {
  const result: Record<string, EquipmentRowItem[]> = {};
  for (const cat of categories) result[cat.name] = [];
  if (items) {
    for (const item of items) {
      const eq = equipment.find((e) => e.id === item.equipmentId);
      if (eq && eq.category in result) {
        (result[eq.category] as EquipmentRowItem[]).push({
          _key: `${eq.category}-${Math.random().toString(36).slice(2)}`,
          equipmentId: item.equipmentId,
          installLocation: item.installLocation ?? "",
        });
      }
    }
  }
  return result;
}

export function ShipmentFormModal({
  initial,
  sites,
  equipment,
  equipmentCategories,
  users,
  onClose,
  onSubmit,
  submitting,
}: ShipmentFormModalProps) {
  const [activeCategory, setActiveCategory] = useState(equipmentCategories[0]?.name ?? "");
  const [catRows, setCatRows] = useState<Record<string, EquipmentRowItem[]>>(() =>
    initCatRows(equipmentCategories, equipment, initial?.items)
  );
  const [requestRows, setRequestRows] = useState<RequestRowItem[]>(() =>
    (initial?.requestItems ?? []).map((ri) => ({
      _key: `req-${Math.random().toString(36).slice(2)}`,
      category: ri.category,
      equipmentType: ri.equipmentType,
      quantity: ri.quantity,
    }))
  );

  const [itemsError, setItemsError] = useState<string>();
  const [requestItemsError, setRequestItemsError] = useState<string>();
  const [quantityMismatchErrors, setQuantityMismatchErrors] = useState<string[]>([]);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BaseFormValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      siteId: initial?.siteId ?? "",
      status: initial?.status ?? "요청",
      requesterName: initial?.requesterName ?? "",
      deliveryRequestedAt: initial?.deliveryRequestedAt ?? "",
      shipperName: initial?.shipperName ?? "",
      delivererName: initial?.delivererName ?? "",
      note: initial?.note ?? "",
    },
  });

  const currentStatus = watch("status");

  // 카테고리별 장비 타입 목록 (요청 항목 드롭다운용)
  const typesByCategory = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const eq of equipment) {
      if (!map[eq.category]) map[eq.category] = [];
      const t = eq.equipmentType ?? "";
      if (t && !map[eq.category]!.includes(t)) map[eq.category]!.push(t);
    }
    return map;
  }, [equipment]);

  // 이미 선택된 category+type 조합
  const takenRequestKeys = new Set(requestRows.map((r) => `${r.category}|${r.equipmentType}`));

  // 수정 모드 시 기존 출고건에 포함된 장비 ID (출고완료여도 선택 유지)
  const initialEquipmentIds = new Set(initial?.items.map((i) => i.equipmentId) ?? []);

  // --- 요청 항목 CRUD ---
  const addRequestRow = () => {
    setRequestRows((prev) => [
      ...prev,
      { _key: `req-${Date.now()}`, category: "", equipmentType: "", quantity: 1 },
    ]);
  };
  const removeRequestRow = (key: string) => {
    setRequestRows((prev) => prev.filter((r) => r._key !== key));
  };
  const updateRequestRow = (key: string, patch: Partial<Omit<RequestRowItem, "_key">>) => {
    setRequestRows((prev) =>
      prev.map((r) => {
        if (r._key !== key) return r;
        // 카테고리가 바뀌면 타입 초기화
        if (patch.category && patch.category !== r.category)
          return { ...r, ...patch, equipmentType: "" };
        return { ...r, ...patch };
      })
    );
  };

  // --- 실제 장비 행 CRUD ---
  const addEquipmentRow = (category: string) => {
    setCatRows((prev) => ({
      ...prev,
      [category]: [
        ...(prev[category] ?? []),
        {
          _key: `${category}-${Date.now()}-${Math.random()}`,
          equipmentId: "",
          installLocation: "",
        },
      ],
    }));
  };
  const removeEquipmentRow = (category: string, key: string) => {
    setCatRows((prev) => ({
      ...prev,
      [category]: (prev[category] ?? []).filter((r) => r._key !== key),
    }));
  };
  const updateEquipmentRow = (
    category: string,
    key: string,
    patch: Partial<Omit<EquipmentRowItem, "_key">>
  ) => {
    setCatRows((prev) => ({
      ...prev,
      [category]: (prev[category] ?? []).map((r) => (r._key === key ? { ...r, ...patch } : r)),
    }));
  };

  const handleFormSubmit = handleSubmit((values) => {
    let hasError = false;

    if (values.status === "요청") {
      const validReqs = requestRows.filter((r) => r.category && r.equipmentType && r.quantity > 0);
      if (validReqs.length === 0) {
        setRequestItemsError("출고 요청 항목을 1개 이상 추가하세요");
        hasError = true;
      } else {
        setRequestItemsError(undefined);
      }
    }

    if (values.status === "출고준비" || values.status === "출고완료") {
      const items = Object.values(catRows)
        .flat()
        .filter((r) => r.equipmentId);
      if (items.length === 0) {
        setItemsError("출고 장비를 1개 이상 추가하세요");
        hasError = true;
      } else {
        setItemsError(undefined);
      }
    }

    // 출고완료: 요청 항목 수량 vs 실제 출고 장비 수량 매칭 검증
    if (values.status === "출고완료") {
      // 실제 장비를 category+equipmentType 기준으로 집계
      const actualCountMap: Record<string, number> = {};
      for (const rows of Object.values(catRows)) {
        for (const row of rows) {
          if (!row.equipmentId) continue;
          const eq = equipment.find((e) => e.id === row.equipmentId);
          if (!eq) continue;
          const key = `${eq.category}|${eq.equipmentType ?? ""}`;
          actualCountMap[key] = (actualCountMap[key] ?? 0) + 1;
        }
      }

      const validReqs = requestRows.filter((r) => r.category && r.equipmentType);
      const mismatchMessages: string[] = [];

      // 요청 항목 기준으로 매칭 확인
      for (const req of validReqs) {
        const key = `${req.category}|${req.equipmentType}`;
        const actual = actualCountMap[key] ?? 0;
        if (actual !== req.quantity) {
          mismatchMessages.push(
            `${req.category}·${req.equipmentType}: 요청 ${req.quantity}개 / 실제 ${actual}개`
          );
        }
        delete actualCountMap[key];
      }

      // 요청 항목에 없는 실제 장비가 있는 경우
      for (const [key, count] of Object.entries(actualCountMap)) {
        if (count > 0) {
          const [cat, type] = key.split("|");
          mismatchMessages.push(`${cat}${type ? `·${type}` : ""}: 요청 0개 / 실제 ${count}개`);
        }
      }

      if (mismatchMessages.length > 0) {
        setQuantityMismatchErrors(mismatchMessages);
        hasError = true;
      } else {
        setQuantityMismatchErrors([]);
      }
    } else {
      setQuantityMismatchErrors([]);
    }

    if (hasError) return;

    const items = Object.values(catRows)
      .flat()
      .filter((r) => r.equipmentId)
      .map((r) => ({ equipmentId: r.equipmentId, installLocation: r.installLocation }));

    const requestItems = requestRows
      .filter((r) => r.category && r.equipmentType)
      .map(({ category, equipmentType, quantity }) => ({ category, equipmentType, quantity }));

    onSubmit({
      siteId: values.siteId,
      status: values.status,
      requesterName: values.requesterName ?? "",
      deliveryRequestedAt: values.deliveryRequestedAt ?? "",
      requestItems,
      shipperName: values.shipperName ?? "",
      delivererName: values.delivererName ?? "",
      items: values.status === "요청" ? [] : items,
      note: values.note ?? "",
    });
  });

  // 현재 탭 장비 목록 / 행
  const activeEquipment = equipment.filter((eq) => eq.category === activeCategory);
  const currentRows = catRows[activeCategory] ?? [];

  // 소계 (실제 장비 탭)
  const typeCountMap: Record<string, number> = {};
  for (const row of currentRows) {
    if (row.equipmentId) {
      const eq = equipment.find((e) => e.id === row.equipmentId);
      const typeKey = eq?.equipmentType ?? eq?.name ?? row.equipmentId;
      typeCountMap[typeKey] = (typeCountMap[typeKey] ?? 0) + 1;
    }
  }
  const summary = Object.entries(typeCountMap).map(([type, count]) => ({ type, count }));

  const totalCount = Object.values(catRows)
    .flat()
    .filter((r) => r.equipmentId).length;

  const isRequest = currentStatus === "요청";
  const needShipper = currentStatus === "출고준비" || currentStatus === "출고완료";
  const needDeliverer = currentStatus === "출고완료";

  // 요청 단계 항목은 출고준비/완료에서 잠금
  const requestLocked = needShipper;

  return (
    <Modal title={initial ? "출고 수정" : "출고 등록"} onClose={onClose} width="800px">
      <form onSubmit={handleFormSubmit}>
        <Stack gap="lg">
          {/* 기본 정보 */}
          <Grid2>
            <FormField label="현장" required error={errors.siteId?.message}>
              <Controller
                control={control}
                name="siteId"
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">선택하세요</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </FormField>
            <FormField label="출고 상태" required error={errors.status?.message}>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select {...field}>
                    {SHIPMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </FormField>
          </Grid2>

          {/* 담당자 */}
          <Grid2>
            {/* 요청 담당자 - 항상 표시, 출고준비/완료에선 잠금 */}
            <FormField label="요청 담당자" required={isRequest} hint="요청자">
              <Controller
                control={control}
                name="requesterName"
                render={({ field }) => (
                  <Select {...field} disabled={requestLocked}>
                    <option value="">담당자 선택</option>
                    {users
                      .filter((u) => u.active)
                      .map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name}
                          {u.department ? ` (${u.department})` : ""}
                        </option>
                      ))}
                  </Select>
                )}
              />
            </FormField>

            {/* 납품 요청일 - 요청 상태에서만 입력, 이후엔 잠금 */}
            <FormField label="납품 요청일" hint="현장 납품 희망일">
              <Input type="date" disabled={requestLocked} {...register("deliveryRequestedAt")} />
            </FormField>
          </Grid2>

          <Grid2>
            {/* 출고 담당자 - 출고준비/완료에서만 활성화 */}
            <FormField label="출고 담당자" required={needShipper} hint="기술지원팀">
              <Controller
                control={control}
                name="shipperName"
                render={({ field }) => (
                  <Select {...field} disabled={isRequest}>
                    <option value="">담당자 선택</option>
                    {users
                      .filter((u) => u.active)
                      .map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name}
                          {u.department ? ` (${u.department})` : ""}
                        </option>
                      ))}
                  </Select>
                )}
              />
            </FormField>

            {/* 납품 담당자 - 출고완료에서만 활성화 */}
            <FormField label="납품 담당자" required={needDeliverer} hint="시공팀">
              <Controller
                control={control}
                name="delivererName"
                render={({ field }) => (
                  <Select {...field} disabled={!needDeliverer}>
                    <option value="">담당자 선택</option>
                    {users
                      .filter((u) => u.active)
                      .map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name}
                          {u.department ? ` (${u.department})` : ""}
                        </option>
                      ))}
                  </Select>
                )}
              />
            </FormField>
          </Grid2>

          {/* 수량 불일치 에러 (출고완료 저장 시) */}
          {quantityMismatchErrors.length > 0 && (
            <div
              style={{
                background: "#FEF2F2",
                border: `1px solid #FECACA`,
                borderRadius: radius.md,
                padding: `${space.sm} ${space.md}`,
              }}
            >
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#DC2626",
                }}
              >
                요청 수량과 출고 장비 수량이 일치하지 않습니다
              </p>
              <ul style={{ margin: 0, paddingLeft: "18px" }}>
                {quantityMismatchErrors.map((msg) => (
                  <li key={msg} style={{ fontSize: "12px", color: "#B91C1C", lineHeight: "1.8" }}>
                    {msg}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── 출고 요청 항목 (요청 상태) ── */}
          <FormField label="출고 요청 항목" required={isRequest} error={requestItemsError}>
            <div
              style={{
                border: `1px solid ${requestItemsError ? color.danger : color.border}`,
                borderRadius: radius.md,
                overflow: "hidden",
                opacity: requestLocked ? 0.6 : 1,
              }}
            >
              <div style={{ padding: space.md, background: color.surface }}>
                <Stack gap="sm">
                  {requestRows.length === 0 ? (
                    <div
                      style={{
                        color: color.inkFaint,
                        fontSize: "13px",
                        textAlign: "center",
                        padding: `${space.md} 0`,
                      }}
                    >
                      아래 버튼을 눌러 요청 항목을 추가하세요
                    </div>
                  ) : (
                    <>
                      {/* 헤더 */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 80px 36px",
                          gap: space.sm,
                          padding: `0 ${space.xs}`,
                        }}
                      >
                        {["장비 분류", "장비 타입", "수량", ""].map((h) => (
                          <span
                            key={h}
                            style={{ fontSize: "11px", color: color.inkMuted, fontWeight: 600 }}
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                      {requestRows.map((row) => {
                        const availableTypes = (typesByCategory[row.category] ?? []).filter(
                          (t) =>
                            !takenRequestKeys.has(`${row.category}|${t}`) || t === row.equipmentType
                        );
                        return (
                          <div
                            key={row._key}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr 80px 36px",
                              gap: space.sm,
                              alignItems: "center",
                            }}
                          >
                            <Select
                              value={row.category}
                              disabled={requestLocked}
                              onChange={(e) =>
                                updateRequestRow(row._key, { category: e.target.value })
                              }
                            >
                              <option value="">분류 선택</option>
                              {equipmentCategories.map((cat) => (
                                <option key={cat.id} value={cat.name}>
                                  {cat.name}
                                </option>
                              ))}
                            </Select>
                            <Select
                              value={row.equipmentType}
                              disabled={requestLocked || !row.category}
                              onChange={(e) =>
                                updateRequestRow(row._key, { equipmentType: e.target.value })
                              }
                            >
                              <option value="">타입 선택</option>
                              {availableTypes.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </Select>
                            <Input
                              type="number"
                              min={1}
                              value={row.quantity}
                              disabled={requestLocked}
                              onChange={(e) =>
                                updateRequestRow(row._key, {
                                  quantity: Math.max(1, Number(e.target.value)),
                                })
                              }
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={requestLocked}
                              onClick={() => removeRequestRow(row._key)}
                            >
                              ✕
                            </Button>
                          </div>
                        );
                      })}
                    </>
                  )}

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={requestLocked}
                    onClick={addRequestRow}
                  >
                    + 요청 항목 추가
                  </Button>
                </Stack>
              </div>
            </div>
          </FormField>

          {/* ── 실제 출고 장비 (출고준비/출고완료) ── */}
          <FormField
            label={`출고 장비${totalCount > 0 ? ` (총 ${totalCount}개)` : ""}`}
            required={needShipper}
            error={itemsError}
          >
            <div
              style={{
                border: `1px solid ${itemsError ? color.danger : color.border}`,
                borderRadius: radius.md,
                overflow: "hidden",
                opacity: isRequest ? 0.5 : 1,
                pointerEvents: isRequest ? "none" : undefined,
              }}
            >
              {/* 탭 헤더 */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  borderBottom: `1px solid ${color.border}`,
                  background: color.surfaceAlt,
                }}
              >
                {equipmentCategories.map((cat) => {
                  const catCount = (catRows[cat.name] ?? []).filter((r) => r.equipmentId).length;
                  const isActive = activeCategory === cat.name;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.name)}
                      style={{
                        padding: `${space.sm} ${space.lg}`,
                        border: "none",
                        borderBottom: isActive
                          ? `2px solid ${color.primary}`
                          : "2px solid transparent",
                        marginBottom: "-1px",
                        background: "transparent",
                        color: isActive ? color.primary : color.inkMuted,
                        fontWeight: isActive ? 600 : 400,
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: space.xs,
                        whiteSpace: "nowrap",
                        transition: "color 120ms ease",
                      }}
                    >
                      {cat.name}
                      {catCount > 0 && (
                        <span
                          style={{
                            background: color.primarySoft,
                            color: color.primary,
                            borderRadius: radius.pill,
                            padding: "1px 7px",
                            fontSize: "11px",
                            fontWeight: 700,
                            lineHeight: "16px",
                          }}
                        >
                          {catCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 탭 콘텐츠 */}
              <div style={{ padding: space.md, background: color.surface }}>
                <Stack gap="sm">
                  {currentRows.length === 0 ? (
                    <div
                      style={{
                        color: color.inkFaint,
                        fontSize: "13px",
                        textAlign: "center",
                        padding: `${space.md} 0`,
                      }}
                    >
                      아래 버튼을 눌러 장비를 추가하세요
                    </div>
                  ) : (
                    currentRows.map((row, rowIndex) => {
                      const takenIds = new Set(
                        currentRows
                          .filter((r) => r._key !== row._key && r.equipmentId)
                          .map((r) => r.equipmentId)
                      );
                      return (
                        <Row key={row._key} gap="sm" style={{ alignItems: "center" }}>
                          <div
                            style={{
                              width: "28px",
                              color: color.inkFaint,
                              fontSize: "12px",
                              textAlign: "center",
                              flexShrink: 0,
                            }}
                          >
                            {rowIndex + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <Select
                              value={row.equipmentId}
                              onChange={(e) =>
                                updateEquipmentRow(activeCategory, row._key, {
                                  equipmentId: e.target.value,
                                })
                              }
                            >
                              <option value="">장비 선택</option>
                              {activeEquipment.map((eq) => {
                                const alreadyShipped =
                                  eq.status === "출고완료" && !initialEquipmentIds.has(eq.id);
                                return (
                                  <option
                                    key={eq.id}
                                    value={eq.id}
                                    disabled={takenIds.has(eq.id) || alreadyShipped}
                                  >
                                    [{eq.code}] {eq.name}
                                    {alreadyShipped ? " (출고완료)" : ""}
                                  </option>
                                );
                              })}
                            </Select>
                          </div>
                          <div style={{ flex: 1, position: "relative" }}>
                            <Input
                              type="text"
                              placeholder="설치 위치 (예: A동 3층)"
                              value={row.installLocation}
                              onChange={(e) =>
                                updateEquipmentRow(activeCategory, row._key, {
                                  installLocation: e.target.value,
                                })
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEquipmentRow(activeCategory, row._key)}
                          >
                            삭제
                          </Button>
                        </Row>
                      );
                    })
                  )}

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => addEquipmentRow(activeCategory)}
                  >
                    + 장비 행 추가
                  </Button>

                  {summary.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: space.xs,
                        padding: `${space.sm} ${space.sm}`,
                        background: color.accentSoft,
                        borderRadius: radius.sm,
                        borderTop: `1px solid ${color.border}`,
                        marginTop: space.xs,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: color.inkFaint,
                          letterSpacing: "0.04em",
                          marginRight: "2px",
                        }}
                      >
                        소계
                      </span>
                      {summary.map(({ type, count }) => (
                        <span
                          key={type}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "12px",
                            fontWeight: 500,
                            color: color.primary,
                            background: color.primarySoft,
                            border: `1px solid ${color.borderStrong}`,
                            borderRadius: radius.pill,
                            padding: "2px 10px",
                          }}
                        >
                          {type}
                          <strong style={{ fontWeight: 700 }}>{count}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </Stack>
              </div>
            </div>
          </FormField>

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
