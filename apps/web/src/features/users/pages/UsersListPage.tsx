import styled from "@emotion/styled";
import {
  ActivePill,
  Button,
  DataTable,
  PageDescription,
  PageHeader,
  PageTitle,
  Row,
  Select,
  Toolbar,
  color,
  radius,
  space,
  type Column,
} from "@facility/ui";
import { useMemo, useState } from "react";

import type { UserRow } from "@/lib/mock/db";
import { useAuthStore } from "@/store/authStore";

import { DepartmentModal } from "../DepartmentModal";
import {
  useCreateUser,
  useDeleteUser,
  useDepartments,
  useUpdateUser,
  useUsers,
} from "../queries";
import type { UserFormValues } from "../schema";
import { UserFormModal } from "../UserFormModal";

const SearchInput = styled.input({
  padding: "7px 12px",
  fontSize: "13px",
  borderRadius: radius.md,
  border: `1px solid ${color.border}`,
  background: color.surface,
  color: color.ink,
  outline: "none",
  minWidth: "180px",
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

const FilterSelect = styled(Select)({
  minWidth: "120px",
  padding: "7px 28px 7px 10px",
});

const SubText = styled.span({
  fontSize: "12px",
  color: color.inkFaint,
});

export default function UsersListPage() {
  const { data: users = [], isLoading } = useUsers();
  const { data: departments = [] } = useDepartments();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin());

  const [editing, setEditing] = useState<UserRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);

  const [filterDept, setFilterDept] = useState<string>("");
  const [filterName, setFilterName] = useState<string>("");

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchDept = filterDept === "" || u.department === filterDept;
      const matchName = filterName === "" || u.name.includes(filterName);
      return matchDept && matchName;
    });
  }, [users, filterDept, filterName]);

  const columns: Column<UserRow>[] = [
    { key: "name", header: "이름", render: (r) => <strong>{r.name}</strong> },
    {
      key: "position",
      header: "직급",
      render: (r) => r.position ? <span>{r.position}</span> : <SubText>-</SubText>,
    },
    { key: "department", header: "부서", render: (r) => r.department },
    { key: "role", header: "권한", render: (r) => r.role },
    {
      key: "phone",
      header: "연락처",
      render: (r) => r.phone ? <span>{r.phone}</span> : <SubText>-</SubText>,
    },
    {
      key: "extension",
      header: "내선",
      render: (r) => r.extension ? <span>{r.extension}</span> : <SubText>-</SubText>,
    },
    { key: "active", header: "사용 여부", render: (r) => <ActivePill active={r.active} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => {
        const canEdit = isAdmin || r.id === currentUser?.id;
        const canDelete = isAdmin && r.id !== currentUser?.id;
        return (
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setEditing(r)}
              disabled={!canEdit}
              title={!canEdit ? "본인 계정만 수정할 수 있습니다" : undefined}
            >
              수정
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (confirm(`${r.name} 사용자를 삭제할까요?`)) deleteUser.mutate(r.id);
              }}
              disabled={!canDelete}
              title={
                !canDelete
                  ? r.id === currentUser?.id
                    ? "자신의 계정은 삭제할 수 없습니다"
                    : "관리자만 삭제할 수 있습니다"
                  : undefined
              }
            >
              삭제
            </Button>
          </div>
        );
      },
    },
  ];

  const handleCreate = (values: UserFormValues) => {
    createUser.mutate(values, { onSuccess: () => setCreating(false) });
  };

  const handleUpdate = (values: UserFormValues) => {
    if (!editing) return;
    updateUser.mutate({ id: editing.id, values }, { onSuccess: () => setEditing(null) });
  };

  return (
    <div>
      <PageHeader>
        <div>
          <PageTitle>사용자 관리</PageTitle>
          <PageDescription>부서/권한별 시스템 사용자를 관리합니다.</PageDescription>
        </div>
        <Row gap="sm">
          {isAdmin && (
            <Button variant="secondary" onClick={() => setShowDeptModal(true)}>
              부서 관리
            </Button>
          )}
          <Button onClick={() => setCreating(true)}>+ 사용자 등록</Button>
        </Row>
      </PageHeader>

      <Toolbar>
        <Row gap="xs">
          <FilterLabel>부서</FilterLabel>
          <FilterSelect value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
            <option value="">전체</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </FilterSelect>
        </Row>
        <Row gap="xs">
          <FilterLabel>이름</FilterLabel>
          <SearchInput
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            placeholder="이름 검색..."
          />
        </Row>
        {(filterDept || filterName) && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => { setFilterDept(""); setFilterName(""); }}
          >
            필터 초기화
          </Button>
        )}
      </Toolbar>

      <DataTable
        columns={columns}
        rows={filteredUsers}
        rowKey={(r) => r.id}
        emptyMessage={
          isLoading
            ? "불러오는 중..."
            : filterDept || filterName
            ? "검색 결과가 없습니다."
            : "등록된 사용자가 없습니다."
        }
      />

      {creating && (
        <UserFormModal
          onClose={() => setCreating(false)}
          onSubmit={handleCreate}
          submitting={createUser.isPending}
        />
      )}
      {editing && (
        <UserFormModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={handleUpdate}
          submitting={updateUser.isPending}
        />
      )}
      {showDeptModal && (
        <DepartmentModal onClose={() => setShowDeptModal(false)} />
      )}
    </div>
  );
}
