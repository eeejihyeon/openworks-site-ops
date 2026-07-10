import {
  Button,
  CodeTag,
  DataTable,
  ExpandedInner,
  InfoLabel,
  MonoCell,
  PageDescription,
  PageHeader,
  PageTitle,
  Toolbar,
  color,
  radius,
  type Column,
} from "@facility/ui";
import { useMemo, useState } from "react";

import { useCompanies } from "@/features/companies/queries";
import { useEquipmentCategories, useEquipmentList } from "@/features/equipment/queries";
import { useSites } from "@/features/sites/queries";
import { useUsers } from "@/features/users/queries";
import type { EquipmentRow, ShipmentRow, ShipmentStatus } from "@/lib/mock/db";

import { useCreateShipment, useDeleteShipment, useShipments, useUpdateShipment } from "../queries";
import type { ShipmentFormValues } from "../schema";
import { ShipmentFormModal } from "../ShipmentFormModal";

const STATUS_STYLE: Record<
  ShipmentStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  요청: { label: "출고요청", bg: "#FEF9C3", text: "#854D0E", border: "#FDE68A" },
  출고준비: { label: "출고준비", bg: "#DBEAFE", text: "#1D4ED8", border: "#BFDBFE" },
  출고완료: { label: "출고완료", bg: "#DCFCE7", text: "#166534", border: "#BBF7D0" },
};

function StatusBadge({ status }: { status?: ShipmentStatus }) {
  const s = (status && STATUS_STYLE[status]) ?? STATUS_STYLE["요청"];
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: "11px",
        fontWeight: 600,
        padding: "2px 9px",
        borderRadius: radius.pill,
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

/** 납품 요청일이 오늘 기준 1일 이내(당일·하루전·지남)이면 true.
 *  completedAt이 있으면 이미 완료된 것이므로 false 반환. */
function isDeliveryUrgent(deliveryRequestedAt?: string, completedAt?: string): boolean {
  if (!deliveryRequestedAt || completedAt) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(deliveryRequestedAt);
  target.setHours(0, 0, 0, 0);
  const diffDays = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 1; // 하루 전(1), 당일(0), 지남(<0) 모두 포함
}

type EquipmentGroup = {
  key: string;
  label: string;
  count: number;
  locations: string[];
};

function getShipmentEquipmentGroups(row: ShipmentRow, equipment: EquipmentRow[]): EquipmentGroup[] {
  if (row.status === "요청" && row.requestItems?.length) {
    return row.requestItems
      .filter((item) => item.category && item.equipmentType)
      .map((item) => ({
        key: `${item.category}|${item.equipmentType}`,
        label: `${item.category} · ${item.equipmentType}`,
        count: item.quantity,
        locations: [],
      }));
  }

  const groupMap = new Map<string, EquipmentGroup>();
  for (const item of row.items ?? []) {
    const eq = equipment.find((e) => e.id === item.equipmentId);
    if (!eq) continue;
    const key = `${eq.category}|${eq.equipmentType ?? ""}`;
    const label = eq.equipmentType ? `${eq.category} · ${eq.equipmentType}` : eq.category;
    const existing = groupMap.get(key);
    if (existing) {
      existing.count += 1;
      const loc = item.installLocation?.trim();
      if (loc && !existing.locations.includes(loc)) existing.locations.push(loc);
    } else {
      const loc = item.installLocation?.trim();
      groupMap.set(key, {
        key,
        label,
        count: 1,
        locations: loc ? [loc] : [],
      });
    }
  }

  return Array.from(groupMap.values()).sort((a, b) => b.count - a.count);
}

function getEquipmentSummary(groups: EquipmentGroup[]) {
  const total = groups.reduce((sum, group) => sum + group.count, 0);
  const preview = groups
    .slice(0, 2)
    .map((group) => group.label)
    .join(", ");
  const restKinds = Math.max(groups.length - 2, 0);
  return { total, kindCount: groups.length, preview, restKinds };
}

function EquipmentSummaryCell({ groups }: { groups: EquipmentGroup[] }) {
  const summary = getEquipmentSummary(groups);
  if (groups.length === 0) {
    return <span style={{ color: color.inkFaint }}>-</span>;
  }

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: "13px", fontWeight: 600, color: color.ink }}>
        {summary.kindCount}종 · 총 {summary.total}대
      </div>
      <div
        style={{
          fontSize: "11px",
          color: color.inkMuted,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "180px",
        }}
        title={groups.map((group) => `${group.label} ${group.count}대`).join(" / ")}
      >
        {summary.preview}
        {summary.restKinds > 0 ? ` 외 ${summary.restKinds}종` : ""}
      </div>
    </div>
  );
}

function ShipmentEquipmentDetail({
  row,
  equipment,
}: {
  row: ShipmentRow;
  equipment: EquipmentRow[];
}) {
  const groups = getShipmentEquipmentGroups(row, equipment);
  const isRequest = row.status === "요청";

  if (groups.length === 0) return null;

  const gridColumns = isRequest
    ? "minmax(70px, 0.33fr) minmax(80px, 96px)"
    : "minmax(70px, 0.33fr) minmax(80px, 96px) minmax(120px, 1fr)";
  const rowDivider = `1px solid rgba(15, 27, 62, 0.07)`;

  return (
    <ExpandedInner>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: gridColumns,
            gap: "10px 20px",
            alignItems: "baseline",
            paddingBottom: 8,
          }}
        >
          <InfoLabel>종류</InfoLabel>
          <InfoLabel>수량</InfoLabel>
          {!isRequest && <InfoLabel>설치 위치</InfoLabel>}
        </div>

        {groups.map((group, index) => (
          <div
            key={group.key}
            style={{
              display: "grid",
              gridTemplateColumns: gridColumns,
              gap: "10px 20px",
              alignItems: "baseline",
              padding: "10px 0",
              borderTop: index === 0 ? undefined : rowDivider,
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: color.ink,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={group.label}
            >
              {group.label}
            </span>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: isRequest ? "#854D0E" : color.primary,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {group.count}대
            </span>
            {!isRequest && (
              <span style={{ fontSize: "12px", color: color.inkMuted }}>
                {group.locations.length > 0 ? group.locations.join(", ") : "—"}
              </span>
            )}
          </div>
        ))}
      </div>
    </ExpandedInner>
  );
}

export default function ShipmentsListPage() {
  const { data: shipments = [], isLoading } = useShipments();
  const { data: sites = [] } = useSites();
  const { data: equipment = [] } = useEquipmentList();
  const { data: equipmentCategories = [] } = useEquipmentCategories();
  const { data: users = [] } = useUsers();
  useCompanies();

  const createShipment = useCreateShipment();
  const updateShipment = useUpdateShipment();
  const deleteShipment = useDeleteShipment();

  const [editing, setEditing] = useState<ShipmentRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? "-";

  const getGroupsForRow = (row: ShipmentRow) => getShipmentEquipmentGroups(row, equipment);

  const handleRowClick = (row: ShipmentRow) => {
    if (getGroupsForRow(row).length === 0) return;
    setExpandedId((prev) => (prev === row.id ? null : row.id));
  };

  // 출고요청 상태 항목을 항상 맨 위에 정렬, 나머지는 기존 순서 유지
  const sortedShipments = useMemo(() => {
    return [...shipments].sort((a, b) => {
      const aOrder = a.status === "요청" ? 0 : 1;
      const bOrder = b.status === "요청" ? 0 : 1;
      return aOrder - bOrder;
    });
  }, [shipments]);

  const columns: Column<ShipmentRow>[] = [
    { key: "shipmentNo", header: "출고번호", render: (r) => <CodeTag>{r.shipmentNo}</CodeTag> },
    {
      key: "status",
      header: "상태",
      render: (r) => <StatusBadge status={r.status as ShipmentStatus | undefined} />,
    },
    { key: "site", header: "현장", render: (r) => siteName(r.siteId) },
    {
      key: "deliveryRequestedAt",
      header: "납품 요청일",
      render: (r) => {
        if (!r.deliveryRequestedAt) return <span style={{ color: color.inkFaint }}>-</span>;
        const urgent = isDeliveryUrgent(r.deliveryRequestedAt, r.completedAt);
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontFamily: "monospace",
              fontSize: "13px",
              fontWeight: urgent ? 600 : 400,
              color: urgent ? "#DC2626" : undefined,
            }}
          >
            {urgent && (
              <span
                title="납품 요청일이 임박하거나 지났습니다"
                style={{ fontSize: "12px", lineHeight: 1 }}
              >
                ⚠
              </span>
            )}
            {r.deliveryRequestedAt}
          </span>
        );
      },
    },
    {
      key: "requestedAt",
      header: "요청일",
      render: (r) =>
        r.requestedAt ? (
          <MonoCell>{r.requestedAt}</MonoCell>
        ) : (
          <span style={{ color: color.inkFaint }}>-</span>
        ),
    },
    {
      key: "preparedAt",
      header: "준비일",
      render: (r) =>
        r.preparedAt ? (
          <MonoCell>{r.preparedAt}</MonoCell>
        ) : (
          <span style={{ color: color.inkFaint }}>-</span>
        ),
    },
    {
      key: "completedAt",
      header: "완료일",
      render: (r) =>
        r.completedAt ? (
          <MonoCell>{r.completedAt}</MonoCell>
        ) : (
          <span style={{ color: color.inkFaint }}>-</span>
        ),
    },
    {
      key: "personnel",
      header: "담당자",
      render: (r) => {
        const parts: string[] = [];
        if (r.requesterName) parts.push(`요청: ${r.requesterName}`);
        if (r.shipperName) parts.push(`출고: ${r.shipperName}`);
        if (r.delivererName) parts.push(`납품: ${r.delivererName}`);
        if (parts.length === 0) return <span style={{ color: color.inkFaint }}>-</span>;
        return (
          <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
            {parts.map((p) => (
              <div key={p}>{p}</div>
            ))}
          </div>
        );
      },
    },
    {
      key: "items",
      header: "장비",
      width: "200px",
      render: (r) => <EquipmentSummaryCell groups={getGroupsForRow(r)} />,
    },
    {
      key: "installLocation",
      header: "설치 위치",
      render: (r) => {
        // items에서 고유 설치 위치만 추출
        const locations = Array.from(
          new Set(
            (r.items ?? [])
              .map((it) => it.installLocation?.trim())
              .filter((loc): loc is string => !!loc)
          )
        );
        if (locations.length === 0) return <span style={{ color: color.inkFaint }}>-</span>;

        const visible = locations.slice(0, 2);
        const rest = locations.length - visible.length;
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
            {visible.map((loc) => (
              <span
                key={loc}
                title={loc}
                style={{
                  display: "inline-block",
                  maxWidth: "120px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: "12px",
                  fontWeight: 500,
                  padding: "2px 8px",
                  borderRadius: radius.pill,
                  background: "#F0FDF4",
                  color: "#166534",
                  border: "1px solid #BBF7D0",
                }}
              >
                {loc}
              </span>
            ))}
            {rest > 0 && (
              <span
                title={locations.slice(2).join(", ")}
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: color.inkMuted,
                  padding: "2px 7px",
                  borderRadius: radius.pill,
                  background: color.surfaceAlt,
                  border: `1px solid ${color.border}`,
                  cursor: "default",
                }}
              >
                +{rest}
              </span>
            )}
          </div>
        );
      },
    },
    { key: "note", header: "비고", render: (r) => r.note || "-" },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div
          style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button size="sm" variant="secondary" onClick={() => setEditing(r)}>
            수정
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              if (confirm(`${r.shipmentNo} 출고 내역을 삭제할까요?`)) deleteShipment.mutate(r.id);
            }}
          >
            삭제
          </Button>
        </div>
      ),
    },
  ];

  const handleCreate = (values: ShipmentFormValues) => {
    createShipment.mutate(values, { onSuccess: () => setCreating(false) });
  };

  const handleUpdate = (values: ShipmentFormValues) => {
    if (!editing) return;
    updateShipment.mutate({ id: editing.id, values }, { onSuccess: () => setEditing(null) });
  };

  return (
    <div>
      <PageHeader>
        <div>
          <PageTitle>출고 관리</PageTitle>
          <PageDescription>현장으로 출고되는 장비 내역을 등록하고 관리합니다.</PageDescription>
        </div>
        <Button onClick={() => setCreating(true)}>+ 출고 등록</Button>
      </PageHeader>

      <Toolbar />

      <DataTable
        columns={columns}
        rows={sortedShipments}
        rowKey={(r) => r.id}
        emptyMessage={isLoading ? "불러오는 중..." : "등록된 출고 내역이 없습니다."}
        expandable
        expandedRowKey={expandedId}
        canExpandRow={(row) => getGroupsForRow(row).length > 0}
        onRowClick={handleRowClick}
        renderExpandedRow={(row) => <ShipmentEquipmentDetail row={row} equipment={equipment} />}
      />

      {creating && (
        <ShipmentFormModal
          sites={sites}
          equipment={equipment}
          equipmentCategories={equipmentCategories}
          users={users}
          onClose={() => setCreating(false)}
          onSubmit={handleCreate}
          submitting={createShipment.isPending}
        />
      )}
      {editing && (
        <ShipmentFormModal
          initial={editing}
          sites={sites}
          equipment={equipment}
          equipmentCategories={equipmentCategories}
          users={users}
          onClose={() => setEditing(null)}
          onSubmit={handleUpdate}
          submitting={updateShipment.isPending}
        />
      )}
    </div>
  );
}
