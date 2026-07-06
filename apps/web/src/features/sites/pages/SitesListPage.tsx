import styled from "@emotion/styled";
import {
  Button,
  DataTable,
  PageDescription,
  PageHeader,
  PageTitle,
  StatusPill,
  Toolbar,
  color,
  radius,
  type Column,
} from "@facility/ui";
import { useState } from "react";
import { useNavigate } from "react-router";

import { useCompanies } from "@/features/companies/queries";
import type { SiteRow, SystemStatus } from "@/lib/mock/db";
import { useUiStore } from "@/store/uiStore";

import { useCreateSite, useDeleteSite, useSites, useUpdateSite } from "../queries";
import type { SiteFormValues } from "../schema";
import { SiteFormModal } from "../SiteFormModal";

const SubText = styled.span({
  fontSize: "12px",
  color: color.inkFaint,
});

const InactivePill = styled.span({
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  padding: "3px 10px",
  borderRadius: radius.pill,
  fontSize: "12px",
  fontWeight: 600,
  color: color.inkFaint,
  background: color.surfaceAlt,
  whiteSpace: "nowrap",
});

export default function SitesListPage() {
  const { data: sites = [], isLoading } = useSites();
  const { data: companies = [] } = useCompanies();
  const createSite = useCreateSite();
  const updateSite = useUpdateSite();
  const deleteSite = useDeleteSite();
  const setActiveSiteId = useUiStore((s) => s.setActiveSiteId);
  const navigate = useNavigate();

  const [editing, setEditing] = useState<SiteRow | null>(null);
  const [creating, setCreating] = useState(false);

  const companyName = (id: string) => companies.find((c) => c.id === id)?.name ?? "-";

  const columns: Column<SiteRow>[] = [
    { key: "name", header: "현장명", render: (r) => <strong>{r.name}</strong> },
    { key: "company", header: "건설사", render: (r) => companyName(r.companyId) },
    {
      key: "status",
      header: "현장 상태",
      render: (r) => <StatusPill status={r.status} />,
    },
    {
      key: "system",
      header: "시스템 상태",
      render: (r) =>
        r.systemActive && r.systemStatus ? (
          <StatusPill status={r.systemStatus as SystemStatus} />
        ) : (
          <InactivePill>미사용</InactivePill>
        ),
    },
    { key: "startDate", header: "시작일", render: (r) => r.startDate },
    { key: "endDateExpected", header: "종료 예정일", render: (r) => r.endDateExpected },
    {
      key: "siteManager",
      header: "현장 담당자",
      render: (r) => {
        const managers = r.siteManagers ?? [];
        if (managers.length === 0) return <span>-</span>;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {managers.map((m, i) => (
              <div key={i}>
                <div>{m.name}</div>
                {m.phone && <SubText>{m.phone}</SubText>}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: "salesManager",
      header: "영업 담당자",
      render: (r) => {
        const managers = r.salesManagers ?? [];
        if (managers.length === 0) return <span>-</span>;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {managers.map((m, i) => (
              <div key={i}>
                <div>{m.name}</div>
                {m.phone && <SubText>{m.phone}</SubText>}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setActiveSiteId(r.id);
              navigate("/requirements");
            }}
          >
            요구사항
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setActiveSiteId(r.id);
              navigate("/system");
            }}
          >
            시스템 관리
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setEditing(r)}>
            수정
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              if (confirm(`${r.name} 현장을 삭제할까요?`)) deleteSite.mutate(r.id);
            }}
          >
            삭제
          </Button>
        </div>
      ),
    },
  ];

  const handleCreate = (values: SiteFormValues) => {
    createSite.mutate(values, { onSuccess: () => setCreating(false) });
  };

  const handleUpdate = (values: SiteFormValues) => {
    if (!editing) return;
    updateSite.mutate({ id: editing.id, values }, { onSuccess: () => setEditing(null) });
  };

  return (
    <div>
      <PageHeader>
        <div>
          <PageTitle>현장 관리</PageTitle>
          <PageDescription>진행 중인 현장의 계약/구축/운영 상태를 관리합니다.</PageDescription>
        </div>
        <Button onClick={() => setCreating(true)}>+ 현장 등록</Button>
      </PageHeader>

      <Toolbar />

      <DataTable
        columns={columns}
        rows={sites}
        rowKey={(r) => r.id}
        emptyMessage={isLoading ? "불러오는 중..." : "등록된 현장이 없습니다."}
      />

      {creating && (
        <SiteFormModal
          companies={companies}
          onClose={() => setCreating(false)}
          onSubmit={handleCreate}
          submitting={createSite.isPending}
        />
      )}
      {editing && (
        <SiteFormModal
          initial={editing}
          companies={companies}
          onClose={() => setEditing(null)}
          onSubmit={handleUpdate}
          submitting={updateSite.isPending}
        />
      )}
    </div>
  );
}
