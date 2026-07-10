import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";

import { http } from "../http";

import { db, genId, todayStr, type EquipmentRow } from "./db";

const LATENCY = 220;

function ok<T>(data: T, config: InternalAxiosRequestConfig, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: "OK",
    headers: {},
    config,
  } as AxiosResponse<T>;
}

function delay<T>(fn: () => T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(fn()), LATENCY));
}

type Handler = (
  match: RegExpMatchArray,
  config: Parameters<AxiosAdapter>[0]
) => unknown;

interface Route {
  method: string;
  pattern: RegExp;
  handler: Handler;
}

const routes: Route[] = [];

function register(method: string, pattern: RegExp, handler: Handler) {
  routes.push({ method, pattern, handler });
}

function body(config: Parameters<AxiosAdapter>[0]) {
  if (!config.data) return {};
  return typeof config.data === "string" ? JSON.parse(config.data) : config.data;
}

function query(config: Parameters<AxiosAdapter>[0]) {
  return config.params ?? {};
}

// ---------- 부서 관리 ----------
register("get", /^\/departments$/, () => db.departments);
register("post", /^\/departments$/, (_m, c) => {
  const row = { id: genId("DEPT"), ...body(c) };
  db.departments.push(row);
  return row;
});
register("put", /^\/departments\/([^/]+)$/, (m, c) => {
  const idx = db.departments.findIndex((d) => d.id === m[1]);
  if (idx === -1) throw { status: 404 };
  db.departments[idx] = { ...db.departments[idx], ...body(c) };
  return db.departments[idx];
});
register("delete", /^\/departments\/([^/]+)$/, (m) => {
  db.departments = db.departments.filter((d) => d.id !== m[1]);
  return { success: true };
});

// ---------- 사용자 관리 ----------
register("get", /^\/users$/, () => db.users);
register("post", /^\/users$/, (_m, c) => {
  const row = { id: genId("USR"), ...body(c) };
  db.users.unshift(row);
  return row;
});
register("put", /^\/users\/([^/]+)$/, (m, c) => {
  const idx = db.users.findIndex((u) => u.id === m[1]);
  if (idx === -1) throw { status: 404 };
  db.users[idx] = { ...db.users[idx], ...body(c) };
  return db.users[idx];
});
register("delete", /^\/users\/([^/]+)$/, (m) => {
  db.users = db.users.filter((u) => u.id !== m[1]);
  return { success: true };
});

// ---------- 건설사 관리 ----------
register("get", /^\/companies$/, () => db.companies);
register("post", /^\/companies$/, (_m, c) => {
  const now = todayStr();
  const row = { id: genId("CO"), createdAt: now, updatedAt: now, ...body(c) };
  db.companies.unshift(row);
  return row;
});
register("put", /^\/companies\/([^/]+)$/, (m, c) => {
  const idx = db.companies.findIndex((x) => x.id === m[1]);
  if (idx === -1) throw { status: 404 };
  db.companies[idx] = { ...db.companies[idx], ...body(c), updatedAt: todayStr() };
  return db.companies[idx];
});
register("delete", /^\/companies\/([^/]+)$/, (m) => {
  db.companies = db.companies.filter((x) => x.id !== m[1]);
  return { success: true };
});

// ---------- 현장 관리 ----------
register("get", /^\/sites$/, () => db.sites);
register("get", /^\/sites\/([^/]+)$/, (m) => {
  const row = db.sites.find((s) => s.id === m[1]);
  if (!row) throw { status: 404 };
  return row;
});
register("post", /^\/sites$/, (_m, c) => {
  const row = { id: genId("ST"), ...body(c) };
  db.sites.unshift(row);
  return row;
});
register("put", /^\/sites\/([^/]+)$/, (m, c) => {
  const idx = db.sites.findIndex((x) => x.id === m[1]);
  if (idx === -1) throw { status: 404 };
  db.sites[idx] = { ...db.sites[idx], ...body(c) };
  return db.sites[idx];
});
register("delete", /^\/sites\/([^/]+)$/, (m) => {
  db.sites = db.sites.filter((x) => x.id !== m[1]);
  return { success: true };
});

// ---------- 장비 분류 관리 ----------
register("get", /^\/equipment-categories$/, () => db.equipmentCategories);
register("post", /^\/equipment-categories$/, (_m, c) => {
  const row = { id: genId("ECAT"), ...body(c) };
  db.equipmentCategories.push(row);
  return row;
});
register("put", /^\/equipment-categories\/([^/]+)$/, (m, c) => {
  const idx = db.equipmentCategories.findIndex((d) => d.id === m[1]);
  if (idx === -1) throw { status: 404 };
  db.equipmentCategories[idx] = { ...db.equipmentCategories[idx], ...body(c) };
  return db.equipmentCategories[idx];
});
register("delete", /^\/equipment-categories\/([^/]+)$/, (m) => {
  db.equipmentCategories = db.equipmentCategories.filter((d) => d.id !== m[1]);
  return { success: true };
});

// ---------- 장비 마스터 ----------
register("get", /^\/equipment$/, () => db.equipment);
register("post", /^\/equipment$/, (_m, c) => {
  const row = { id: genId("EQ"), ...body(c) };
  db.equipment.unshift(row);
  return row;
});
register("put", /^\/equipment\/([^/]+)$/, (m, c) => {
  const idx = db.equipment.findIndex((x) => x.id === m[1]);
  if (idx === -1) throw { status: 404 };
  db.equipment[idx] = { ...db.equipment[idx], ...body(c) };
  return db.equipment[idx];
});
register("delete", /^\/equipment\/([^/]+)$/, (m) => {
  db.equipment = db.equipment.filter((x) => x.id !== m[1]);
  return { success: true };
});

// ---------- 출고 관리 ----------

type ShipmentStatus = "요청" | "출고준비" | "출고완료";

/** 특정 shipmentId를 제외한 모든 출고에서 equipmentId가 사용 중인지 확인 */
function isEquipmentInOtherShipment(equipmentId: string, excludeShipmentId?: string): boolean {
  return db.shipments.some(
    (s) => s.id !== excludeShipmentId && s.items.some((it) => it.equipmentId === equipmentId),
  );
}

/** 출고에 포함된 장비들을 지정 상태로 변경 */
function markEquipmentStatus(equipmentIds: string[], status: "출고준비" | "출고완료") {
  for (const eqId of equipmentIds) {
    const idx = db.equipment.findIndex((e) => e.id === eqId);
    if (idx !== -1) db.equipment[idx] = { ...db.equipment[idx], status } as EquipmentRow;
  }
}

/** 출고에서 제거된 장비들 중 다른 출고에도 없으면 "입고"로 되돌림 */
function revertEquipmentStatus(equipmentIds: string[], excludeShipmentId?: string) {
  for (const eqId of equipmentIds) {
    if (isEquipmentInOtherShipment(eqId, excludeShipmentId)) continue;
    const idx = db.equipment.findIndex((e) => e.id === eqId);
    if (idx !== -1) db.equipment[idx] = { ...db.equipment[idx], status: "입고" } as EquipmentRow;
  }
}

/** 상태에 따라 날짜 필드를 자동 설정 (첫 진입 시 기록) */
function buildStatusDates(
  status: ShipmentStatus,
  existing: { requestedAt?: string; preparedAt?: string; completedAt?: string } = {},
) {
  const today = todayStr();
  return {
    requestedAt: existing.requestedAt ?? today,
    preparedAt:
      status === "출고준비" || status === "출고완료"
        ? (existing.preparedAt ?? today)
        : existing.preparedAt,
    completedAt: status === "출고완료" ? (existing.completedAt ?? today) : existing.completedAt,
  };
}

register("get", /^\/shipments$/, (_m, c) => {
  const { siteId } = query(c);
  return siteId ? db.shipments.filter((s) => s.siteId === siteId) : db.shipments;
});
register("post", /^\/shipments$/, (_m, c) => {
  const payload = body(c);
  const status: ShipmentStatus = payload.status ?? "요청";
  const count = db.shipments.length + 1;
  const row = {
    id: genId("SH"),
    shipmentNo: `OUT-${new Date().getFullYear()}-${String(count).padStart(4, "0")}`,
    ...payload,
    ...buildStatusDates(status),
  };
  db.shipments.unshift(row);
  // 출고준비 → 장비 "출고준비", 출고완료 → 장비 "출고완료"
  const itemIds = (payload.items ?? []).map((it: { equipmentId: string }) => it.equipmentId);
  if (status === "출고완료") markEquipmentStatus(itemIds, "출고완료");
  else if (status === "출고준비") markEquipmentStatus(itemIds, "출고준비");
  return row;
});
register("put", /^\/shipments\/([^/]+)$/, (m, c) => {
  const idx = db.shipments.findIndex((x) => x.id === m[1]);
  if (idx === -1) throw { status: 404 };
  const existing = db.shipments[idx]!;
  const oldItems: string[] = (existing.items ?? []).map(
    (it: { equipmentId: string }) => it.equipmentId,
  );
  const payload = body(c);
  const status: ShipmentStatus = payload.status ?? existing.status ?? "요청";
  const newItems: string[] = (payload.items ?? []).map((it: { equipmentId: string }) => it.equipmentId);

  db.shipments[idx] = {
    ...existing,
    ...payload,
    ...buildStatusDates(status, existing),
  };

  // 장비 상태 동기화
  if (status === "출고완료") markEquipmentStatus(newItems, "출고완료");
  else if (status === "출고준비") markEquipmentStatus(newItems, "출고준비");

  // 이번 출고에서 빠진 장비 중 다른 출고에도 없으면 → "입고"로 복원
  const removed = oldItems.filter((id) => !newItems.includes(id));
  revertEquipmentStatus(removed, m[1]);

  return db.shipments[idx];
});
register("delete", /^\/shipments\/([^/]+)$/, (m) => {
  const target = db.shipments.find((x) => x.id === m[1]);
  db.shipments = db.shipments.filter((x) => x.id !== m[1]);
  if (target) {
    const removedIds = (target.items ?? []).map((it: { equipmentId: string }) => it.equipmentId);
    revertEquipmentStatus(removedIds, m[1]);
  }
  return { success: true };
});

// ---------- 시스템 요구사항 (현장별 요구사항 + 노선정보) ----------
register("get", /^\/sites\/([^/]+)\/requirements$/, (m) => {
  const found = db.siteRequirementDocs.find((d) => d.siteId === m[1]);
  return found ?? { siteId: m[1], requirements: [], routes: [] };
});
register("put", /^\/sites\/([^/]+)\/requirements$/, (m, c) => {
  const payload = body(c);
  const siteId = m[1] as string;
  const idx = db.siteRequirementDocs.findIndex((d) => d.siteId === siteId);
  const next = { siteId, requirements: payload.requirements, routes: payload.routes };
  if (idx === -1) db.siteRequirementDocs.push(next);
  else db.siteRequirementDocs[idx] = next;
  return next;
});

// ---------- 시스템 관리 (운영정보/개발사구분) ----------
register("get", /^\/sites\/([^/]+)\/system-info$/, (m) => {
  return (
    db.systemInfos.find((s) => s.siteId === m[1]) ?? {
      siteId: m[1],
      operationInfo: "",
      developerType: "자체개발",
      developerName: "",
    }
  );
});
register("put", /^\/sites\/([^/]+)\/system-info$/, (m, c) => {
  const payload = body(c);
  const siteId = m[1] as string;
  const idx = db.systemInfos.findIndex((s) => s.siteId === siteId);
  const next = { siteId, ...payload };
  if (idx === -1) db.systemInfos.push(next);
  else db.systemInfos[idx] = next;
  return next;
});

const mockAdapter: AxiosAdapter = async (config) => {
  const url = (config.url ?? "").replace(/^\/api/, "");
  const method = (config.method ?? "get").toLowerCase();

  for (const route of routes) {
    if (route.method !== method) continue;
    const match = url.match(route.pattern);
    if (match) {
      try {
        const data = await delay(() => route.handler(match, config));
        return ok(data, config);
      } catch (e) {
        const status = e && typeof e === "object" && "status" in e ? (e as { status: number }).status : 500;
        return Promise.reject({
          ...(e as object),
          response: ok({ message: "Not Found" }, config, status),
          config,
        });
      }
    }
  }

  return Promise.reject(new Error(`[mock] No route for ${method.toUpperCase()} ${url}`));
};

/**
 * 개발 초기 단계, 실제 백엔드가 없을 때 axios 요청을 인메모리 mock으로 처리한다.
 * 실서버 연동 시 이 함수 호출부(main.tsx)만 제거하면 axios가 실제 baseURL로 요청한다.
 */
export function registerMockAdapter() {
  http.defaults.adapter = mockAdapter;
}
