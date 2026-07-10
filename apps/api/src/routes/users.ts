import { Router } from "express";
import bcrypt from "bcryptjs";
import db, { genId, normalizeUser } from "../db";

type Row = Record<string, unknown>;

const router = Router();

function toNullableString(value: unknown): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function handleUserWriteError(res: import("express").Response, err: unknown): boolean {
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE"
  ) {
    res.status(409).json({ message: "이미 사용 중인 이메일입니다." });
    return true;
  }
  return false;
}

router.get("/", (_req, res) => {
  const rows = db.prepare("SELECT * FROM users").all() as Row[];
  res.json(rows.map(normalizeUser));
});

router.post("/", (req, res) => {
  const id = genId("USR");
  const b = req.body as Record<string, unknown>;
  const rawPw = (b.newPassword as string) || (b.password as string) || "password123";
  const password_hash = bcrypt.hashSync(rawPw, 10);

  try {
    db.prepare(
      "INSERT INTO users (id,name,department,role,active,phone,position,email,extension,password_hash) VALUES (?,?,?,?,?,?,?,?,?,?)"
    ).run(
      id,
      b.name,
      b.department,
      (b.role as string) ?? "일반",
      b.active !== undefined ? (b.active ? 1 : 0) : 1,
      toNullableString(b.phone),
      toNullableString(b.position),
      toNullableString(b.email),
      toNullableString(b.extension),
      password_hash
    );
  } catch (err) {
    if (handleUserWriteError(res, err)) return;
    throw err;
  }

  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as Row;
  res.status(201).json(normalizeUser(row));
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id) as Row | undefined;
  if (!existing) {
    res.status(404).json({ message: "Not Found" });
    return;
  }
  const b = req.body as Record<string, unknown>;
  const val = (key: string) => (key in b ? b[key] : existing[key]);
  const nullableVal = (key: string) =>
    key in b ? toNullableString(b[key]) : toNullableString(existing[key]);

  try {
    db.prepare(
      "UPDATE users SET name=?,department=?,role=?,active=?,phone=?,position=?,email=?,extension=? WHERE id=?"
    ).run(
      val("name"),
      val("department"),
      val("role"),
      "active" in b ? (b.active ? 1 : 0) : existing.active,
      nullableVal("phone"),
      nullableVal("position"),
      nullableVal("email"),
      nullableVal("extension"),
      req.params.id
    );
  } catch (err) {
    if (handleUserWriteError(res, err)) return;
    throw err;
  }

  // 비밀번호 변경 요청이 있을 경우 별도 업데이트
  const newPw = b.newPassword as string | undefined;
  if (newPw && newPw.trim().length >= 6) {
    const hash = bcrypt.hashSync(newPw, 10);
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, req.params.id);
  }
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id) as Row;
  res.json(normalizeUser(row));
});

router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

export default router;
