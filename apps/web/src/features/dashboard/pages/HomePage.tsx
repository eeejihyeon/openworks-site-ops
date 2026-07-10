import { Card, StatusPill, color } from "@facility/ui";
import { useMemo, useRef, useState } from "react";

import { useCompanies } from "@/features/companies/queries";
import { useEquipmentList } from "@/features/equipment/queries";
import { useShipments } from "@/features/shipments/queries";
import { useSites } from "@/features/sites/queries";

const BAR_COLORS = ["#2563EB", "#3B82F6", "#1D4ED8", "#60A5FA", "#1E40AF"];

export default function HomePage() {
  const { data: companies = [] } = useCompanies();
  const { data: sites = [] } = useSites();
  const { data: equipment = [] } = useEquipmentList();
  const { data: shipments = [] } = useShipments();

  // 최근 출고 목록 (completedAt 기준 최신 5건)
  const recentShipments = useMemo(() => {
    return [...shipments]
      .filter((s) => s.completedAt)
      .sort((a, b) => (a.completedAt! > b.completedAt! ? -1 : 1))
      .slice(0, 5);
  }, [shipments]);

  // 현장명 조회
  const getSiteName = (id: string) => sites.find((s) => s.id === id)?.name ?? "-";

  // 출고 항목별 장비 타입 요약 (5종 초과 시 '외 N건')
  const getEquipmentTypeSummary = (items: { equipmentId: string }[]): string => {
    const typeCount: Record<string, number> = {};
    for (const item of items) {
      const eq = equipment.find((e) => e.id === item.equipmentId);
      if (!eq) continue;
      const key = `${eq.category}${eq.equipmentType ? ` ${eq.equipmentType}` : ""}`;
      typeCount[key] = (typeCount[key] ?? 0) + 1;
    }
    const entries = Object.entries(typeCount);
    if (entries.length === 0) return "-";
    if (entries.length <= 5) {
      return entries.map(([type, count]) => `${type} ${count}대`).join(" · ");
    }
    const shown = entries.slice(0, 4);
    const restCount = entries.slice(4).reduce((sum, [, c]) => sum + c, 0);
    return shown.map(([type, count]) => `${type} ${count}대`).join(" · ") + ` · 외 ${restCount}건`;
  };

  // 건설사별 현장 리스트
  const companySiteList = useMemo(() => {
    return companies.map((company) => ({
      company,
      sites: sites
        .filter((s) => s.companyId === company.id)
        .sort((a, b) => (a.startDate > b.startDate ? -1 : 1)),
    }));
  }, [companies, sites]);

  // 계약완료 현장 (startDate 최신순)
  const contractedSites = useMemo(() => {
    return [...sites]
      .filter((s) => s.status === "계약완료")
      .sort((a, b) => (a.startDate > b.startDate ? -1 : 1));
  }, [sites]);

  // 현장별 납품 장비 카운트 (출고완료 상태 shipment의 items 합산)
  const siteEquipmentCounts = useMemo(() => {
    return contractedSites.map((site) => {
      const byEquipment = new Map<string, { label: string; count: number }>();
      let count = 0;

      for (const sh of shipments) {
        if (sh.siteId !== site.id || sh.status !== "출고완료") continue;
        for (const item of sh.items) {
          const eq = equipment.find((e) => e.id === item.equipmentId);
          if (!eq) continue;
          count += 1;
          const key = `${eq.category}__${eq.equipmentType ?? ""}`;
          const label = eq.equipmentType ? `${eq.category} ${eq.equipmentType}` : eq.category;
          const entry = byEquipment.get(key);
          if (entry) {
            entry.count += 1;
          } else {
            byEquipment.set(key, { label, count: 1 });
          }
        }
      }

      return {
        siteId: site.id,
        name: site.name,
        companyId: site.companyId,
        count,
        byEquipment: Array.from(byEquipment.values()).sort((a, b) => b.count - a.count),
      };
    });
  }, [contractedSites, shipments, equipment]);

  const maxEquipmentCount = useMemo(
    () => Math.max(...siteEquipmentCounts.map((s) => s.count), 1),
    [siteEquipmentCounts]
  );

  // 장비별 납품 현황 (출고완료 shipment 기준, 장비 카테고리+타입별 집계)
  const equipmentDeliveryStats = useMemo(() => {
    // key → { total, bySite: Map<siteId, count> }
    const map = new Map<
      string,
      { category: string; equipmentType: string; total: number; bySite: Map<string, number> }
    >();

    for (const sh of shipments) {
      if (sh.status !== "출고완료") continue;
      for (const item of sh.items) {
        const eq = equipment.find((e) => e.id === item.equipmentId);
        if (!eq) continue;
        const key = `${eq.category}__${eq.equipmentType ?? ""}`;
        if (!map.has(key)) {
          map.set(key, {
            category: eq.category,
            equipmentType: eq.equipmentType ?? "",
            total: 0,
            bySite: new Map(),
          });
        }
        const entry = map.get(key)!;
        entry.total += 1;
        entry.bySite.set(sh.siteId, (entry.bySite.get(sh.siteId) ?? 0) + 1);
      }
    }

    return Array.from(map.entries())
      .map(([key, { category, equipmentType, total, bySite }]) => ({
        key,
        label: equipmentType ? `${category} ${equipmentType}` : category,
        category,
        equipmentType,
        total,
        bySite: Array.from(bySite.entries())
          .map(([siteId, count]) => ({
            siteName: sites.find((s) => s.id === siteId)?.name ?? "-",
            count,
          }))
          .sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => b.total - a.total);
  }, [shipments, equipment, sites]);

  const maxDeliveryCount = useMemo(
    () => Math.max(...equipmentDeliveryStats.map((s) => s.total), 1),
    [equipmentDeliveryStats]
  );

  const [tooltipKey, setTooltipKey] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [siteTooltipKey, setSiteTooltipKey] = useState<string | null>(null);
  const [siteTooltipPos, setSiteTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  // 현장별 시스템 구축 현황 (계약완료 + systemActive=true, startDate 최신순)
  const systemSites = useMemo(() => {
    return [...sites]
      .filter((s) => s.status === "계약완료" && s.systemActive)
      .sort((a, b) => (a.startDate > b.startDate ? -1 : 1));
  }, [sites]);

  // 현장별 계약 예정 현황 (계약완료 아닌 현장, startDate 최신순)
  const pendingSites = useMemo(() => {
    return [...sites]
      .filter((s) => s.status !== "계약완료")
      .sort((a, b) => (a.startDate > b.startDate ? -1 : 1));
  }, [sites]);

  const getCompanyName = (companyId: string) =>
    companies.find((c) => c.id === companyId)?.name ?? "-";

  const buildDomainUrl = (domain?: string) => {
    if (!domain) return null;
    return domain.startsWith("http") ? domain : `https://${domain}`;
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: color.ink }}>대시보드</h1>
        <p style={{ fontSize: 13, color: color.inkMuted, margin: "4px 0 0" }}>종합 현황</p>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minHeight: 0 }}>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr", gap: 16, minHeight: 0 }}>
          {/* 건설사별 현장 리스트 */}
          <Card style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: color.ink, flexShrink: 0 }}>
              건설사별 현장 리스트
            </h3>
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
              {companySiteList.length === 0 ? (
                <p style={{ fontSize: 13, color: color.inkFaint, margin: 0 }}>데이터가 없습니다.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {companySiteList.map(({ company, sites: cSites }) => (
                    <div key={company.id}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: color.primary,
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 600, color: color.ink }}>
                          {company.name}
                        </span>
                        <span style={{ fontSize: 11, color: color.inkFaint }}>
                          {cSites.length}개 현장
                        </span>
                      </div>
                      {cSites.length === 0 ? (
                        <p
                          style={{
                            fontSize: 12,
                            color: color.inkFaint,
                            margin: "0 0 0 14px",
                          }}
                        >
                          등록된 현장이 없습니다.
                        </p>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            marginLeft: 14,
                          }}
                        >
                          {cSites.map((site) => (
                            <div
                              key={site.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                fontSize: 12,
                                padding: "6px 10px",
                                borderRadius: 6,
                                background: color.surfaceAlt,
                                gap: 8,
                              }}
                            >
                              <span
                                style={{
                                  color: color.ink,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {site.name}
                              </span>
                              <StatusPill status={site.status} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* 현장별 계약 예정 현황 */}
          <Card style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: color.ink, flexShrink: 0 }}>
              현장별 계약 예정 현황
            </h3>
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
              {pendingSites.length === 0 ? (
                <p style={{ fontSize: 13, color: color.inkFaint, margin: 0 }}>
                  계약 예정 현장이 없습니다.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {pendingSites.map((site) => (
                    <div
                      key={site.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: 13,
                        padding: "10px 12px",
                        borderRadius: 6,
                        border: `1px solid ${color.border}`,
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
                        <span style={{ fontWeight: 600, color: color.ink }}>{site.name}</span>
                        <span style={{ fontSize: 11, color: color.inkFaint }}>
                          {getCompanyName(site.companyId)} · {site.startDate}
                        </span>
                      </div>
                      <StatusPill status={site.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* 현장별 시스템 구축 현황 */}
          <Card style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: color.ink, flexShrink: 0 }}>
              현장별 시스템 구축 현황
            </h3>
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
              {systemSites.length === 0 ? (
                <p style={{ fontSize: 13, color: color.inkFaint, margin: 0 }}>
                  해당 현장이 없습니다.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {systemSites.map((site) => {
                    const domainUrl = buildDomainUrl(site.systemDomain);
                    return (
                      <div
                        key={site.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: 13,
                          padding: "10px 12px",
                          borderRadius: 6,
                          border: `1px solid ${color.border}`,
                          gap: 8,
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
                          <span style={{ fontWeight: 600, color: color.ink }}>{site.name}</span>
                          <span style={{ fontSize: 11, color: color.inkFaint }}>
                            {getCompanyName(site.companyId)} · {site.startDate}
                            {site.systemDomain && (
                              <span style={{ marginLeft: 4 }}>· {site.systemDomain}</span>
                            )}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          {site.systemStatus && <StatusPill status={site.systemStatus} />}
                          {domainUrl ? (
                            <a
                              href={domainUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                fontSize: 12,
                                color: color.primary,
                                textDecoration: "none",
                                padding: "3px 8px",
                                borderRadius: 4,
                                border: `1px solid ${color.primary}`,
                                fontWeight: 500,
                                transition: "background 0.15s",
                              }}
                            >
                              바로가기 ↗
                            </a>
                          ) : (
                            <span style={{ fontSize: 11, color: color.inkFaint }}>도메인 미설정</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr", gap: 16, minHeight: 0 }}>
          {/* 현장별 납품 장비 카운트 현황 */}
          <Card style={{ position: "relative", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: color.ink, flexShrink: 0 }}>
              현장별 납품 장비 카운트 현황
            </h3>
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
              {siteEquipmentCounts.length === 0 ? (
                <p style={{ fontSize: 13, color: color.inkFaint, margin: 0 }}>
                  계약 완료 현장이 없습니다.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {siteEquipmentCounts.map((item, idx) => {
                    const pct = maxEquipmentCount > 0 ? (item.count / maxEquipmentCount) * 100 : 0;
                    const barColor = BAR_COLORS[idx % BAR_COLORS.length]!;
                    const isHovered = siteTooltipKey === item.siteId;
                    return (
                      <div
                        key={item.siteId}
                        style={{ display: "flex", alignItems: "center", gap: 12, cursor: "default" }}
                        onMouseEnter={(e) => {
                          setSiteTooltipKey(item.siteId);
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setSiteTooltipPos({ x: e.clientX, y: rect.bottom + 6 });
                        }}
                        onMouseMove={(e) => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setSiteTooltipPos({ x: e.clientX, y: rect.bottom + 6 });
                        }}
                        onMouseLeave={() => setSiteTooltipKey(null)}
                      >
                        <div
                          style={{
                            width: 180,
                            flexShrink: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: isHovered ? 700 : 600,
                              color: isHovered ? barColor : color.ink,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              transition: "color 0.15s",
                            }}
                            title={item.name}
                          >
                            {item.name}
                          </span>
                          <span style={{ fontSize: 11, color: color.inkFaint }}>
                            {getCompanyName(item.companyId)}
                          </span>
                        </div>
                        <div
                          style={{
                            flex: 1,
                            height: 10,
                            background: color.surfaceAlt,
                            borderRadius: 5,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              background: isHovered ? barColor : barColor + "CC",
                              borderRadius: 5,
                              transition: "background 0.15s, width 0.4s ease",
                              minWidth: item.count > 0 ? 4 : 0,
                            }}
                          />
                        </div>
                        <span
                          style={{
                            width: 36,
                            textAlign: "right",
                            fontSize: 13,
                            fontWeight: 600,
                            color: isHovered ? barColor : item.count > 0 ? barColor : color.inkFaint,
                            flexShrink: 0,
                            transition: "color 0.15s",
                          }}
                        >
                          {item.count}대
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {siteTooltipKey &&
              (() => {
                const hovered = siteEquipmentCounts.find((s) => s.siteId === siteTooltipKey);
                if (!hovered || hovered.byEquipment.length === 0) return null;
                return (
                  <div
                    style={{
                      position: "fixed",
                      left: siteTooltipPos.x,
                      top: siteTooltipPos.y,
                      zIndex: 100,
                      background: color.ink,
                      color: "#fff",
                      borderRadius: 8,
                      padding: "10px 14px",
                      fontSize: 12,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                      pointerEvents: "none",
                      minWidth: 160,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>
                      {hovered.name}
                    </div>
                    {hovered.byEquipment.map(({ label, count }) => (
                      <div
                        key={label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 16,
                          padding: "3px 0",
                          borderBottom: "1px solid rgba(255,255,255,0.12)",
                        }}
                      >
                        <span
                          style={{
                            color: "rgba(255,255,255,0.75)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 140,
                          }}
                        >
                          {label}
                        </span>
                        <span style={{ fontWeight: 600, flexShrink: 0 }}>{count}대</span>
                      </div>
                    ))}
                    <div
                      style={{
                        marginTop: 8,
                        paddingTop: 6,
                        display: "flex",
                        justifyContent: "space-between",
                        fontWeight: 700,
                      }}
                    >
                      <span>합계</span>
                      <span>{hovered.count}대</span>
                    </div>
                  </div>
                );
              })()}
          </Card>
          {/* 장비별 납품 현황 */}
          <Card style={{ position: "relative", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: color.ink, flexShrink: 0 }}>
              장비별 납품 현황
            </h3>
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            {equipmentDeliveryStats.length === 0 ? (
              <p style={{ fontSize: 13, color: color.inkFaint, margin: 0 }}>
                출고 완료 데이터가 없습니다.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {equipmentDeliveryStats.map((item, idx) => {
                  const pct = (item.total / maxDeliveryCount) * 100;
                  const barColor = BAR_COLORS[idx % BAR_COLORS.length]!;
                  const isHovered = tooltipKey === item.key;
                  return (
                    <div
                      key={item.key}
                      style={{ display: "flex", alignItems: "center", gap: 12, cursor: "default" }}
                      onMouseEnter={(e) => {
                        setTooltipKey(item.key);
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setTooltipPos({ x: e.clientX, y: rect.bottom + 6 });
                      }}
                      onMouseMove={(e) => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setTooltipPos({ x: e.clientX, y: rect.bottom + 6 });
                      }}
                      onMouseLeave={() => setTooltipKey(null)}
                    >
                      <span
                        style={{
                          width: 140,
                          flexShrink: 0,
                          fontSize: 12,
                          fontWeight: isHovered ? 700 : 600,
                          color: isHovered ? barColor : color.ink,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          transition: "color 0.15s",
                        }}
                        title={item.label}
                      >
                        {item.label}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: 10,
                          background: color.surfaceAlt,
                          borderRadius: 5,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: isHovered ? barColor : barColor + "CC",
                            borderRadius: 5,
                            transition: "background 0.15s, width 0.4s ease",
                            minWidth: item.total > 0 ? 4 : 0,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          width: 36,
                          textAlign: "right",
                          fontSize: 13,
                          fontWeight: 600,
                          color: isHovered ? barColor : color.inkFaint,
                          flexShrink: 0,
                          transition: "color 0.15s",
                        }}
                      >
                        {item.total}대
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
            {/* 툴팁 */}
            {tooltipKey &&
              (() => {
                const hovered = equipmentDeliveryStats.find((s) => s.key === tooltipKey);
                if (!hovered) return null;
                return (
                  <div
                    ref={tooltipRef}
                    style={{
                      position: "fixed",
                      left: tooltipPos.x,
                      top: tooltipPos.y,
                      zIndex: 100,
                      background: color.ink,
                      color: "#fff",
                      borderRadius: 8,
                      padding: "10px 14px",
                      fontSize: 12,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                      pointerEvents: "none",
                      minWidth: 160,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>
                      {hovered.label}
                    </div>
                    {hovered.bySite.map(({ siteName, count }) => (
                      <div
                        key={siteName}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 16,
                          padding: "3px 0",
                          borderBottom: "1px solid rgba(255,255,255,0.12)",
                        }}
                      >
                        <span
                          style={{
                            color: "rgba(255,255,255,0.75)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 140,
                          }}
                        >
                          {siteName}
                        </span>
                        <span style={{ fontWeight: 600, flexShrink: 0 }}>{count}대</span>
                      </div>
                    ))}
                    <div
                      style={{
                        marginTop: 8,
                        paddingTop: 6,
                        display: "flex",
                        justifyContent: "space-between",
                        fontWeight: 700,
                      }}
                    >
                      <span>합계</span>
                      <span>{hovered.total}대</span>
                    </div>
                  </div>
                );
              })()}
          </Card>
          {/* 최근 출고 */}
          <Card style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: color.ink, flexShrink: 0 }}>
              최근 출고
            </h3>
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
              {recentShipments.length === 0 ? (
                <p style={{ fontSize: 13, color: color.inkFaint, margin: 0 }}>
                  출고 완료된 이력이 없습니다.
                </p>
              ) : (
                recentShipments.map((r, idx) => (
                  <div
                    key={r.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      fontSize: 13,
                      borderBottom:
                        idx < recentShipments.length - 1 ? `1px solid ${color.border}` : "none",
                      padding: "10px 0",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
                      <span style={{ fontWeight: 600, color: color.ink }}>
                        {getSiteName(r.siteId)}
                      </span>
                      <span style={{ fontSize: 11, color: color.inkFaint, lineHeight: 1.5 }}>
                        {getEquipmentTypeSummary(r.items)}
                      </span>
                    </div>
                    <span style={{ color: color.inkFaint, whiteSpace: "nowrap", fontSize: 12 }}>
                      {r.completedAt}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
