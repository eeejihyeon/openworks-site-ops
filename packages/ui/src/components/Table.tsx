import styled from "@emotion/styled";
import { Fragment, type ReactNode } from "react";

import { color, font, radius, space } from "../theme";

/** 테이블 헤더(surfaceAlt)·페이지 배경(bg)과 구분되는 선택 행 배경 */
export const tableSelectedRowBg = "#F8FAFF";
export const tableSelectedRowHoverBg = "#F3F7FF";

export const TableWrap = styled.div({
  border: `1px solid ${color.border}`,
  borderRadius: radius.lg,
  background: color.surface,
  overflow: "hidden",
});

export const StyledTable = styled.table({
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px",
});

export const Thead = styled.thead({
  background: color.surfaceAlt,
  "th": {
    textAlign: "left",
    padding: "10px 14px",
    fontSize: "12px",
    fontWeight: 600,
    color: color.inkMuted,
    borderBottom: `1px solid ${color.border}`,
    whiteSpace: "nowrap",
  },
});

export const Tr = styled.tr({
  "&:not(:last-of-type) td": {
    borderBottom: `1px solid ${color.border}`,
  },
  "&:hover td": {
    background: color.bg,
  },
});

export const ClickableTr = styled(Tr)<{ $selected?: boolean }>(({ $selected }) => ({
  cursor: "pointer",
  userSelect: "none",
  "& td": {
    background: $selected ? tableSelectedRowBg : undefined,
  },
  "&:hover td": {
    background: $selected ? tableSelectedRowHoverBg : color.bg,
  },
}));

export const Td = styled.td({
  padding: "10px 14px",
  color: color.ink,
  verticalAlign: "middle",
});

export const TableChevron = styled.span<{ $open: boolean }>(({ $open }) => ({
  display: "inline-block",
  fontSize: "10px",
  color: color.inkFaint,
  transition: "transform 180ms ease",
  transform: $open ? "rotate(90deg)" : "rotate(0deg)",
}));

export const ExpandedTd = styled.td({
  background: color.surface,
  borderBottom: `1px solid ${color.border}`,
  borderLeft: `3px solid ${color.primary}`,
  padding: `${space.lg} ${space.xl}`,
});

export const ExpandedInner = styled.div({
  display: "flex",
  flexDirection: "column",
  gap: space.md,
});

export const ExpandedSection = styled.div({
  display: "flex",
  flexWrap: "wrap",
  gap: `${space.xs} ${space.xl}`,
  alignItems: "baseline",
});

export const InfoItem = styled.div({
  display: "flex",
  alignItems: "baseline",
  gap: space.sm,
  minWidth: 0,
});

export const InfoLabel = styled.span({
  fontSize: "11px",
  fontWeight: 600,
  color: color.inkFaint,
  letterSpacing: "0.03em",
  whiteSpace: "nowrap",
  flexShrink: 0,
});

export const InfoValue = styled.span({
  fontSize: "13px",
  color: color.inkMuted,
  fontFamily: font.mono,
});

export const SectionDivider = styled.div({
  borderTop: `1px solid ${color.border}`,
});

export const EmptyRow = styled.div({
  padding: `${space.xxl} ${space.lg}`,
  textAlign: "center",
  color: color.inkFaint,
  fontSize: "13px",
});

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: "left" | "right" | "center";
  render: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  expandedRowKey?: string | null;
  renderExpandedRow?: (row: T) => ReactNode;
  expandable?: boolean;
  canExpandRow?: (row: T) => boolean;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "데이터가 없습니다.",
  onRowClick,
  expandedRowKey,
  renderExpandedRow,
  expandable = false,
  canExpandRow,
}: DataTableProps<T>) {
  const isExpandable = Boolean(onRowClick || renderExpandedRow);
  const RowComponent = isExpandable ? ClickableTr : Tr;
  const colSpan = columns.length + (expandable ? 1 : 0);

  return (
    <TableWrap>
      <StyledTable>
        <Thead>
          <tr>
            {expandable && <th style={{ width: "16px" }} />}
            {columns.map((c) => (
              <th key={c.key} style={{ width: c.width, textAlign: c.align ?? "left" }}>
                {c.header}
              </th>
            ))}
          </tr>
        </Thead>
        <tbody>
          {rows.map((row) => {
            const key = rowKey(row);
            const isExpanded = expandedRowKey === key;
            const rowExpandable = expandable && (canExpandRow ? canExpandRow(row) : true);

            return (
              <Fragment key={key}>
                <RowComponent
                  $selected={isExpanded}
                  onClick={() => onRowClick?.(row)}
                  style={{ cursor: isExpandable ? "pointer" : "default" }}
                >
                  {expandable && (
                    <Td style={{ width: "16px", paddingRight: 0 }}>
                      {rowExpandable ? <TableChevron $open={isExpanded}>▶</TableChevron> : null}
                    </Td>
                  )}
                  {columns.map((c) => (
                    <Td key={c.key} style={{ textAlign: c.align ?? "left" }}>
                      {c.render(row)}
                    </Td>
                  ))}
                </RowComponent>
                {isExpanded && renderExpandedRow && (
                  <tr>
                    <ExpandedTd colSpan={colSpan}>{renderExpandedRow(row)}</ExpandedTd>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </StyledTable>
      {rows.length === 0 && <EmptyRow>{emptyMessage}</EmptyRow>}
    </TableWrap>
  );
}

export const MonoCell = styled.span({
  fontFamily: font.mono,
  fontSize: "12px",
  color: color.inkMuted,
});
