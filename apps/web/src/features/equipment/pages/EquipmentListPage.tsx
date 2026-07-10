import styled from "@emotion/styled";
import {
  Button,
  CodeTag,
  ClickableTr,
  EmptyRow,
  ExpandedInner,
  ExpandedSection,
  ExpandedTd,
  InfoItem,
  InfoLabel,
  InfoValue,
  MonoCell,
  PageDescription,
  PageHeader,
  PageTitle,
  Row,
  SectionDivider,
  StyledTable,
  TableChevron,
  TableWrap,
  Td,
  Thead,
  Toolbar,
  color,
  radius,
} from "@facility/ui";
import { Fragment, useState } from "react";

import { useShipments } from "@/features/shipments/queries";
import { useSites } from "@/features/sites/queries";
import type { EquipmentRow, EquipmentStatus } from "@/lib/mock/db";
import { useAuthStore } from "@/store/authStore";

import { EquipmentCategoryModal } from "../EquipmentCategoryModal";
import { EquipmentFormModal } from "../EquipmentFormModal";
import {
  useCreateEquipment,
  useDeleteEquipment,
  useEquipmentCategories,
  useEquipmentList,
  useUpdateEquipment,
} from "../queries";
import type { EquipmentFormValues } from "../schema";

// ---------- 상태 Pill ----------

const statusStyle: Record<EquipmentStatus, { fg: string; bg: string }> = {
  입고: { fg: color.inkMuted, bg: color.surfaceAlt },
  출고준비: { fg: "#B45309", bg: color.warningSoft },
  출고완료: { fg: color.success, bg: color.successSoft },
};

const StatusPill = styled.span<{ status: EquipmentStatus }>(({ status }) => {
  const { fg, bg } = statusStyle[status];
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "3px 10px",
    borderRadius: radius.pill,
    fontSize: "12px",
    fontWeight: 600,
    color: fg,
    background: bg,
    whiteSpace: "nowrap",
    "&::before": {
      content: '""',
      display: "inline-block",
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      background: fg,
      flexShrink: 0,
    },
  };
});

// ---------- 연결 링크 ----------

const ConnectLink = styled.a({
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 10px",
  fontSize: "12px",
  fontWeight: 600,
  borderRadius: radius.md,
  border: `1px solid ${color.accent}`,
  background: color.accentSoft,
  color: color.accent,
  cursor: "pointer",
  textDecoration: "none",
  transition: "background 120ms ease",
  whiteSpace: "nowrap",
  "&:hover": { background: color.primarySoft, color: color.primary },
});

const NoLink = styled.span({
  fontSize: "12px",
  color: color.inkFaint,
});

// ---------- 필터 ----------

const FilterLabel = styled.span({
  fontSize: "12px",
  fontWeight: 600,
  color: color.inkMuted,
  whiteSpace: "nowrap",
});

const FilterSelect = styled.select({
  padding: "7px 28px 7px 10px",
  fontSize: "13px",
  borderRadius: radius.md,
  border: `1px solid ${color.border}`,
  background: color.surface,
  color: color.ink,
  outline: "none",
  appearance: "none",
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6'><path d='M0 0l5 6 5-6z' fill='%235B6B80'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  transition: "border-color 120ms ease",
  "&:focus": { borderColor: color.accent, outline: "none" },
});

const COLS = 8; // 분류, 타입, 코드, 장비명, 제조사/모델, 상태, 연결, 관리

export default function EquipmentListPage() {
  const { data: equipment = [], isLoading } = useEquipmentList();
  const { data: categories = [] } = useEquipmentCategories();
  const { data: shipments = [] } = useShipments();
  const { data: sites = [] } = useSites();

  const createEquipment = useCreateEquipment();
  const updateEquipment = useUpdateEquipment();
  const deleteEquipment = useDeleteEquipment();

  const isAdmin = useAuthStore((s) => s.isAdmin());

  const [editing, setEditing] = useState<EquipmentRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");

  const toggleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  const getShipmentInfo = (eqId: string) => {
    const shipment = shipments
      .slice()
      .reverse()
      .find((s) => s.items.some((item) => item.equipmentId === eqId));
    if (!shipment) return null;
    const site = sites.find((s) => s.id === shipment.siteId);
    return { date: shipment.completedAt ?? shipment.preparedAt ?? shipment.requestedAt, siteName: site?.name ?? "알 수 없음" };
  };

  const equipmentHasShipment = (eqId: string) =>
    shipments.some((s) => s.items.some((item) => item.equipmentId === eqId));

  const filteredEquipment = equipment.filter((e) => {
    const matchStatus = !filterStatus || e.status === filterStatus;
    const matchCategory = !filterCategory || e.category === filterCategory;
    return matchStatus && matchCategory;
  });

  const hasFilter = !!(filterStatus || filterCategory);
  const resetFilters = () => {
    setFilterStatus("");
    setFilterCategory("");
  };

  const handleCreate = (values: EquipmentFormValues) => {
    createEquipment.mutate(values, { onSuccess: () => setCreating(false) });
  };

  const handleUpdate = (values: EquipmentFormValues) => {
    if (!editing) return;
    updateEquipment.mutate({ id: editing.id, values }, { onSuccess: () => setEditing(null) });
  };

  return (
    <div>
      <PageHeader>
        <div>
          <PageTitle>장비 마스터</PageTitle>
          <PageDescription>출고 관리에서 사용할 장비 기준정보를 등록합니다.</PageDescription>
        </div>
        <Row gap="sm">
          {isAdmin && (
            <Button variant="secondary" onClick={() => setShowCatModal(true)}>
              장비 종류 관리
            </Button>
          )}
          <Button onClick={() => setCreating(true)}>+ 장비 등록</Button>
        </Row>
      </PageHeader>

      <Toolbar>
        <Row gap="xs">
          <FilterLabel>분류</FilterLabel>
          <FilterSelect value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">전체</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </FilterSelect>
        </Row>
        <Row gap="xs">
          <FilterLabel>상태</FilterLabel>
          <FilterSelect value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">전체</option>
            <option value="입고">입고</option>
            <option value="출고준비">출고준비</option>
            <option value="출고완료">출고완료</option>
          </FilterSelect>
        </Row>
        {hasFilter && (
          <Button size="sm" variant="secondary" onClick={resetFilters}>
            초기화
          </Button>
        )}
      </Toolbar>

      <TableWrap>
        <StyledTable>
          <Thead>
            <tr>
              <th style={{ width: "16px" }} />
              <th>분류</th>
              <th>타입</th>
              <th>코드</th>
              <th>장비명</th>
              <th>제조사 / 모델</th>
              <th>상태</th>
              <th>연결</th>
              <th style={{ textAlign: "right" }}>관리</th>
            </tr>
          </Thead>
          <tbody>
            {filteredEquipment.length === 0 ? (
              <tr>
                <td colSpan={COLS + 1}>
                  <EmptyRow>
                    {isLoading
                      ? "불러오는 중..."
                      : hasFilter
                        ? "조건에 맞는 장비가 없습니다."
                        : "등록된 장비가 없습니다."}
                  </EmptyRow>
                </td>
              </tr>
            ) : (
              filteredEquipment.map((r) => {
                const isExpanded = expandedId === r.id;
                const hasLink = !!(r.ip && r.port);
                const shipInfo = r.status === "출고완료" ? getShipmentInfo(r.id) : null;

                return (
                  <Fragment key={r.id}>
                    <ClickableTr $selected={isExpanded} onClick={() => toggleExpand(r.id)}>
                      <Td style={{ width: "16px", paddingRight: 0 }}>
                        <TableChevron $open={isExpanded}>▶</TableChevron>
                      </Td>
                      <Td>{r.category}</Td>
                      <Td>
                        {r.equipmentType ? (
                          <span
                            style={{
                              fontSize: "12px",
                              color: color.inkMuted,
                              background: color.surfaceAlt,
                              border: `1px solid ${color.border}`,
                              borderRadius: radius.pill,
                              padding: "2px 8px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {r.equipmentType}
                          </span>
                        ) : (
                          <span style={{ color: color.inkFaint, fontSize: "12px" }}>-</span>
                        )}
                      </Td>
                      <Td>
                        <CodeTag>{r.code}</CodeTag>
                      </Td>
                      <Td>
                        <strong>{r.name}</strong>
                      </Td>
                      <Td>
                        <span style={{ fontSize: "13px" }}>{r.manufacturer}</span>
                        <MonoCell style={{ marginLeft: "6px" }}>{r.model}</MonoCell>
                      </Td>
                      <Td>
                        <StatusPill status={r.status}>{r.status}</StatusPill>
                      </Td>
                      <Td onClick={(e) => e.stopPropagation()}>
                        {hasLink ? (
                          <ConnectLink
                            href={`http://${r.ip}:${r.port}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            연결
                          </ConnectLink>
                        ) : (
                          <NoLink>-</NoLink>
                        )}
                      </Td>
                      <Td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <Button size="sm" variant="secondary" onClick={() => setEditing(r)}>
                            수정
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              if (confirm(`${r.name}을(를) 삭제할까요?`))
                                deleteEquipment.mutate(r.id);
                            }}
                          >
                            삭제
                          </Button>
                        </div>
                      </Td>
                    </ClickableTr>

                    {isExpanded && (
                      <tr>
                        <ExpandedTd colSpan={COLS + 1}>
                          <ExpandedInner>
                            {/* 네트워크 연결 정보 */}
                            <ExpandedSection>
                              <InfoItem>
                                <InfoLabel>IP</InfoLabel>
                                <InfoValue>{r.ip || "—"}</InfoValue>
                              </InfoItem>
                              <InfoItem>
                                <InfoLabel>PORT</InfoLabel>
                                <InfoValue>{r.port || "—"}</InfoValue>
                              </InfoItem>
                              {hasLink && (
                                <InfoItem>
                                  <InfoLabel>접속</InfoLabel>
                                  <ConnectLink
                                    href={`http://${r.ip}:${r.port}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    http://{r.ip}:{r.port}
                                  </ConnectLink>
                                </InfoItem>
                              )}
                              {r.note && (
                                <InfoItem>
                                  <InfoLabel>비고</InfoLabel>
                                  <InfoValue
                                    style={{ fontFamily: "inherit", color: color.inkMuted }}
                                  >
                                    {r.note}
                                  </InfoValue>
                                </InfoItem>
                              )}
                            </ExpandedSection>

                            {/* 출고 정보 */}
                            {r.status === "출고완료" && (
                              <>
                                <SectionDivider />
                                {shipInfo ? (
                                  <ExpandedSection>
                                    <InfoItem>
                                      <InfoLabel>출고일</InfoLabel>
                                      <InfoValue
                                        style={{ fontFamily: "inherit", color: color.inkMuted }}
                                      >
                                        {shipInfo.date}
                                      </InfoValue>
                                    </InfoItem>
                                    <InfoItem>
                                      <InfoLabel>현장</InfoLabel>
                                      <InfoValue
                                        style={{ fontFamily: "inherit", color: color.inkMuted }}
                                      >
                                        {shipInfo.siteName}
                                      </InfoValue>
                                    </InfoItem>
                                  </ExpandedSection>
                                ) : (
                                  <span style={{ fontSize: "13px", color: color.inkFaint }}>
                                    출고 내역 없음
                                  </span>
                                )}
                              </>
                            )}
                          </ExpandedInner>
                        </ExpandedTd>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </StyledTable>
      </TableWrap>

      {creating && (
        <EquipmentFormModal
          onClose={() => setCreating(false)}
          onSubmit={handleCreate}
          submitting={createEquipment.isPending}
        />
      )}
      {editing && (
        <EquipmentFormModal
          initial={editing}
          hasShipmentData={equipmentHasShipment(editing.id)}
          onClose={() => setEditing(null)}
          onSubmit={handleUpdate}
          submitting={updateEquipment.isPending}
        />
      )}
      {showCatModal && <EquipmentCategoryModal onClose={() => setShowCatModal(false)} />}
    </div>
  );
}
