import styled from "@emotion/styled";
import type { ReactNode } from "react";

import { color, radius, shadow, space } from "../theme";

const Overlay = styled.div({
  position: "fixed",
  inset: 0,
  background: "rgba(15, 27, 62, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
});

const Panel = styled.div<{ width?: string }>(({ width = "480px" }) => ({
  background: color.surface,
  borderRadius: radius.lg,
  boxShadow: shadow.lg,
  width,
  maxWidth: "90vw",
  maxHeight: "85vh",
  overflowY: "auto",
  padding: space.xl,
}));

const Header = styled.div({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: space.lg,
});

const Title = styled.h2({
  fontSize: "16px",
  fontWeight: 700,
  margin: 0,
});

const CloseBtn = styled.button({
  border: "none",
  background: "transparent",
  color: color.inkMuted,
  fontSize: "18px",
  cursor: "pointer",
  lineHeight: 1,
});

export interface ModalProps {
  title: string;
  onClose: () => void;
  width?: string;
  children: ReactNode;
}

export function Modal({ title, onClose, width, children }: ModalProps) {
  return (
    <Overlay
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Panel width={width}>
        <Header>
          <Title>{title}</Title>
          <CloseBtn aria-label="닫기" onClick={onClose}>
            ✕
          </CloseBtn>
        </Header>
        {children}
      </Panel>
    </Overlay>
  );
}
