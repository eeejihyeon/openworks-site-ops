import styled from "@emotion/styled";
import { Button, Modal, Row, Stack, color, radius, space } from "@facility/ui";
import { useState } from "react";

import {
  useCreateDepartment,
  useDeleteDepartment,
  useDepartments,
  useUpdateDepartment,
} from "./queries";

const DeptList = styled.ul({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: "2px",
});

const DeptItem = styled.li({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: `${space.sm} ${space.md}`,
  borderRadius: radius.md,
  border: `1px solid ${color.border}`,
  background: color.surface,
  gap: space.sm,
  "&:hover": {
    background: color.surfaceAlt,
  },
});

const DeptName = styled.span({
  fontSize: "14px",
  color: color.ink,
  fontWeight: 500,
  flex: 1,
});

const InlineInput = styled.input({
  flex: 1,
  padding: "6px 10px",
  fontSize: "13px",
  borderRadius: radius.md,
  border: `1px solid ${color.accent}`,
  outline: "none",
  boxShadow: `0 0 0 3px ${color.accentSoft}`,
  color: color.ink,
  background: color.surface,
});

const AddRow = styled.div({
  display: "flex",
  alignItems: "center",
  gap: space.sm,
  padding: `${space.sm} ${space.md}`,
  borderRadius: radius.md,
  border: `1px dashed ${color.border}`,
  background: color.surfaceAlt,
});

const EmptyHint = styled.p({
  textAlign: "center",
  color: color.inkFaint,
  fontSize: "13px",
  padding: `${space.xl} 0`,
  margin: 0,
});

const IconBtn = styled.button<{ variant?: "edit" | "danger" }>(({ variant = "edit" }) => ({
  border: "none",
  background: "transparent",
  cursor: "pointer",
  padding: "4px 6px",
  borderRadius: radius.sm,
  fontSize: "13px",
  color: variant === "danger" ? color.danger : color.inkMuted,
  display: "flex",
  alignItems: "center",
  "&:hover": {
    background: variant === "danger" ? color.dangerSoft : color.surfaceAlt,
    color: variant === "danger" ? color.danger : color.ink,
  },
}));

export interface DepartmentModalProps {
  onClose: () => void;
}

export function DepartmentModal({ onClose }: DepartmentModalProps) {
  const { data: departments = [], isLoading } = useDepartments();
  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const deleteDept = useDeleteDepartment();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const handleEditStart = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
    setIsAdding(false);
  };

  const handleEditSave = (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    const isDuplicate = departments.some((d) => d.name === trimmed && d.id !== id);
    if (isDuplicate) {
      alert("이미 존재하는 부서명입니다.");
      return;
    }
    updateDept.mutate({ id, name: trimmed }, { onSuccess: () => setEditingId(null) });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleAddStart = () => {
    setIsAdding(true);
    setNewName("");
    setEditingId(null);
  };

  const handleAddSave = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const isDuplicate = departments.some((d) => d.name === trimmed);
    if (isDuplicate) {
      alert("이미 존재하는 부서명입니다.");
      return;
    }
    createDept.mutate(trimmed, { onSuccess: () => { setIsAdding(false); setNewName(""); } });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`"${name}" 부서를 삭제할까요?\n소속 사용자의 부서 정보는 유지됩니다.`)) {
      deleteDept.mutate(id);
    }
  };

  return (
    <Modal title="부서 관리" onClose={onClose} width="440px">
      <Stack gap="md">
        {isLoading ? (
          <EmptyHint>불러오는 중...</EmptyHint>
        ) : departments.length === 0 && !isAdding ? (
          <EmptyHint>등록된 부서가 없습니다.</EmptyHint>
        ) : (
          <DeptList>
            {departments.map((dept) =>
              editingId === dept.id ? (
                <DeptItem key={dept.id}>
                  <InlineInput
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEditSave(dept.id);
                      if (e.key === "Escape") handleEditCancel();
                    }}
                    placeholder="부서명 입력"
                  />
                  <Row gap="xs">
                    <Button
                      size="sm"
                      onClick={() => handleEditSave(dept.id)}
                      disabled={updateDept.isPending}
                    >
                      저장
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleEditCancel}>
                      취소
                    </Button>
                  </Row>
                </DeptItem>
              ) : (
                <DeptItem key={dept.id}>
                  <DeptName>{dept.name}</DeptName>
                  <Row gap="xs">
                    <IconBtn
                      variant="edit"
                      title="수정"
                      onClick={() => handleEditStart(dept.id, dept.name)}
                    >
                      ✎
                    </IconBtn>
                    <IconBtn
                      variant="danger"
                      title="삭제"
                      onClick={() => handleDelete(dept.id, dept.name)}
                    >
                      ✕
                    </IconBtn>
                  </Row>
                </DeptItem>
              )
            )}
          </DeptList>
        )}

        {isAdding ? (
          <AddRow>
            <InlineInput
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddSave();
                if (e.key === "Escape") { setIsAdding(false); setNewName(""); }
              }}
              placeholder="새 부서명 입력"
            />
            <Row gap="xs">
              <Button size="sm" onClick={handleAddSave} disabled={createDept.isPending}>
                추가
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => { setIsAdding(false); setNewName(""); }}
              >
                취소
              </Button>
            </Row>
          </AddRow>
        ) : (
          <Button variant="secondary" onClick={handleAddStart}>
            + 부서 추가
          </Button>
        )}
      </Stack>
    </Modal>
  );
}
