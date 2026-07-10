import { Router, Request } from "express";
import db, { genId } from "../db";

type Row = Record<string, unknown>;
type SiteParams = { siteId: string };

const router = Router({ mergeParams: true });

router.get("/", (req: Request<SiteParams>, res) => {
  const { siteId } = req.params;
  const requirements = db.prepare("SELECT * FROM site_requirements WHERE siteId = ?").all(siteId);
  const routes = db.prepare("SELECT * FROM site_routes WHERE siteId = ?").all(siteId);
  res.json({ siteId, requirements, routes });
});

router.put("/", (req: Request<SiteParams>, res) => {
  const { siteId } = req.params;
  const { requirements = [], routes = [] } = req.body as { requirements: Row[]; routes: Row[] };

  db.transaction(() => {
    db.prepare("DELETE FROM site_requirements WHERE siteId = ?").run(siteId);
    db.prepare("DELETE FROM site_routes WHERE siteId = ?").run(siteId);

    const iReq = db.prepare(
      "INSERT INTO site_requirements (id, siteId, title, detail) VALUES (?, ?, ?, ?)"
    );
    for (const r of requirements) {
      iReq.run((r.id as string) ?? genId("REQ"), siteId, r.title ?? "", r.detail ?? "");
    }

    const iRoute = db.prepare(
      "INSERT INTO site_routes (id, siteId, routeName, location, equipmentCategory, note) VALUES (?, ?, ?, ?, ?, ?)"
    );
    for (const r of routes) {
      iRoute.run(
        (r.id as string) ?? genId("RT"),
        siteId,
        r.routeName ?? "",
        r.location ?? "",
        r.equipmentCategory ?? "",
        r.note ?? ""
      );
    }
  })();

  const saved = {
    siteId,
    requirements: db.prepare("SELECT * FROM site_requirements WHERE siteId = ?").all(siteId),
    routes: db.prepare("SELECT * FROM site_routes WHERE siteId = ?").all(siteId),
  };
  res.json(saved);
});

export default router;
