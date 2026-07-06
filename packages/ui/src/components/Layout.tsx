import styled from "@emotion/styled";

import { color, radius, shadow, space } from "../theme";

export const Card = styled.div({
  background: color.surface,
  border: `1px solid ${color.border}`,
  borderRadius: radius.lg,
  padding: space.lg,
  boxShadow: shadow.sm,
});

export const PageHeader = styled.div({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  marginBottom: space.lg,
  gap: space.md,
});

export const PageTitle = styled.h1({
  fontSize: "20px",
  fontWeight: 700,
  color: color.ink,
  margin: 0,
});

export const PageDescription = styled.p({
  fontSize: "13px",
  color: color.inkMuted,
  margin: "4px 0 0",
});

export const Toolbar = styled.div({
  display: "flex",
  alignItems: "center",
  gap: space.sm,
  marginBottom: space.md,
  flexWrap: "wrap",
});

export const Stack = styled.div<{ gap?: keyof typeof space }>(({ gap = "md" }) => ({
  display: "flex",
  flexDirection: "column",
  gap: space[gap],
}));

export const Row = styled.div<{ gap?: keyof typeof space }>(({ gap = "md" }) => ({
  display: "flex",
  alignItems: "center",
  gap: space[gap],
}));

export const Grid2 = styled.div({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: space.md,
  "@media (max-width: 720px)": { gridTemplateColumns: "1fr" },
});

export const EmptyState = styled.div({
  padding: `${space.xxl} ${space.lg}`,
  textAlign: "center",
  color: color.inkFaint,
  border: `1px dashed ${color.border}`,
  borderRadius: radius.lg,
  fontSize: "13px",
});
