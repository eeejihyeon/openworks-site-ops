import { Router } from "express";
import db, { genId, normalizeCompany, todayStr } from "../db";

type Row = Record<string, unknown>;

const router = Router();

router.get("/", (_req, res) => {
  const rows = db.prepare("SELECT * FROM companies").all() as Row[];
  res.json(rows.map(normalizeCompany));
});

router.post("/", (req, res) => {
  const id = genId("CO");
  const now = todayStr();
  const b = req.body as Record<string, unknown>;
  db.prepare(
    "INSERT INTO companies (id,name,contactName,contactPhone,contactEmail,address,note,active,createdAt,updatedAt,logoUrl,colors) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)"
  ).run(
    id,
    b.name,
    (b.contactName as string) ?? null,
    (b.contactPhone as string) ?? null,
    (b.contactEmail as string) ?? null,
    (b.address as string) ?? null,
    (b.note as string) ?? "",
    b.active !== undefined ? (b.active ? 1 : 0) : 1,
    now,
    now,
    (b.logoUrl as string) ?? null,
    b.colors ? JSON.stringify(b.colors) : null
  );
  const row = db.prepare("SELECT * FROM companies WHERE id = ?").get(id) as Row;
  res.status(201).json(normalizeCompany(row));
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM companies WHERE id = ?").get(req.params.id) as Row | undefined;
  if (!existing) {
    res.status(404).json({ message: "Not Found" });
    return;
  }
  const b = req.body as Record<string, unknown>;
  const val = (key: string) => (key in b ? b[key] : existing[key]);
  db.prepare(
    "UPDATE companies SET name=?,contactName=?,contactPhone=?,contactEmail=?,address=?,note=?,active=?,updatedAt=?,logoUrl=?,colors=? WHERE id=?"
  ).run(
    val("name"),
    val("contactName"),
    val("contactPhone"),
    val("contactEmail"),
    val("address"),
    val("note"),
    "active" in b ? (b.active ? 1 : 0) : existing.active,
    todayStr(),
    val("logoUrl"),
    "colors" in b ? (b.colors ? JSON.stringify(b.colors) : null) : existing.colors,
    req.params.id
  );
  const row = db.prepare("SELECT * FROM companies WHERE id = ?").get(req.params.id) as Row;
  res.json(normalizeCompany(row));
});

router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM companies WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

export default router;
