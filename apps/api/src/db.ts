import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import bcrypt from "bcryptjs";
import Database from "better-sqlite3";

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), "data", "facility.db");

try {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
} catch (err) {
  console.error(`Failed to create DB directory (${path.dirname(DB_PATH)}):`, err);
  throw err;
}

let db: Database.Database;
try {
  db = new Database(DB_PATH);
  console.log(`SQLite connected: ${DB_PATH}`);
} catch (err) {
  console.error(`Failed to open SQLite database (${DB_PATH}):`, err);
  throw err;
}
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS departments (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    department    TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT '일반',
    active        INTEGER NOT NULL DEFAULT 1,
    phone         TEXT,
    position      TEXT,
    email         TEXT UNIQUE,
    extension     TEXT,
    password_hash TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS companies (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    contactName  TEXT,
    contactPhone TEXT,
    contactEmail TEXT,
    address      TEXT,
    note         TEXT NOT NULL DEFAULT '',
    active       INTEGER NOT NULL DEFAULT 1,
    createdAt    TEXT NOT NULL,
    updatedAt    TEXT NOT NULL,
    logoUrl      TEXT,
    colors       TEXT
  );

  CREATE TABLE IF NOT EXISTS sites (
    id               TEXT PRIMARY KEY,
    name             TEXT NOT NULL,
    companyId        TEXT NOT NULL,
    address          TEXT NOT NULL DEFAULT '',
    startDate        TEXT NOT NULL DEFAULT '',
    endDateExpected  TEXT NOT NULL DEFAULT '',
    status           TEXT NOT NULL DEFAULT '계약전',
    siteManager      TEXT NOT NULL DEFAULT '',
    siteManagerPhone TEXT,
    salesManager     TEXT NOT NULL DEFAULT '',
    salesManagerPhone TEXT,
    siteManagers     TEXT,
    salesManagers    TEXT,
    note             TEXT NOT NULL DEFAULT '',
    systemActive     INTEGER NOT NULL DEFAULT 0,
    systemStatus     TEXT,
    systemDomain     TEXT,
    systemServerIp   TEXT,
    systemDeveloper  TEXT
  );

  CREATE TABLE IF NOT EXISTS equipment_categories (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS equipment (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    code          TEXT NOT NULL,
    category      TEXT NOT NULL DEFAULT '',
    equipmentType TEXT,
    manufacturer  TEXT NOT NULL DEFAULT '',
    model         TEXT NOT NULL DEFAULT '',
    note          TEXT NOT NULL DEFAULT '',
    ip            TEXT,
    port          TEXT,
    status        TEXT NOT NULL DEFAULT '입고'
  );

  CREATE TABLE IF NOT EXISTS shipments (
    id                  TEXT PRIMARY KEY,
    shipmentNo          TEXT NOT NULL,
    siteId              TEXT NOT NULL,
    shipmentDate        TEXT NOT NULL DEFAULT '',
    status              TEXT NOT NULL DEFAULT '요청',
    requestedAt         TEXT,
    preparedAt          TEXT,
    completedAt         TEXT,
    requesterName       TEXT NOT NULL DEFAULT '',
    deliveryRequestedAt TEXT,
    shipperName         TEXT NOT NULL DEFAULT '',
    delivererName       TEXT NOT NULL DEFAULT '',
    note                TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS shipment_items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    shipmentId      TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    equipmentId     TEXT NOT NULL,
    installLocation TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS shipment_request_items (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    shipmentId    TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    category      TEXT NOT NULL,
    equipmentType TEXT NOT NULL,
    quantity      INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS site_requirements (
    id     TEXT PRIMARY KEY,
    siteId TEXT NOT NULL,
    title  TEXT NOT NULL DEFAULT '',
    detail TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS site_routes (
    id                TEXT PRIMARY KEY,
    siteId            TEXT NOT NULL,
    routeName         TEXT NOT NULL DEFAULT '',
    location          TEXT NOT NULL DEFAULT '',
    equipmentCategory TEXT NOT NULL DEFAULT '',
    note              TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS system_infos (
    siteId        TEXT PRIMARY KEY,
    operationInfo TEXT NOT NULL DEFAULT '',
    developerType TEXT NOT NULL DEFAULT '자체개발',
    developerName TEXT NOT NULL DEFAULT ''
  );
`);

// ── Schema migrations (idempotent ALTER TABLE) ────────────────────────────────
const migrations: { sql: string; check: string }[] = [
  {
    check: "installLocation",
    sql: "ALTER TABLE shipment_items ADD COLUMN installLocation TEXT NOT NULL DEFAULT ''",
  },
];

for (const { sql, check } of migrations) {
  const cols = db.pragma(`table_info(shipment_items)`) as { name: string }[];
  if (!cols.some((c) => c.name === check)) {
    db.exec(sql);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function genId(prefix: string): string {
  return `${prefix}-${randomBytes(3).toString("hex")}`;
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Row normalizers (SQLite integer → JS boolean, JSON string → array) ────────

type Row = Record<string, unknown>;

export function normalizeUser(row: Row) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...rest } = row;
  return { ...rest, active: Boolean(row.active) };
}

export function normalizeCompany(row: Row) {
  return {
    ...row,
    active: Boolean(row.active),
    colors: row.colors ? (JSON.parse(row.colors as string) as string[]) : undefined,
  };
}

export function normalizeSite(row: Row) {
  const parsedSiteManagers = row.siteManagers
    ? (JSON.parse(row.siteManagers as string) as { name: string; phone?: string }[])
    : row.siteManager
      ? [{ name: row.siteManager as string, phone: (row.siteManagerPhone as string) ?? undefined }]
      : [];

  const parsedSalesManagers = row.salesManagers
    ? (JSON.parse(row.salesManagers as string) as { name: string; phone?: string }[])
    : row.salesManager
      ? [{ name: row.salesManager as string, phone: (row.salesManagerPhone as string) ?? undefined }]
      : [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { siteManager, siteManagerPhone, salesManager, salesManagerPhone, ...rest } = row;
  return {
    ...rest,
    siteManagers: parsedSiteManagers,
    salesManagers: parsedSalesManagers,
    systemActive: Boolean(row.systemActive),
  };
}

// ── Seed initial data (runs only when DB is empty) ────────────────────────────

function seed() {
  const { count } = db.prepare("SELECT COUNT(*) as count FROM departments").get() as {
    count: number;
  };
  if (count > 0) return;

  const pw = bcrypt.hashSync("password123", 10);

  db.transaction(() => {
    // Departments
    const iDept = db.prepare("INSERT INTO departments (id, name) VALUES (?, ?)");
    iDept.run("DEPT-0001", "영업");
    iDept.run("DEPT-0002", "시공");
    iDept.run("DEPT-0003", "기술지원");
    iDept.run("DEPT-0004", "개발");

    // Users
    const iUser = db.prepare(
      "INSERT INTO users (id,name,department,role,active,position,email,phone,extension,password_hash) VALUES (?,?,?,?,?,?,?,?,?,?)"
    );
    iUser.run(
      "USR-0001",
      "김도현",
      "개발",
      "관리자",
      1,
      "팀장",
      "kdh@facility.co.kr",
      "010-1234-5678",
      "101",
      pw
    );
    iUser.run(
      "USR-0002",
      "이서연",
      "영업",
      "일반",
      1,
      "대리",
      "lsy@facility.co.kr",
      "010-2345-6789",
      "201",
      pw
    );
    iUser.run(
      "USR-0003",
      "박민준",
      "시공",
      "일반",
      1,
      "사원",
      "pmj@facility.co.kr",
      "010-3456-7890",
      "301",
      pw
    );
    iUser.run(
      "USR-0004",
      "최유진",
      "기술지원",
      "일반",
      0,
      "주임",
      "cyj@facility.co.kr",
      "010-4567-8901",
      "401",
      pw
    );

    // Companies
    const iCo = db.prepare(
      "INSERT INTO companies (id,name,contactName,contactPhone,contactEmail,address,note,active,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)"
    );
    iCo.run(
      "CO-0001",
      "한빛건설",
      "정태호",
      "010-2345-6789",
      "taeho.jung@hanbit-const.co.kr",
      "경기도 화성시 송산면 개매기길 100",
      "송산그린시티 시공사",
      1,
      "2025-11-02",
      "2026-03-14"
    );
    iCo.run(
      "CO-0002",
      "동양산업개발",
      "한지민",
      "010-8877-1122",
      "jimin.han@dongyang-id.co.kr",
      "인천광역시 연수구 송도과학로 32",
      "",
      1,
      "2026-01-15",
      "2026-01-15"
    );

    // Sites
    const iSite = db.prepare(
      "INSERT INTO sites (id,name,companyId,address,startDate,endDateExpected,status,siteManager,siteManagerPhone,salesManager,salesManagerPhone,note,systemActive,systemStatus,systemDomain,systemServerIp,systemDeveloper) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
    );
    iSite.run(
      "ST-0001",
      "송산그린시티 (시화도시사업단)",
      "CO-0001",
      "경기도 화성시 송산면",
      "2026-01-05",
      "2026-12-30",
      "계약완료",
      "박민준",
      "010-3456-7890",
      "이서연",
      "010-2345-6789",
      "\\\\192.168.0.240\\공급업체관리\\송산그린시티 (시화도시사업단) 참고",
      1,
      "구축중",
      "songsan.facility.co.kr",
      "192.168.0.240",
      "김도현"
    );
    iSite.run(
      "ST-0002",
      "송도 스마트시티 2단계",
      "CO-0002",
      "인천광역시 연수구 송도동",
      "2026-04-01",
      "2027-03-31",
      "입찰대기",
      "박민준",
      "010-3456-7890",
      "이서연",
      "010-2345-6789",
      "",
      0,
      null,
      null,
      null,
      null
    );

    // Equipment categories
    const iEcat = db.prepare("INSERT INTO equipment_categories (id, name) VALUES (?, ?)");
    iEcat.run("ECAT-0001", "CCTV");
    iEcat.run("ECAT-0002", "가스센서");
    iEcat.run("ECAT-0003", "DID");
    iEcat.run("ECAT-0004", "방송장비");

    // Equipment
    const iEq = db.prepare(
      "INSERT INTO equipment (id,name,code,category,equipmentType,manufacturer,model,note,ip,port,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
    );
    iEq.run(
      "EQ-0001",
      "고정형 IP카메라",
      "CCTV-FIX-001",
      "CCTV",
      "고정형",
      "한화비전",
      "XNO-6120R",
      "실외방수형",
      "192.168.1.101",
      "554",
      "출고완료"
    );
    iEq.run(
      "EQ-0002",
      "복합가스감지기",
      "GAS-MX-001",
      "가스센서",
      "복합형",
      "센코",
      "SK-4GAS",
      "CO/CH4/H2S/O2",
      "192.168.1.102",
      "8080",
      "출고완료"
    );
    iEq.run(
      "EQ-0003",
      "옥외 전광판(DID)",
      "DID-OUT-001",
      "DID",
      "옥외형",
      "삼성전자",
      "OM55N-D",
      "55인치, 방수",
      "192.168.1.103",
      "80",
      "출고준비"
    );
    iEq.run(
      "EQ-0004",
      "IP 앰프",
      "BC-AMP-001",
      "방송장비",
      "앰프",
      "TOA",
      "IP-30W",
      "",
      "",
      "",
      "입고"
    );

    // Shipments
    const iShip = db.prepare(
      "INSERT INTO shipments (id,shipmentNo,siteId,shipmentDate,shipperName,delivererName,note) VALUES (?,?,?,?,?,?,?)"
    );
    const iItem = db.prepare("INSERT INTO shipment_items (shipmentId, equipmentId) VALUES (?, ?)");

    iShip.run("SH-0001", "OUT-2026-0001", "ST-0001", "2026-05-10", "최유진", "박민준", "1차 출고");
    for (let i = 0; i < 3; i++) iItem.run("SH-0001", "EQ-0001");
    for (let i = 0; i < 2; i++) iItem.run("SH-0001", "EQ-0002");

    iShip.run(
      "SH-0002",
      "OUT-2026-0002",
      "ST-0001",
      "2026-06-02",
      "최유진",
      "박민준",
      "2차 출고 - DID/방송장비"
    );
    for (let i = 0; i < 2; i++) iItem.run("SH-0002", "EQ-0003");
    for (let i = 0; i < 3; i++) iItem.run("SH-0002", "EQ-0004");

    // Requirements + routes
    db.prepare("INSERT INTO site_requirements (id,siteId,title,detail) VALUES (?,?,?,?)").run(
      "REQ-0001",
      "ST-0001",
      "진입로 CCTV 야간 식별",
      "야간 저조도 환경에서 차량 번호판 식별이 가능해야 함 (IR 지원)"
    );
    const iRoute = db.prepare(
      "INSERT INTO site_routes (id,siteId,routeName,location,equipmentCategory,note) VALUES (?,?,?,?,?,?)"
    );
    iRoute.run("RT-0001", "ST-0001", "1노선", "정문~공사현장 진입로", "CCTV", "약 850m 구간");
    iRoute.run("RT-0002", "ST-0001", "2노선", "자재야적장 주변", "가스센서", "");

    // System info
    db.prepare(
      "INSERT INTO system_infos (siteId,operationInfo,developerType,developerName) VALUES (?,?,?,?)"
    ).run("ST-0001", "관제 서버 1식 현장 운영, 원격 모니터링 병행", "자체개발", "기술지원팀");
  })();

  console.log("✅ Seed data inserted.");
}

// ── Schema migrations (기존 DB 파일에 컬럼 추가 + 데이터 정규화) ───────────────

// 현장 상태값 "계약확정" → "계약완료" 일괄 변경
try {
  db.exec(`UPDATE sites SET status = '계약완료' WHERE status = '계약확정'`);
} catch { /* 무시 */ }

const columnMigrations = [
  `ALTER TABLE shipments ADD COLUMN status              TEXT NOT NULL DEFAULT '요청'`,
  `ALTER TABLE shipments ADD COLUMN requestedAt         TEXT`,
  `ALTER TABLE shipments ADD COLUMN preparedAt          TEXT`,
  `ALTER TABLE shipments ADD COLUMN completedAt         TEXT`,
  `ALTER TABLE shipments ADD COLUMN requesterName       TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE shipments ADD COLUMN deliveryRequestedAt TEXT`,
  `ALTER TABLE sites ADD COLUMN siteManagers  TEXT`,
  `ALTER TABLE sites ADD COLUMN salesManagers TEXT`,
];
for (const sql of columnMigrations) {
  try {
    db.exec(sql);
  } catch {
    /* already exists */
  }
}

// 이메일 미입력 시 빈 문자열("")이 UNIQUE 충돌을 일으키지 않도록 NULL로 정규화
try {
  db.exec(`UPDATE users SET email = NULL WHERE email = ''`);
} catch { /* 무시 */ }

// shipment_request_items 테이블은 CREATE TABLE IF NOT EXISTS로 이미 처리됨

seed();

export default db;
