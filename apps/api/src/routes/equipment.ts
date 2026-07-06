import { Router } from "express";
import db, { genId } from "../db";

type Row = Record<string, unknown>;

const router = Router();

router.get("/", (_req, res) => {
  res.json(db.prepare("SELECT * FROM equipment").all());
});

router.post("/", (req, res) => {
  const id = genId("EQ");
  const b = req.body as Record<string, unknown>;
  db.prepare(
    "INSERT INTO equipment (id,name,code,category,equipmentType,manufacturer,model,note,ip,port,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
  ).run(
    id,
    b.name,
    b.code,
    (b.category as string) ?? "",
    (b.equipmentType as string) ?? null,
    (b.manufacturer as string) ?? "",
    (b.model as string) ?? "",
    (b.note as string) ?? "",
    (b.ip as string) ?? null,
    (b.port as string) ?? null,
    (b.status as string) ?? "입고"
  );
  res.status(201).json(db.prepare("SELECT * FROM equipment WHERE id = ?").get(id));
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM equipment WHERE id = ?").get(req.params.id) as Row | undefined;
  if (!existing) {
    res.status(404).json({ message: "Not Found" });
    return;
  }
  const b = req.body as Record<string, unknown>;
  const val = (key: string) => (key in b ? b[key] : existing[key]);
  db.prepare(
    "UPDATE equipment SET name=?,code=?,category=?,equipmentType=?,manufacturer=?,model=?,note=?,ip=?,port=?,status=? WHERE id=?"
  ).run(
    val("name"), val("code"), val("category"), val("equipmentType"),
    val("manufacturer"), val("model"), val("note"), val("ip"), val("port"), val("status"),
    req.params.id
  );
  res.json(db.prepare("SELECT * FROM equipment WHERE id = ?").get(req.params.id));
});

router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM equipment WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

export default router;
