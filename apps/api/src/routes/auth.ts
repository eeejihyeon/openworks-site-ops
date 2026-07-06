import { Router } from "express";
import bcrypt from "bcryptjs";
import db, { normalizeUser } from "../db";
import { requireAuth, signToken } from "../middleware/auth";

type Row = Record<string, unknown>;

const router = Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ message: "이메일과 비밀번호를 입력하세요." });
    return;
  }
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as Row | undefined;
  if (!user || !bcrypt.compareSync(password, user.password_hash as string)) {
    res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    return;
  }
  const token = signToken({
    id: user.id as string,
    name: user.name as string,
    role: user.role as string,
  });
  res.json({ token, user: normalizeUser(user) });
});

router.get("/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user!.id) as Row | undefined;
  if (!user) {
    res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    return;
  }
  res.json(normalizeUser(user));
});

export default router;
