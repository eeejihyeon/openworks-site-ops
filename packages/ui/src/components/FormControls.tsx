import styled from "@emotion/styled";

import { color, radius, space } from "../theme";

const controlBase = {
  width: "100%",
  padding: "8px 10px",
  fontSize: "13px",
  borderRadius: radius.md,
  border: `1px solid ${color.border}`,
  background: color.surface,
  color: color.ink,
  outline: "none",
  transition: "border-color 120ms ease, box-shadow 120ms ease",
};

const focusStyle = {
  "&:focus": {
    borderColor: color.accent,
    boxShadow: `0 0 0 3px ${color.accentSoft}`,
  },
};

export const Input = styled.input({
  ...controlBase,
  ...focusStyle,
  "&::placeholder": { color: color.inkFaint },
  "&:disabled": { background: color.surfaceAlt, color: color.inkFaint },
});

export const Textarea = styled.textarea({
  ...controlBase,
  ...focusStyle,
  minHeight: "72px",
  resize: "vertical",
  fontFamily: "inherit",
});

export const Select = styled.select({
  ...controlBase,
  ...focusStyle,
  appearance: "none",
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6'><path d='M0 0l5 6 5-6z' fill='%235B6B80'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  paddingRight: "28px",
});

export const CheckboxRow = styled.label({
  display: "inline-flex",
  alignItems: "center",
  gap: space.sm,
  fontSize: "13px",
  color: color.ink,
  cursor: "pointer",
});

export const FieldGroup = styled.div({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
});

export const Label = styled.label({
  fontSize: "12px",
  fontWeight: 600,
  color: color.inkMuted,
});

export const ErrorText = styled.span({
  fontSize: "11px",
  color: color.danger,
});
