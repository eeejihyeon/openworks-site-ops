import styled from "@emotion/styled";
import type { ReactNode } from "react";

import { color, font, radius, space } from "../theme";

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

export const Td = styled.td({
  padding: "10px 14px",
  color: color.ink,
  verticalAlign: "middle",
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
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "데이터가 없습니다.",
  onRowClick,
}: DataTableProps<T>) {
  return (
    <TableWrap>
      <StyledTable>
        <Thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ width: c.width, textAlign: c.align ?? "left" }}>
                {c.header}
              </th>
            ))}
          </tr>
        </Thead>
        <tbody>
          {rows.map((row) => (
            <Tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              style={{ cursor: onRowClick ? "pointer" : "default" }}
            >
              {columns.map((c) => (
                <Td key={c.key} style={{ textAlign: c.align ?? "left" }}>
                  {c.render(row)}
                </Td>
              ))}
            </Tr>
          ))}
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
