import { Router } from "express";
import db, { genId, todayStr } from "../db";

type Row = Record<string, unknown>;
type ShipmentStatus = "요청" | "출고준비" | "출고완료";

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

function getShipmentWithItems(id: string) {
  const shipment = db.prepare("SELECT * FROM shipments WHERE id = ?").get(id) as Row | undefined;
  if (!shipment) return undefined;

  const items = db
    .prepare("SELECT equipmentId FROM shipment_items WHERE shipmentId = ?")
    .all(id) as { equipmentId: string }[];

  const requestItems = db
    .prepare(
      "SELECT category, equipmentType, quantity FROM shipment_request_items WHERE shipmentId = ?"
    )
    .all(id) as { category: string; equipmentType: string; quantity: number }[];

  return {
    ...shipment,
    items: items.map((it) => ({ equipmentId: it.equipmentId })),
    requestItems,
  };
}

function markEquipmentStatus(ids: string[], status: "출고준비" | "출고완료") {
  const stmt = db.prepare("UPDATE equipment SET status = ? WHERE id = ?");
  for (const id of ids) stmt.run(status, id);
}

function revertStatus(ids: string[], excludeShipmentId: string) {
  for (const id of ids) {
    const inOther = db
      .prepare(
        `SELECT 1 FROM shipment_items si
         JOIN shipments s ON s.id = si.shipmentId
         WHERE si.equipmentId = ? AND s.id != ?`
      )
      .get(id, excludeShipmentId);
    if (!inOther) db.prepare("UPDATE equipment SET status = '입고' WHERE id = ?").run(id);
  }
}

/** 상태에 따라 날짜 필드 계산 (기존 값 보존, 첫 전환 시만 기록) */
function buildDates(
  status: ShipmentStatus,
  existing: { requestedAt?: string | null; preparedAt?: string | null; completedAt?: string | null } = {}
) {
  const today = todayStr();
  return {
    requestedAt: existing.requestedAt ?? today,
    preparedAt:
      status === "출고준비" || status === "출고완료"
        ? (existing.preparedAt ?? today)
        : (existing.preparedAt ?? null),
    completedAt:
      status === "출고완료" ? (existing.completedAt ?? today) : (existing.completedAt ?? null),
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────

router.get("/", (req, res) => {
  const { siteId } = req.query as { siteId?: string };
  const rows = (
    siteId
      ? db.prepare("SELECT * FROM shipments WHERE siteId = ?").all(siteId)
      : db.prepare("SELECT * FROM shipments").all()
  ) as Row[];

  const result = rows.map((s) => {
    const items = db
      .prepare("SELECT equipmentId FROM shipment_items WHERE shipmentId = ?")
      .all(s.id as string) as { equipmentId: string }[];
    const requestItems = db
      .prepare(
        "SELECT category, equipmentType, quantity FROM shipment_request_items WHERE shipmentId = ?"
      )
      .all(s.id as string) as { category: string; equipmentType: string; quantity: number }[];
    return {
      ...s,
      items: items.map((it) => ({ equipmentId: it.equipmentId })),
      requestItems,
    };
  });

  res.json(result);
});

router.post("/", (req, res) => {
  const id = genId("SH");
  const b = req.body as Record<string, unknown>;
  const status = ((b.status as string) || "요청") as ShipmentStatus;
  const items = (b.items ?? []) as { equipmentId: string }[];
  const requestItems = (b.requestItems ?? []) as {
    category: string;
    equipmentType: string;
    quantity: number;
  }[];

  const { c } = db.prepare("SELECT COUNT(*) as c FROM shipments").get() as { c: number };
  const shipmentNo = `OUT-${new Date().getFullYear()}-${String(c + 1).padStart(4, "0")}`;
  const dates = buildDates(status);

  db.transaction(() => {
    db.prepare(
      `INSERT INTO shipments
        (id, shipmentNo, siteId, shipmentDate, status, requestedAt, preparedAt, completedAt,
         requesterName, deliveryRequestedAt, shipperName, delivererName, note)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      id,
      shipmentNo,
      b.siteId,
      "",
      status,
      dates.requestedAt,
      dates.preparedAt,
      dates.completedAt,
      (b.requesterName as string) ?? "",
      (b.deliveryRequestedAt as string) ?? "",
      (b.shipperName as string) ?? "",
      (b.delivererName as string) ?? "",
      (b.note as string) ?? ""
    );

    const iItem = db.prepare(
      "INSERT INTO shipment_items (shipmentId, equipmentId) VALUES (?, ?)"
    );
    for (const item of items) iItem.run(id, item.equipmentId);

    const iReqItem = db.prepare(
      "INSERT INTO shipment_request_items (shipmentId, category, equipmentType, quantity) VALUES (?,?,?,?)"
    );
    for (const ri of requestItems) iReqItem.run(id, ri.category, ri.equipmentType, ri.quantity);

    const itemIds = items.map((it) => it.equipmentId);
    if (status === "출고완료") markEquipmentStatus(itemIds, "출고완료");
    else if (status === "출고준비") markEquipmentStatus(itemIds, "출고준비");
  })();

  res.status(201).json(getShipmentWithItems(id));
});

router.put("/:id", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM shipments WHERE id = ?")
    .get(req.params.id) as Row | undefined;
  if (!existing) {
    res.status(404).json({ message: "Not Found" });
    return;
  }

  const b = req.body as Record<string, unknown>;
  const status = ((b.status as string) || (existing.status as string) || "요청") as ShipmentStatus;
  const newItems = (b.items ?? []) as { equipmentId: string }[];
  const newRequestItems = (b.requestItems ?? []) as {
    category: string;
    equipmentType: string;
    quantity: number;
  }[];

  const oldItemIds = (
    db
      .prepare("SELECT equipmentId FROM shipment_items WHERE shipmentId = ?")
      .all(req.params.id) as { equipmentId: string }[]
  ).map((it) => it.equipmentId);

  const dates = buildDates(status, {
    requestedAt: existing.requestedAt as string | null,
    preparedAt: existing.preparedAt as string | null,
    completedAt: existing.completedAt as string | null,
  });

  db.transaction(() => {
    db.prepare(
      `UPDATE shipments
       SET siteId=?, status=?, requestedAt=?, preparedAt=?, completedAt=?,
           requesterName=?, deliveryRequestedAt=?, shipperName=?, delivererName=?, note=?
       WHERE id=?`
    ).run(
      b.siteId ?? existing.siteId,
      status,
      dates.requestedAt,
      dates.preparedAt,
      dates.completedAt,
      (b.requesterName as string) ?? existing.requesterName ?? "",
      (b.deliveryRequestedAt as string) ?? existing.deliveryRequestedAt ?? "",
      (b.shipperName as string) ?? existing.shipperName ?? "",
      (b.delivererName as string) ?? existing.delivererName ?? "",
      (b.note as string) ?? existing.note ?? "",
      req.params.id
    );

    // 실제 출고 장비 교체
    db.prepare("DELETE FROM shipment_items WHERE shipmentId = ?").run(req.params.id);
    const iItem = db.prepare(
      "INSERT INTO shipment_items (shipmentId, equipmentId) VALUES (?, ?)"
    );
    for (const item of newItems) iItem.run(req.params.id, item.equipmentId);

    // 요청 항목 교체
    db.prepare("DELETE FROM shipment_request_items WHERE shipmentId = ?").run(req.params.id);
    const iReqItem = db.prepare(
      "INSERT INTO shipment_request_items (shipmentId, category, equipmentType, quantity) VALUES (?,?,?,?)"
    );
    for (const ri of newRequestItems) iReqItem.run(req.params.id, ri.category, ri.equipmentType, ri.quantity);

    // 장비 상태 동기화
    const newIds = newItems.map((it) => it.equipmentId);
    if (status === "출고완료") markEquipmentStatus(newIds, "출고완료");
    else if (status === "출고준비") markEquipmentStatus(newIds, "출고준비");

    const removed = oldItemIds.filter((id) => !newIds.includes(id));
    revertStatus(removed, req.params.id);
  })();

  res.json(getShipmentWithItems(req.params.id));
});

router.delete("/:id", (req, res) => {
  const itemIds = (
    db
      .prepare("SELECT equipmentId FROM shipment_items WHERE shipmentId = ?")
      .all(req.params.id) as { equipmentId: string }[]
  ).map((it) => it.equipmentId);

  db.transaction(() => {
    db.prepare("DELETE FROM shipments WHERE id = ?").run(req.params.id);
    revertStatus(itemIds, req.params.id);
  })();

  res.json({ success: true });
});

export default router;
