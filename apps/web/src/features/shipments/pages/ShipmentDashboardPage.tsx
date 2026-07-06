import {
  Card,
  CodeTag,
  DataTable,
  MonoCell,
  PageDescription,
  PageHeader,
  PageTitle,
  Row,
  Stack,
  color,
  type Column,
} from "@facility/ui";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useEquipmentList } from "@/features/equipment/queries";
import { useSites } from "@/features/sites/queries";
import type { ShipmentRow } from "@/lib/mock/db";
import { useServerSentEvents } from "@/lib/sse";

import { useShipments } from "../queries";

// 화이트 → 포인트 블루 그라데이션에서 추출한 4단계 팔레트
const CHART_PALETTE = ["#BFDBFE", "#60A5FA", "#2563EB", "#1D4ED8"];

const CATEGORY_COLOR: Record<string, string> = {
  CCTV: CHART_PALETTE[2]!,
  가스센서: CHART_PALETTE[1]!,
  DID: CHART_PALETTE[3]!,
  방송장비: CHART_PALETTE[0]!,
};

export default function ShipmentDashboardPage() {
  const { data: shipments = [] } = useShipments();
  const { data: equipment = [] } = useEquipmentList();
  const { data: sites = [] } = useSites();
  const [liveTick, setLiveTick] = useState<string | null>(null);

  // 실서버 연동 시 /api/stream/shipments 를 그대로 구독한다.
  // 현재는 백엔드가 없으므로 mock 옵션으로 5초마다 "실시간 갱신" 데모 이벤트를 흘려보낸다.
  useServerSentEvents<{ at: string }>("/stream/shipments", (data) => setLiveTick(data.at), {
    mock: { intervalMs: 5000, generate: () => ({ at: new Date().toLocaleTimeString("ko-KR") }) },
  });

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const shipment of shipments) {
      for (const item of shipment.items) {
        const eq = equipment.find((e) => e.id === item.equipmentId);
        if (!eq) continue;
        totals.set(eq.category, (totals.get(eq.category) ?? 0) + 1);
      }
    }
    return Array.from(totals.entries()).map(([category, quantity]) => ({ category, quantity }));
  }, [shipments, equipment]);

  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? "-";

  const historyColumns: Column<ShipmentRow>[] = [
    { key: "shipmentNo", header: "출고번호", render: (r) => <CodeTag>{r.shipmentNo}</CodeTag> },
    { key: "site", header: "현장", render: (r) => siteName(r.siteId) },
    {
      key: "requestedAt",
      header: "요청일",
      render: (r) =>
        r.requestedAt ? <MonoCell>{r.requestedAt}</MonoCell> : <span>-</span>,
    },
    {
      key: "preparedAt",
      header: "준비일",
      render: (r) =>
        r.preparedAt ? <MonoCell>{r.preparedAt}</MonoCell> : <span>-</span>,
    },
    {
      key: "completedAt",
      header: "완료일",
      render: (r) =>
        r.completedAt ? <MonoCell>{r.completedAt}</MonoCell> : <span>-</span>,
    },
    {
      key: "shipperName",
      header: "출고 담당자",
      render: (r) => r.shipperName || <span style={{ color: color.inkFaint }}>-</span>,
    },
    {
      key: "delivererName",
      header: "납품 담당자",
      render: (r) => r.delivererName || <span style={{ color: color.inkFaint }}>-</span>,
    },
  ];

  return (
    <div>
      <PageHeader>
        <div>
          <PageTitle>출고 현황</PageTitle>
          <PageDescription>출고된 장비의 종류별 수량과 출고 이력을 확인합니다.</PageDescription>
        </div>
        <Row gap="xs">
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: color.accent,
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 12, color: color.inkMuted }}>
            실시간 연결됨{liveTick ? ` · 마지막 업데이트 ${liveTick}` : ""}
          </span>
        </Row>
      </PageHeader>

      <Stack gap="xl">
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
          <Card>
            <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>출고 장비 종류별 수량</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryTotals}>
                <CartesianGrid strokeDasharray="3 3" stroke={color.border} />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
                  {categoryTotals.map((entry) => (
                    <Cell
                      key={entry.category}
                      fill={CATEGORY_COLOR[entry.category] ?? CHART_PALETTE[2]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>분류 비중</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryTotals}
                  dataKey="quantity"
                  nameKey="category"
                  innerRadius={50}
                  outerRadius={85}
                >
                  {categoryTotals.map((entry) => (
                    <Cell
                      key={entry.category}
                      fill={CATEGORY_COLOR[entry.category] ?? CHART_PALETTE[2]}
                    />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div>
          <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>출고 이력</h3>
          <DataTable columns={historyColumns} rows={shipments} rowKey={(r) => r.id} />
          <p style={{ fontSize: 11, color: color.inkFaint, marginTop: 8 }}>
            상세 공급업체 자료는 사내 공유폴더(\\192.168.0.240\공급업체관리) 내 해당 현장 폴더를
            참고하세요.
          </p>
        </div>
      </Stack>
    </div>
  );
}
