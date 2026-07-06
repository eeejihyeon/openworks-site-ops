/**
 * Facility 자체 디자인 시스템 토큰
 *
 * 컨셉: 화이트 베이스 + 어썸 블루 포인트 컬러의 톤온톤 디자인.
 * 깨끗한 화이트 서피스 위에 블루 계열 팔레트를 단계적으로 쌓아,
 * 장비 자산관리 도구에 어울리는 신뢰감 있고 세련된 인터페이스를 구성한다.
 */

export const color = {
  bg: "#F0F5FF",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF3FF",
  border: "#D0DEFF",
  borderStrong: "#A3BEFF",

  ink: "#0F1B3E",
  inkMuted: "#3B5088",
  inkFaint: "#6B82B8",

  primary: "#1D4ED8",
  primaryHover: "#1E40AF",
  primarySoft: "#DBEAFE",

  accent: "#3B82F6",
  accentHover: "#2563EB",
  accentSoft: "#EFF6FF",

  warning: "#F59E0B",
  warningSoft: "#FEF3C7",

  danger: "#EF4444",
  dangerSoft: "#FEE2E2",

  success: "#10B981",
  successSoft: "#D1FAE5",
} as const;

// 현장 상태 / 시스템 상태 / 사용여부 등 도메인 상태값 → 색상 매핑
export const statusColor = {
  입찰대기: { fg: "#6D28D9", bg: "#EDE9FE" },
  계약전: { fg: "#6B82B8", bg: "#EEF3FF" },
  계약완료: { fg: "#047857", bg: "#D1FAE5" },
  구축중: { fg: "#B45309", bg: color.warningSoft },
  운영중: { fg: color.primaryHover, bg: color.primarySoft },
  종료: { fg: "#94A3B8", bg: "#F1F5F9" },
} as const;

export const font = {
  sans: '"Pretendard", "Apple SD Gothic Neo", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"IBM Plex Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

export const space = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  xxl: "32px",
} as const;

export const radius = {
  sm: "4px",
  md: "6px",
  lg: "10px",
  pill: "999px",
} as const;

export const shadow = {
  sm: "0 1px 2px rgba(15, 27, 62, 0.05)",
  md: "0 4px 12px rgba(15, 27, 62, 0.08)",
  lg: "0 12px 32px rgba(15, 27, 62, 0.12)",
} as const;

export const theme = {
  color,
  statusColor,
  font,
  space,
  radius,
  shadow,
} as const;

export type Theme = typeof theme;
