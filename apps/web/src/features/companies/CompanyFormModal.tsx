import styled from "@emotion/styled";
import {
  Button,
  CheckboxRow,
  FormField,
  Grid2,
  Input,
  Modal,
  Row,
  Stack,
  Textarea,
  color,
  radius,
  space,
} from "@facility/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { type ChangeEvent, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import type { CompanyRow } from "@/lib/mock/db";

import { companyDefaultValues, companySchema } from "./schema";
import type { CompanyFormValues } from "./schema";

const SectionLabel = styled.div({
  fontSize: "12px",
  fontWeight: 600,
  color: color.inkMuted,
  marginBottom: "6px",
});

const LogoArea = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: space.sm,
});

const LogoUploadBox = styled.button<{ hasImage: boolean }>(({ hasImage }) => ({
  width: "88px",
  height: "88px",
  border: `2px dashed ${hasImage ? color.accent : color.border}`,
  borderRadius: radius.lg,
  cursor: "pointer",
  background: hasImage ? "transparent" : color.surfaceAlt,
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  transition: "border-color 150ms ease, background 150ms ease",
  "&:hover": {
    borderColor: color.accent,
    background: hasImage ? "transparent" : color.accentSoft,
  },
}));

const LogoImg = styled.img({
  width: "100%",
  height: "100%",
  objectFit: "contain",
  padding: "6px",
});

const LogoPlaceholder = styled.span({
  fontSize: "11px",
  color: color.inkFaint,
  textAlign: "center",
  lineHeight: 1.5,
  userSelect: "none",
});

const RemoveLinkBtn = styled.button({
  border: "none",
  background: "transparent",
  color: color.danger,
  fontSize: "12px",
  cursor: "pointer",
  padding: 0,
  textDecoration: "underline",
  "&:hover": { opacity: 0.7 },
});

const ColorList = styled.div({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
});

const ColorRow = styled.div({
  display: "flex",
  alignItems: "center",
  gap: space.sm,
  padding: "6px 10px",
  border: `1px solid ${color.border}`,
  borderRadius: radius.md,
  background: color.surface,
});

const NativeColorInput = styled.input({
  width: "32px",
  height: "32px",
  padding: "2px",
  border: `1px solid ${color.border}`,
  borderRadius: radius.sm,
  cursor: "pointer",
  background: "transparent",
});

const ColorHexText = styled.span({
  fontSize: "13px",
  fontFamily: "monospace",
  color: color.inkMuted,
  flex: 1,
});

const RemoveColorBtn = styled.button({
  border: "none",
  background: "transparent",
  color: color.inkFaint,
  cursor: "pointer",
  fontSize: "14px",
  lineHeight: 1,
  padding: "2px 4px",
  borderRadius: radius.sm,
  "&:hover": { color: color.danger, background: color.dangerSoft },
});

const ContactSection = styled.div({
  display: "flex",
  flexDirection: "column",
  gap: space.md,
  padding: `${space.md} ${space.lg}`,
  background: color.surfaceAlt,
  borderRadius: radius.lg,
  border: `1px solid ${color.border}`,
});

export interface CompanyFormModalProps {
  initial?: CompanyRow;
  onClose: () => void;
  onSubmit: (values: CompanyFormValues) => void;
  submitting?: boolean;
}

export function CompanyFormModal({
  initial,
  onClose,
  onSubmit,
  submitting,
}: CompanyFormModalProps) {
  const hasExistingContact = !!(
    initial?.contactName ||
    initial?.contactPhone ||
    initial?.contactEmail
  );
  const [showContact, setShowContact] = useState(hasExistingContact);

  const logoInputRef = useRef<HTMLInputElement>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: initial
      ? {
          name: initial.name,
          contactName: initial.contactName ?? "",
          contactPhone: initial.contactPhone ?? "",
          contactEmail: initial.contactEmail ?? "",
          address: initial.address ?? "",
          note: initial.note ?? "",
          active: initial.active,
          logoUrl: initial.logoUrl ?? "",
          colors: initial.colors ?? [],
        }
      : companyDefaultValues,
  });

  const logoUrl = watch("logoUrl");
  const colors = watch("colors") ?? [];

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("이미지 파일은 2MB 이하만 등록할 수 있습니다.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setValue("logoUrl", reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const addColor = () => {
    if (colors.length < 3) setValue("colors", [...colors, "#3B82F6"]);
  };

  const updateColor = (idx: number, val: string) => {
    const next = [...colors];
    next[idx] = val;
    setValue("colors", next);
  };

  const removeColor = (idx: number) => {
    setValue("colors", colors.filter((_, i) => i !== idx));
  };

  const handleFormSubmit = (values: CompanyFormValues) => {
    if (!showContact) {
      onSubmit({ ...values, contactName: "", contactPhone: "", contactEmail: "" });
    } else {
      onSubmit(values);
    }
  };

  return (
    <Modal title={initial ? "건설사 수정" : "건설사 등록"} onClose={onClose} width="580px">
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Stack gap="lg">
          {/* 건설사명 */}
          <FormField label="건설사명" required error={errors.name?.message}>
            <Input {...register("name")} placeholder="예: 한빛건설" />
          </FormField>

          {/* 로고 + 브랜드 색상 */}
          <Row gap="lg" style={{ alignItems: "flex-start" }}>
            {/* 로고 */}
            <LogoArea>
              <SectionLabel>로고 이미지</SectionLabel>
              <LogoUploadBox
                type="button"
                hasImage={!!logoUrl}
                onClick={() => logoInputRef.current?.click()}
                title="클릭하여 이미지 업로드"
              >
                {logoUrl ? (
                  <LogoImg src={logoUrl} alt="로고 미리보기" />
                ) : (
                  <LogoPlaceholder>
                    +<br />이미지<br />업로드
                  </LogoPlaceholder>
                )}
              </LogoUploadBox>
              {logoUrl && (
                <RemoveLinkBtn type="button" onClick={() => setValue("logoUrl", "")}>
                  이미지 제거
                </RemoveLinkBtn>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleLogoChange}
              />
            </LogoArea>

            {/* 브랜드 색상 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <SectionLabel>
                브랜드 색상&nbsp;
                <span style={{ fontWeight: 400, color: color.inkFaint }}>최대 3개</span>
              </SectionLabel>
              <ColorList>
                {colors.map((hex, idx) => (
                  <ColorRow key={idx}>
                    <NativeColorInput
                      type="color"
                      value={hex}
                      onChange={(e) => updateColor(idx, e.target.value)}
                      title="색상 선택"
                    />
                    <ColorHexText>{hex.toUpperCase()}</ColorHexText>
                    <RemoveColorBtn
                      type="button"
                      title="색상 제거"
                      onClick={() => removeColor(idx)}
                    >
                      ✕
                    </RemoveColorBtn>
                  </ColorRow>
                ))}
                {colors.length < 3 && (
                  <Button type="button" size="sm" variant="secondary" onClick={addColor}>
                    + 색상 추가
                  </Button>
                )}
              </ColorList>
            </div>
          </Row>

          {/* 주소 */}
          <FormField label="주소" error={errors.address?.message}>
            <Input {...register("address")} placeholder="예: 서울특별시 강남구..." />
          </FormField>

          {/* 담당자 정보 토글 */}
          <CheckboxRow>
            <input
              type="checkbox"
              checked={showContact}
              onChange={(e) => setShowContact(e.target.checked)}
            />
            담당자 정보 추가
          </CheckboxRow>

          {showContact && (
            <ContactSection>
              <Grid2>
                <FormField label="담당자명" error={errors.contactName?.message}>
                  <Input {...register("contactName")} placeholder="예: 홍길동" />
                </FormField>
                <FormField label="담당자 연락처" error={errors.contactPhone?.message}>
                  <Input {...register("contactPhone")} placeholder="010-0000-0000" />
                </FormField>
              </Grid2>
              <FormField label="담당자 이메일" error={errors.contactEmail?.message}>
                <Input
                  {...register("contactEmail")}
                  type="email"
                  placeholder="name@company.co.kr"
                />
              </FormField>
            </ContactSection>
          )}

          {/* 비고 */}
          <FormField label="비고">
            <Textarea {...register("note")} />
          </FormField>

          {/* 사용 여부 */}
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <CheckboxRow>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
                사용 여부 (체크 시 사용중)
              </CheckboxRow>
            )}
          />

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
