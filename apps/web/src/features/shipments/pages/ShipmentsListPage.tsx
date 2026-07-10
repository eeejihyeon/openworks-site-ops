import {
  Button,
  CodeTag,
  DataTable,
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
import type { ShipmentRow, ShipmentStatus } from "@/lib/mock/db";

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

  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? "-";

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
      render: (r) => {
        // 출고요청 상태 → requestItems 요약 표시
        if (r.status === "요청" && r.requestItems?.length) {
          return (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {r.requestItems.map(({ category, equipmentType, quantity }) => (
                <span
                  key={`${category}|${equipmentType}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                    fontSize: "12px",
                    background: "#FEF9C3",
                    color: "#854D0E",
                    border: "1px solid #FDE68A",
                    borderRadius: radius.pill,
                    padding: "2px 9px",
                    whiteSpace: "nowrap",
                    fontWeight: 500,
                  }}
                >
                  {category}
                  {equipmentType && (
                    <span style={{ color: "#A16207", fontWeight: 400 }}>·{equipmentType}</span>
                  )}
                  <strong style={{ fontWeight: 700, marginLeft: "2px" }}>{quantity}</strong>
                </span>
              ))}
            </div>
          );
        }

        // 출고준비/완료 → 실제 장비 그룹 요약
        const groupMap: Record<string, { cat: string; type: string; count: number }> = {};
        for (const it of r.items ?? []) {
          const eq = equipment.find((e) => e.id === it.equipmentId);
          if (!eq) continue;
          const key = `${eq.category}|${eq.equipmentType ?? ""}`;
          if (groupMap[key]) groupMap[key].count += 1;
          else groupMap[key] = { cat: eq.category, type: eq.equipmentType ?? "", count: 1 };
        }
        const groups = Object.values(groupMap);
        if (groups.length === 0) return <span style={{ color: color.inkFaint }}>-</span>;
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {groups.map(({ cat, type, count }) => (
              <span
                key={`${cat}|${type}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  fontSize: "12px",
                  background: color.primarySoft,
                  color: color.primary,
                  border: `1px solid ${color.borderStrong}`,
                  borderRadius: radius.pill,
                  padding: "2px 9px",
                  whiteSpace: "nowrap",
                  fontWeight: 500,
                }}
              >
                {cat}
                {type && <span style={{ color: color.inkMuted, fontWeight: 400 }}>·{type}</span>}
                <strong style={{ fontWeight: 700, marginLeft: "2px" }}>{count}</strong>
              </span>
            ))}
          </div>
        );
      },
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
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
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
