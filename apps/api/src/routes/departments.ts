import { Router } from "express";
import db, { genId } from "../db";

type Row = Record<string, unknown>;

const router = Router();

router.get("/", (_req, res) => {
  res.json(db.prepare("SELECT * FROM departments").all());
});

router.post("/", (req, res) => {
  const id = genId("DEPT");
  const { name } = req.body as { name: string };
  db.prepare("INSERT INTO departments (id, name) VALUES (?, ?)").run(id, name);
  res.status(201).json({ id, name });
});

router.put("/:id", (req, res) => {
  const { name } = req.body as { name: string };
  const result = db.prepare("UPDATE departments SET name = ? WHERE id = ?").run(name, req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ message: "Not Found" });
    return;
  }
  res.json(db.prepare("SELECT * FROM departments WHERE id = ?").get(req.params.id));
});

router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM departments WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

export default router;
