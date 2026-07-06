import { Router } from "express";
import db from "../db";

type Row = Record<string, unknown>;

const router = Router({ mergeParams: true });

router.get("/", (req, res) => {
  const { siteId } = req.params;
  const row = db.prepare("SELECT * FROM system_infos WHERE siteId = ?").get(siteId) as Row | undefined;
  res.json(row ?? { siteId, operationInfo: "", developerType: "자체개발", developerName: "" });
});

router.put("/", (req, res) => {
  const { siteId } = req.params;
  const { operationInfo = "", developerType = "자체개발", developerName = "" } = req.body as Record<string, string>;
  const existing = db.prepare("SELECT 1 FROM system_infos WHERE siteId = ?").get(siteId);
  if (existing) {
    db.prepare(
      "UPDATE system_infos SET operationInfo=?,developerType=?,developerName=? WHERE siteId=?"
    ).run(operationInfo, developerType, developerName, siteId);
  } else {
    db.prepare(
      "INSERT INTO system_infos (siteId,operationInfo,developerType,developerName) VALUES (?,?,?,?)"
    ).run(siteId, operationInfo, developerType, developerName);
  }
  res.json({ siteId, operationInfo, developerType, developerName });
});

export default router;
