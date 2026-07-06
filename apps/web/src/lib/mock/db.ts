/**
 * 실제 백엔드가 붙기 전까지 프론트만으로 앱을 구동하기 위한 인메모리 목 DB.
 * 각 feature의 api.ts는 axios(http)로 REST 형태 호출을 하고,
 * mock/adapter.ts 가 이 db를 읽고 써서 응답한다.
 * 실서버 연동 시에는 adapter.ts의 등록(registerMockAdapter)만 제거하면 된다.
 */

export type Department = string;
export type Role = "관리자" | "일반";

export interface DepartmentRow {
  id: string;
  name: string;
}

export interface UserRow {
  id: string;
  name: string;
  department: Department;
  role: Role;
  active: boolean;
  phone?: string;
  position?: string;
  email?: string;
  extension?: string;
}

export interface CompanyRow {
  id: string;
  name: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  note: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  logoUrl?: string;
  colors?: string[];
}

export type SiteStatus = "입찰대기" | "계약전" | "계약완료" | "종료";
export type SystemStatus = "구축중" | "운영중" | "종료";

export interface SiteManagerEntry {
  name: string;
  phone?: string;
}

export interface SiteRow {
  id: string;
  name: string;
  companyId: string;
  address: string;
  startDate: string;
  endDateExpected: string;
  status: SiteStatus;
  siteManagers: SiteManagerEntry[];
  salesManagers: SiteManagerEntry[];
  note: string;
  systemActive: boolean;
  systemStatus?: SystemStatus;
  systemDomain?: string;
  systemServerIp?: string;
  systemDeveloper?: string;
}

export type EquipmentCategory = string;
export type EquipmentStatus = "입고" | "출고준비" | "출고완료";

export interface EquipmentCategoryRow {
  id: string;
  name: string;
}

export interface EquipmentRow {
  id: string;
  name: string;
  code: string;
  category: EquipmentCategory;
  equipmentType?: string; // 장비 타입 (이동형/고정형/대차형 등)
  manufacturer: string;
  model: string;
  note: string;
  ip?: string;
  port?: string;
  status: EquipmentStatus;
}

export type ShipmentStatus = "요청" | "출고준비" | "출고완료";

export interface ShipmentRequestItem {
  category: string;
  equipmentType: string;
  quantity: number;
}

export interface ShipmentItem {
  equipmentId: string;
}

export interface ShipmentRow {
  id: string;
  shipmentNo: string;
  siteId: string;
  status: ShipmentStatus;
  requestedAt?: string; // 요청 등록일 (자동)
  preparedAt?: string; // 출고 준비일 (자동)
  completedAt?: string; // 출고 완료일 (자동)
  requesterName?: string; // 요청 담당자
  deliveryRequestedAt?: string; // 납품 요청일 (수동)
  requestItems: ShipmentRequestItem[]; // 출고 요청 항목
  shipperName?: string; // 출고 담당자 (기술지원팀)
  delivererName?: string; // 납품 담당자 (시공팀)
  items: ShipmentItem[]; // 실제 출고 장비
  note: string;
}

export interface RouteRow {
  id: string;
  routeName: string; // 노선명
  location: string; // 위치/구간
  equipmentCategory: EquipmentCategory | "";
  note: string;
}

export interface RequirementRow {
  id: string;
  siteId: string;
  title: string;
  detail: string;
}

export interface SiteRequirementDoc {
  siteId: string;
  requirements: RequirementRow[];
  routes: RouteRow[];
}

export type DeveloperType = "자체개발" | "외주개발" | "협력사개발";

export interface SystemInfoRow {
  siteId: string;
  operationInfo: string; // 시스템 운영 정보
  developerType: DeveloperType; // 개발사 구분
  developerName: string;
}

function id(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(4, "0")}`;
}

export const db = {
  departments: [
    { id: id("DEPT", 1), name: "영업" },
    { id: id("DEPT", 2), name: "시공" },
    { id: id("DEPT", 3), name: "기술지원" },
    { id: id("DEPT", 4), name: "개발" },
  ] as DepartmentRow[],

  users: [
    {
      id: id("USR", 1),
      name: "김도현",
      department: "개발",
      role: "관리자",
      active: true,
      position: "팀장",
      email: "kdh@facility.co.kr",
      phone: "010-1234-5678",
      extension: "101",
    },
    {
      id: id("USR", 2),
      name: "이서연",
      department: "영업",
      role: "일반",
      active: true,
      position: "대리",
      email: "lsy@facility.co.kr",
      phone: "010-2345-6789",
      extension: "201",
    },
    {
      id: id("USR", 3),
      name: "박민준",
      department: "시공",
      role: "일반",
      active: true,
      position: "사원",
      email: "pmj@facility.co.kr",
      phone: "010-3456-7890",
      extension: "301",
    },
    {
      id: id("USR", 4),
      name: "최유진",
      department: "기술지원",
      role: "일반",
      active: false,
      position: "주임",
      email: "cyj@facility.co.kr",
      phone: "010-4567-8901",
      extension: "401",
    },
  ] as UserRow[],

  companies: [
    {
      id: id("CO", 1),
      name: "한빛건설",
      contactName: "정태호",
      contactPhone: "010-2345-6789",
      contactEmail: "taeho.jung@hanbit-const.co.kr",
      address: "경기도 화성시 송산면 개매기길 100",
      note: "송산그린시티 시공사",
      active: true,
      createdAt: "2025-11-02",
      updatedAt: "2026-03-14",
    },
    {
      id: id("CO", 2),
      name: "동양산업개발",
      contactName: "한지민",
      contactPhone: "010-8877-1122",
      contactEmail: "jimin.han@dongyang-id.co.kr",
      address: "인천광역시 연수구 송도과학로 32",
      note: "",
      active: true,
      createdAt: "2026-01-15",
      updatedAt: "2026-01-15",
    },
  ] as CompanyRow[],

  sites: [
    {
      id: id("ST", 1),
      name: "송산그린시티 (시화도시사업단)",
      companyId: id("CO", 1),
      address: "경기도 화성시 송산면",
      startDate: "2026-01-05",
      endDateExpected: "2026-12-30",
      status: "계약완료",
      siteManagers: [{ name: "박민준", phone: "010-3456-7890" }],
      salesManagers: [{ name: "이서연", phone: "010-2345-6789" }],
      note: "\\\\192.168.0.240\\공급업체관리\\송산그린시티 (시화도시사업단) 참고",
      systemActive: true,
      systemStatus: "구축중",
      systemDomain: "songsан.facility.co.kr",
      systemServerIp: "192.168.0.240",
      systemDeveloper: "김도현",
    },
    {
      id: id("ST", 2),
      name: "송도 스마트시티 2단계",
      companyId: id("CO", 2),
      address: "인천광역시 연수구 송도동",
      startDate: "2026-04-01",
      endDateExpected: "2027-03-31",
      status: "입찰대기",
      siteManagers: [{ name: "박민준", phone: "010-3456-7890" }],
      salesManagers: [{ name: "이서연", phone: "010-2345-6789" }],
      note: "",
      systemActive: false,
    },
  ] as SiteRow[],

  equipmentCategories: [
    { id: id("ECAT", 1), name: "CCTV" },
    { id: id("ECAT", 2), name: "가스센서" },
    { id: id("ECAT", 3), name: "DID" },
    { id: id("ECAT", 4), name: "방송장비" },
  ] as EquipmentCategoryRow[],

  equipment: [
    {
      id: id("EQ", 1),
      name: "고정형 IP카메라",
      code: "CCTV-FIX-001",
      category: "CCTV",
      equipmentType: "고정형",
      manufacturer: "한화비전",
      model: "XNO-6120R",
      note: "실외방수형",
      ip: "192.168.1.101",
      port: "554",
      status: "출고완료",
    },
    {
      id: id("EQ", 2),
      name: "복합가스감지기",
      code: "GAS-MX-001",
      category: "가스센서",
      equipmentType: "복합형",
      manufacturer: "센코",
      model: "SK-4GAS",
      note: "CO/CH4/H2S/O2",
      ip: "192.168.1.102",
      port: "8080",
      status: "출고완료",
    },
    {
      id: id("EQ", 3),
      name: "옥외 전광판(DID)",
      code: "DID-OUT-001",
      category: "DID",
      equipmentType: "옥외형",
      manufacturer: "삼성전자",
      model: "OM55N-D",
      note: "55인치, 방수",
      ip: "192.168.1.103",
      port: "80",
      status: "출고준비",
    },
    {
      id: id("EQ", 4),
      name: "IP 앰프",
      code: "BC-AMP-001",
      category: "방송장비",
      equipmentType: "앰프",
      manufacturer: "TOA",
      model: "IP-30W",
      note: "",
      ip: "",
      port: "",
      status: "입고",
    },
  ] as EquipmentRow[],

  shipments: [
    {
      id: id("SH", 1),
      shipmentNo: "OUT-2026-0001",
      siteId: id("ST", 1),
      status: "출고완료",
      requestedAt: "2026-05-01",
      preparedAt: "2026-05-08",
      completedAt: "2026-05-10",
      requesterName: "최유진",
      deliveryRequestedAt: "2026-05-15",
      requestItems: [
        { category: "CCTV", equipmentType: "고정형", quantity: 3 },
        { category: "가스센서", equipmentType: "복합형", quantity: 2 },
      ],
      shipperName: "최유진",
      delivererName: "박민준",
      items: [
        { equipmentId: id("EQ", 1) },
        { equipmentId: id("EQ", 1) },
        { equipmentId: id("EQ", 1) },
        { equipmentId: id("EQ", 2) },
        { equipmentId: id("EQ", 2) },
      ],
      note: "1차 출고",
    },
    {
      id: id("SH", 2),
      shipmentNo: "OUT-2026-0002",
      siteId: id("ST", 1),
      status: "출고준비",
      requestedAt: "2026-05-20",
      preparedAt: "2026-05-28",
      requesterName: "최유진",
      deliveryRequestedAt: "2026-06-10",
      requestItems: [
        { category: "DID", equipmentType: "옥외형", quantity: 2 },
        { category: "방송장비", equipmentType: "앰프", quantity: 3 },
      ],
      shipperName: "최유진",
      items: [
        { equipmentId: id("EQ", 3) },
        { equipmentId: id("EQ", 3) },
        { equipmentId: id("EQ", 4) },
        { equipmentId: id("EQ", 4) },
        { equipmentId: id("EQ", 4) },
      ],
      note: "2차 출고 - DID/방송장비",
    },
  ] as ShipmentRow[],

  siteRequirementDocs: [
    {
      siteId: id("ST", 1),
      requirements: [
        {
          id: id("REQ", 1),
          siteId: id("ST", 1),
          title: "진입로 CCTV 야간 식별",
          detail: "야간 저조도 환경에서 차량 번호판 식별이 가능해야 함 (IR 지원)",
        },
      ],
      routes: [
        {
          id: id("RT", 1),
          routeName: "1노선",
          location: "정문~공사현장 진입로",
          equipmentCategory: "CCTV",
          note: "약 850m 구간",
        },
        {
          id: id("RT", 2),
          routeName: "2노선",
          location: "자재야적장 주변",
          equipmentCategory: "가스센서",
          note: "",
        },
      ],
    },
  ] as SiteRequirementDoc[],

  systemInfos: [
    {
      siteId: id("ST", 1),
      operationInfo: "관제 서버 1식 현장 운영, 원격 모니터링 병행",
      developerType: "자체개발",
      developerName: "기술지원팀",
    },
  ] as SystemInfoRow[],
};

export function genId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
