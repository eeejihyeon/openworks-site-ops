import { Card, StatusPill, color, type SiteStatus } from "@facility/ui";
import { useMemo } from "react";
import { ResponsiveGridLayout, useContainerWidth } from "react-grid-layout";

import "react-grid-layout/css/styles.css";

import { useCompanies } from "@/features/companies/queries";
import { useEquipmentList } from "@/features/equipment/queries";
import { useShipments } from "@/features/shipments/queries";
import { useSites } from "@/features/sites/queries";
import { useUsers } from "@/features/users/queries";

const KPI_LAYOUT = [
  { i: "kpi-users", x: 0, y: 0, w: 3, h: 2 },
  { i: "kpi-companies", x: 3, y: 0, w: 3, h: 2 },
  { i: "kpi-sites", x: 6, y: 0, w: 3, h: 2 },
  { i: "kpi-equipment", x: 9, y: 0, w: 3, h: 2 },
  { i: "site-status", x: 0, y: 2, w: 6, h: 5 },
  { i: "recent-shipments", x: 6, y: 2, w: 6, h: 5 },
];

function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card style={{ height: "100%" }}>
      <div style={{ fontSize: 12, color: color.inkFaint }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6, color: color.ink }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: color.inkFaint, marginTop: 4 }}>{hint}</div>}
    </Card>
  );
}

export default function HomePage() {
  const { data: users = [] } = useUsers();
  const { data: companies = [] } = useCompanies();
  const { data: sites = [] } = useSites();
  const { data: equipment = [] } = useEquipmentList();
  const { data: shipments = [] } = useShipments();

  const activeSites = sites.filter((s) => s.systemActive);

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<string, number>> = {};
    for (const s of sites) counts[s.status] = (counts[s.status] ?? 0) + 1;
    return counts;
  }, [sites]);

  const recent = [...shipments]
    .sort((a, b) => (a.shipmentDate < b.shipmentDate ? 1 : -1))
    .slice(0, 5);
  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? "-";

  const { width, containerRef } = useContainerWidth();

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>대시보드</h1>
        <p style={{ fontSize: 13, color: color.inkMuted, margin: "4px 0 0" }}>종합 현황</p>
      </div>

      <div ref={containerRef}>
        <ResponsiveGridLayout
          className="layout"
          width={width}
          layouts={{ lg: KPI_LAYOUT }}
          breakpoints={{ lg: 1024, md: 768, sm: 480 }}
          cols={{ lg: 12, md: 8, sm: 4 }}
          rowHeight={44}
          margin={[16, 16] as const}
          dragConfig={{ cancel: ".no-drag" }}
        >
          <div key="kpi-users">
            <KpiCard
              label="사용자"
              value={users.length}
              hint={`사용중 ${users.filter((u) => u.active).length}명`}
            />
          </div>
          <div key="kpi-companies">
            <KpiCard label="건설사" value={companies.length} />
          </div>
          <div key="kpi-sites">
            <KpiCard
              label="진행중 현장"
              value={activeSites.length}
              hint={`전체 ${sites.length}건`}
            />
          </div>
          <div key="kpi-equipment">
            <KpiCard label="장비 마스터" value={equipment.length} hint="등록 품목" />
          </div>

          <div key="site-status">
            <Card style={{ height: "100%", overflow: "auto" }} className="no-drag">
              <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>현장 상태 분포</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(Object.keys(statusCounts) as SiteStatus[])
                  .filter((k) => statusCounts[k]! > 0)
                  .map((status) => (
                    <div key={status} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 90 }}>
                        <StatusPill status={status} />
                      </div>
                      <div
                        style={{
                          flex: 1,
                          background: color.surfaceAlt,
                          borderRadius: 4,
                          height: 8,
                        }}
                      >
                        <div
                          style={{
                            width: `${sites.length ? ((statusCounts[status] ?? 0) / sites.length) * 100 : 0}%`,
                            background: color.primary,
                            height: 8,
                            borderRadius: 4,
                          }}
                        />
                      </div>
                      <div style={{ width: 24, textAlign: "right", fontSize: 12 }}>
                        {statusCounts[status] ?? 0}
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>

          <div key="recent-shipments">
            <Card style={{ height: "100%", overflow: "auto" }} className="no-drag">
              <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>최근 출고</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recent.length === 0 && (
                  <p style={{ fontSize: 13, color: color.inkFaint }}>출고 이력이 없습니다.</p>
                )}
                {recent.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      borderBottom: `1px solid ${color.border}`,
                      paddingBottom: 8,
                    }}
                  >
                    <span>{siteName(r.siteId)}</span>
                    <span style={{ color: color.inkFaint }}>{r.shipmentDate}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}
