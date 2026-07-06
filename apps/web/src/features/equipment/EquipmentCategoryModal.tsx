import styled from "@emotion/styled";
import { Button, Modal, Row, Stack, color, radius, space } from "@facility/ui";
import { useState } from "react";

import {
  useCreateEquipmentCategory,
  useDeleteEquipmentCategory,
  useEquipmentCategories,
  useUpdateEquipmentCategory,
} from "./queries";

const CategoryList = styled.ul({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: "2px",
});

const CategoryItem = styled.li({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: `${space.sm} ${space.md}`,
  borderRadius: radius.md,
  border: `1px solid ${color.border}`,
  background: color.surface,
  gap: space.sm,
  "&:hover": { background: color.surfaceAlt },
});

const CategoryName = styled.span({
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

export interface EquipmentCategoryModalProps {
  onClose: () => void;
}

export function EquipmentCategoryModal({ onClose }: EquipmentCategoryModalProps) {
  const { data: categories = [], isLoading } = useEquipmentCategories();
  const createCategory = useCreateEquipmentCategory();
  const updateCategory = useUpdateEquipmentCategory();
  const deleteCategory = useDeleteEquipmentCategory();

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
    if (categories.some((c) => c.name === trimmed && c.id !== id)) {
      alert("이미 존재하는 분류명입니다.");
      return;
    }
    updateCategory.mutate({ id, name: trimmed }, { onSuccess: () => setEditingId(null) });
  };

  const handleAddSave = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.name === trimmed)) {
      alert("이미 존재하는 분류명입니다.");
      return;
    }
    createCategory.mutate(trimmed, {
      onSuccess: () => { setIsAdding(false); setNewName(""); },
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`"${name}" 분류를 삭제할까요?\n소속 장비의 분류 정보는 유지됩니다.`)) {
      deleteCategory.mutate(id);
    }
  };

  return (
    <Modal title="장비 종류 관리" onClose={onClose} width="440px">
      <Stack gap="md">
        {isLoading ? (
          <EmptyHint>불러오는 중...</EmptyHint>
        ) : categories.length === 0 && !isAdding ? (
          <EmptyHint>등록된 장비 종류가 없습니다.</EmptyHint>
        ) : (
          <CategoryList>
            {categories.map((cat) =>
              editingId === cat.id ? (
                <CategoryItem key={cat.id}>
                  <InlineInput
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEditSave(cat.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    placeholder="분류명 입력"
                  />
                  <Row gap="xs">
                    <Button size="sm" onClick={() => handleEditSave(cat.id)} disabled={updateCategory.isPending}>저장</Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>취소</Button>
                  </Row>
                </CategoryItem>
              ) : (
                <CategoryItem key={cat.id}>
                  <CategoryName>{cat.name}</CategoryName>
                  <Row gap="xs">
                    <IconBtn variant="edit" title="수정" onClick={() => handleEditStart(cat.id, cat.name)}>✎</IconBtn>
                    <IconBtn variant="danger" title="삭제" onClick={() => handleDelete(cat.id, cat.name)}>✕</IconBtn>
                  </Row>
                </CategoryItem>
              )
            )}
          </CategoryList>
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
              placeholder="새 분류명 입력"
            />
            <Row gap="xs">
              <Button size="sm" onClick={handleAddSave} disabled={createCategory.isPending}>추가</Button>
              <Button size="sm" variant="secondary" onClick={() => { setIsAdding(false); setNewName(""); }}>취소</Button>
            </Row>
          </AddRow>
        ) : (
          <Button variant="secondary" onClick={() => { setIsAdding(true); setNewName(""); setEditingId(null); }}>
            + 장비 종류 추가
          </Button>
        )}
      </Stack>
    </Modal>
  );
}
