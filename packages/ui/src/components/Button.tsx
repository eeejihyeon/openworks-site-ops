import styled from "@emotion/styled";
import type { ButtonHTMLAttributes } from "react";

import { color, radius, space } from "../theme";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyle: Record<Variant, { bg: string; fg: string; border: string; hover: string }> = {
  primary: {
    bg: color.primary,
    fg: "#FFFFFF",
    border: color.primary,
    hover: color.primaryHover,
  },
  secondary: {
    bg: color.surface,
    fg: color.ink,
    border: color.border,
    hover: color.surfaceAlt,
  },
  ghost: {
    bg: "transparent",
    fg: color.inkMuted,
    border: "transparent",
    hover: color.surfaceAlt,
  },
  danger: {
    bg: color.dangerSoft,
    fg: color.danger,
    border: color.dangerSoft,
    hover: "#FECACA",
  },
};

export const Button = styled.button<ButtonProps>(({ variant = "primary", size = "md" }) => {
  const v = variantStyle[variant];
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
    fontWeight: 600,
    fontSize: size === "sm" ? "12px" : "13px",
    padding: size === "sm" ? "6px 10px" : "9px 16px",
    borderRadius: radius.md,
    border: `1px solid ${v.border}`,
    background: v.bg,
    color: v.fg,
    cursor: "pointer",
    transition: "background 120ms ease, border-color 120ms ease",
    "&:hover:not(:disabled)": {
      background: v.hover,
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  };
});
