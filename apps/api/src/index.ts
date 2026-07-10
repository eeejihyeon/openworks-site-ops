import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import express from "express";
import cors from "cors";

import { requireAuth } from "./middleware/auth";
import authRoutes from "./routes/auth";
import departmentsRoutes from "./routes/departments";
import usersRoutes from "./routes/users";
import companiesRoutes from "./routes/companies";
import equipmentCategoriesRoutes from "./routes/equipment-categories";
import equipmentRoutes from "./routes/equipment";
import shipmentsRoutes from "./routes/shipments";
import sitesRoutes from "./routes/sites";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const IS_PROD = process.env.NODE_ENV === "production";

app.use(cors());
app.use(express.json());

// ── Public ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);

// ── Protected (모든 /api/* 요청에 JWT 인증 적용) ────────────────────────────────
app.use("/api/departments", requireAuth, departmentsRoutes);
app.use("/api/users", requireAuth, usersRoutes);
app.use("/api/companies", requireAuth, companiesRoutes);
app.use("/api/equipment-categories", requireAuth, equipmentCategoriesRoutes);
app.use("/api/equipment", requireAuth, equipmentRoutes);
app.use("/api/shipments", requireAuth, shipmentsRoutes);
// /api/sites/:siteId/requirements 및 /api/sites/:siteId/system-info는 sitesRoutes 내부에서 처리
app.use("/api/sites", requireAuth, sitesRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ── Static (production: React 빌드 결과물 서빙) ────────────────────────────────
if (IS_PROD) {
  const WEB_DIST = path.join(process.cwd(), "apps", "web", "dist");
  if (fs.existsSync(WEB_DIST)) {
    app.use(express.static(WEB_DIST));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(WEB_DIST, "index.html"));
    });
  }
}

app.listen(PORT, () => {
  console.log(`API server → http://localhost:${PORT}`);
});
