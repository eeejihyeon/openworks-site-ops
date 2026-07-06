import styled from "@emotion/styled";
import {
  ActivePill,
  Button,
  DataTable,
  PageDescription,
  PageHeader,
  PageTitle,
  Row,
  Toolbar,
  color,
  radius,
  type Column,
} from "@facility/ui";
import { useMemo, useState } from "react";

import type { CompanyRow } from "@/lib/mock/db";

import { CompanyFormModal } from "../CompanyFormModal";
import {
  useCompanies,
  useCreateCompany,
  useDeleteCompany,
  useUpdateCompany,
} from "../queries";
import type { CompanyFormValues } from "../schema";

const SearchInput = styled.input({
  padding: "7px 12px",
  fontSize: "13px",
  borderRadius: radius.md,
  border: `1px solid ${color.border}`,
  background: color.surface,
  color: color.ink,
  outline: "none",
  minWidth: "200px",
  transition: "border-color 120ms ease, box-shadow 120ms ease",
  "&:focus": {
    borderColor: color.accent,
    boxShadow: `0 0 0 3px ${color.accentSoft}`,
  },
  "&::placeholder": { color: color.inkFaint },
});

const FilterLabel = styled.span({
  fontSize: "12px",
  fontWeight: 600,
  color: color.inkMuted,
  whiteSpace: "nowrap",
});

const LogoThumb = styled.img({
  width: "28px",
  height: "28px",
  objectFit: "contain",
  borderRadius: radius.sm,
  border: `1px solid ${color.border}`,
  background: color.surfaceAlt,
  flexShrink: 0,
});

const LogoPlaceholder = styled.div({
  width: "28px",
  height: "28px",
  borderRadius: radius.sm,
  border: `1px dashed ${color.border}`,
  background: color.surfaceAlt,
  flexShrink: 0,
});

const ColorDot = styled.span<{ bg: string }>(({ bg }) => ({
  display: "inline-block",
  width: "12px",
  height: "12px",
  borderRadius: "50%",
  background: bg,
  border: `1px solid rgba(0,0,0,0.12)`,
  flexShrink: 0,
}));

const ColorDots = styled.div({
  display: "flex",
  gap: "4px",
  alignItems: "center",
});

const SubText = styled.span({
  fontSize: "12px",
  color: color.inkFaint,
});

const CompanyCell = styled.div({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

export default function CompaniesListPage() {
  const { data: companies = [], isLoading } = useCompanies();
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();

  const [editing, setEditing] = useState<CompanyRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [filterName, setFilterName] = useState("");

  const filteredCompanies = useMemo(() => {
    if (!filterName.trim()) return companies;
    return companies.filter((c) =>
      c.name.toLowerCase().includes(filterName.trim().toLowerCase())
    );
  }, [companies, filterName]);

  const columns: Column<CompanyRow>[] = [
    {
      key: "name",
      header: "건설사",
      render: (r) => (
        <CompanyCell>
          {r.logoUrl ? (
            <LogoThumb src={r.logoUrl} alt={`${r.name} 로고`} />
          ) : (
            <LogoPlaceholder />
          )}
          <div>
            <strong>{r.name}</strong>
            {r.colors && r.colors.length > 0 && (
              <ColorDots style={{ marginTop: "3px" }}>
                {r.colors.map((hex, i) => (
                  <ColorDot key={i} bg={hex} title={hex.toUpperCase()} />
                ))}
              </ColorDots>
            )}
          </div>
        </CompanyCell>
      ),
    },
    {
      key: "contactName",
      header: "담당자",
      render: (r) =>
        r.contactName ? (
          <span>{r.contactName}</span>
        ) : (
          <SubText>-</SubText>
        ),
    },
    {
      key: "contactPhone",
      header: "연락처",
      render: (r) =>
        r.contactPhone ? (
          <span>{r.contactPhone}</span>
        ) : (
          <SubText>-</SubText>
        ),
    },
    {
      key: "address",
      header: "주소",
      render: (r) =>
        r.address ? (
          <span style={{ fontSize: "12px" }}>{r.address}</span>
        ) : (
          <SubText>-</SubText>
        ),
    },
    { key: "active", header: "사용 여부", render: (r) => <ActivePill active={r.active} /> },
    { key: "updatedAt", header: "수정일", render: (r) => r.updatedAt },
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
              if (confirm(`${r.name}을(를) 삭제할까요?`)) deleteCompany.mutate(r.id);
            }}
          >
            삭제
          </Button>
        </div>
      ),
    },
  ];

  const handleCreate = (values: CompanyFormValues) => {
    createCompany.mutate(values, { onSuccess: () => setCreating(false) });
  };

  const handleUpdate = (values: CompanyFormValues) => {
    if (!editing) return;
    updateCompany.mutate({ id: editing.id, values }, { onSuccess: () => setEditing(null) });
  };

  return (
    <div>
      <PageHeader>
        <div>
          <PageTitle>건설사 관리</PageTitle>
          <PageDescription>현장을 발주하는 건설사와 담당자 정보를 관리합니다.</PageDescription>
        </div>
        <Button onClick={() => setCreating(true)}>+ 건설사 등록</Button>
      </PageHeader>

      <Toolbar>
        <Row gap="xs">
          <FilterLabel>건설사명</FilterLabel>
          <SearchInput
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            placeholder="건설사명 검색..."
          />
        </Row>
        {filterName && (
          <Button size="sm" variant="secondary" onClick={() => setFilterName("")}>
            초기화
          </Button>
        )}
      </Toolbar>

      <DataTable
        columns={columns}
        rows={filteredCompanies}
        rowKey={(r) => r.id}
        emptyMessage={
          isLoading
            ? "불러오는 중..."
            : filterName
            ? "검색 결과가 없습니다."
            : "등록된 건설사가 없습니다."
        }
      />

      {creating && (
        <CompanyFormModal
          onClose={() => setCreating(false)}
          onSubmit={handleCreate}
          submitting={createCompany.isPending}
        />
      )}
      {editing && (
        <CompanyFormModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={handleUpdate}
          submitting={updateCompany.isPending}
        />
      )}
    </div>
  );
}
