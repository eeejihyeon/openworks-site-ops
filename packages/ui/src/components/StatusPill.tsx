import styled from "@emotion/styled";

import { color, font, radius, statusColor } from "../theme";

export type SiteStatus = keyof typeof statusColor;

const Pill = styled.span<{ fg: string; bg: string }>(({ fg, bg }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "3px 10px",
  borderRadius: radius.pill,
  fontSize: "12px",
  fontWeight: 600,
  color: fg,
  background: bg,
  whiteSpace: "nowrap",
}));

const Dot = styled.span<{ fg: string }>(({ fg }) => ({
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  background: fg,
  flexShrink: 0,
}));

export function StatusPill({ status }: { status: string }) {
  const colors = statusColor[status as SiteStatus] ?? { fg: "#6B82B8", bg: "#EEF3FF" };
  const { fg, bg } = colors;
  return (
    <Pill fg={fg} bg={bg}>
      <Dot fg={fg} />
      {status}
    </Pill>
  );
}

export function ActivePill({ active }: { active: boolean }) {
  return active ? (
    <Pill fg={color.accentHover} bg={color.accentSoft}>
      <Dot fg={color.accentHover} />
      사용
    </Pill>
  ) : (
    <Pill fg={color.inkFaint} bg={color.surfaceAlt}>
      <Dot fg={color.inkFaint} />
      미사용
    </Pill>
  );
}

/**
 * 장비코드 / 출고번호 등 식별자를 위한 라벨링 태그.
 * 실물 장비에 붙는 자산 스티커를 모티프로, 모노스페이스 + 브래킷으로 표기한다.
 */
export const CodeTag = styled.span({
  fontFamily: font.mono,
  fontSize: "12px",
  fontWeight: 500,
  color: color.primary,
  background: color.primarySoft,
  border: `1px solid ${color.borderStrong}`,
  borderRadius: radius.sm,
  padding: "2px 6px",
  letterSpacing: "0.02em",
});
