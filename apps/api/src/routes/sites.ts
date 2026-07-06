import { Router } from "express";
import db, { genId, normalizeSite } from "../db";
import requirementsRouter from "./requirements";
import systemRouter from "./system";

type Row = Record<string, unknown>;
type ManagerEntry = { name: string; phone?: string };

const router = Router();

// Nested sub-routers (mergeParams: true inside each)
router.use("/:siteId/requirements", requirementsRouter);
router.use("/:siteId/system-info", systemRouter);

router.get("/", (_req, res) => {
  const rows = db.prepare("SELECT * FROM sites").all() as Row[];
  res.json(rows.map(normalizeSite));
});

router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM sites WHERE id = ?").get(req.params.id) as Row | undefined;
  if (!row) {
    res.status(404).json({ message: "Not Found" });
    return;
  }
  res.json(normalizeSite(row));
});

router.post("/", (req, res) => {
  const id = genId("ST");
  const b = req.body as Record<string, unknown>;
  const siteManagers = b.siteManagers as ManagerEntry[] | undefined;
  const salesManagers = b.salesManagers as ManagerEntry[] | undefined;

  db.prepare(
    "INSERT INTO sites (id,name,companyId,address,startDate,endDateExpected,status,siteManagers,salesManagers,note,systemActive,systemStatus,systemDomain,systemServerIp,systemDeveloper) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
  ).run(
    id,
    b.name,
    b.companyId,
    (b.address as string) ?? "",
    (b.startDate as string) ?? "",
    (b.endDateExpected as string) ?? "",
    (b.status as string) ?? "계약전",
    siteManagers ? JSON.stringify(siteManagers) : null,
    salesManagers ? JSON.stringify(salesManagers) : null,
    (b.note as string) ?? "",
    b.systemActive ? 1 : 0,
    (b.systemStatus as string) ?? null,
    (b.systemDomain as string) ?? null,
    (b.systemServerIp as string) ?? null,
    (b.systemDeveloper as string) ?? null
  );
  const row = db.prepare("SELECT * FROM sites WHERE id = ?").get(id) as Row;
  res.status(201).json(normalizeSite(row));
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM sites WHERE id = ?").get(req.params.id) as Row | undefined;
  if (!existing) {
    res.status(404).json({ message: "Not Found" });
    return;
  }
  const b = req.body as Record<string, unknown>;

  const siteManagersRaw = "siteManagers" in b
    ? JSON.stringify(b.siteManagers as ManagerEntry[])
    : existing.siteManagers;

  const salesManagersRaw = "salesManagers" in b
    ? JSON.stringify(b.salesManagers as ManagerEntry[])
    : existing.salesManagers;

  const val = (key: string) => (key in b ? b[key] : existing[key]);

  db.prepare(
    "UPDATE sites SET name=?,companyId=?,address=?,startDate=?,endDateExpected=?,status=?,siteManagers=?,salesManagers=?,note=?,systemActive=?,systemStatus=?,systemDomain=?,systemServerIp=?,systemDeveloper=? WHERE id=?"
  ).run(
    val("name"),
    val("companyId"),
    val("address"),
    val("startDate"),
    val("endDateExpected"),
    val("status"),
    siteManagersRaw,
    salesManagersRaw,
    val("note"),
    "systemActive" in b ? (b.systemActive ? 1 : 0) : existing.systemActive,
    val("systemStatus"),
    val("systemDomain"),
    val("systemServerIp"),
    val("systemDeveloper"),
    req.params.id
  );
  const row = db.prepare("SELECT * FROM sites WHERE id = ?").get(req.params.id) as Row;
  res.json(normalizeSite(row));
});

router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM sites WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

export default router;
