import styled from "@emotion/styled";
import { color, font } from "@facility/ui";
import {
  BarChart2,
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Settings,
  Truck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router";

import { useAuthStore } from "@/store/authStore";

const Shell = styled.div({
  minHeight: "100vh",
});

const Sidebar = styled.aside({
  background: "#FFFFFF",
  borderRight: `1px solid ${color.border}`,
  padding: "12px 0",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 2,
  position: "fixed",
  top: 0,
  left: 0,
  bottom: 0,
  width: 64,
  zIndex: 50,
});

const BrandMark = styled.div({
  width: 36,
  height: 36,
  borderRadius: 10,
  background: color.primary,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 8,
  flexShrink: 0,
});

const BrandDot = styled.span({
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: color.accent,
  boxShadow: `0 0 0 3px rgba(59, 130, 246, 0.35)`,
  display: "block",
});

const Divider = styled.div({
  width: 32,
  height: 1,
  background: color.border,
  margin: "6px 0",
  flexShrink: 0,
});

const NavItemWrapper = styled.div({
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  "& .nav-tooltip": {
    opacity: 0,
    pointerEvents: "none",
    transform: "translateY(-50%) translateX(-4px)",
    transition: "opacity 140ms ease, transform 140ms ease",
  },
  "&:hover .nav-tooltip": {
    opacity: 1,
    transform: "translateY(-50%) translateX(0)",
  },
});

const NavTooltip = styled.div({
  position: "absolute",
  left: "calc(100% + 10px)",
  top: "50%",
  background: color.ink,
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 500,
  padding: "5px 10px",
  borderRadius: 6,
  whiteSpace: "nowrap",
  pointerEvents: "none",
  zIndex: 200,
  boxShadow: "0 4px 12px rgba(15,27,62,0.18)",
  "&::before": {
    content: '""',
    position: "absolute",
    right: "100%",
    top: "50%",
    transform: "translateY(-50%)",
    borderWidth: 5,
    borderStyle: "solid",
    borderColor: `transparent ${color.ink} transparent transparent`,
  },
});

const NavIconBtn = styled.div<{ $active: boolean }>(({ $active }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  height: 40,
  borderRadius: 10,
  background: $active ? color.primarySoft : "transparent",
  color: $active ? color.primary : "#2e2e2e",
  cursor: "pointer",
  transition: "background 140ms ease, color 140ms ease",
  margin: "1px 0",
  "&:hover": {
    background: $active ? color.primarySoft : color.accentSoft,
    color: $active ? color.primary : color.accent,
  },
}));

function NavItem({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}) {
  return (
    <NavItemWrapper>
      <NavLink to={to} end={end} style={{ textDecoration: "none" }}>
        {({ isActive }) => (
          <NavIconBtn $active={isActive}>
            <Icon size={20} />
          </NavIconBtn>
        )}
      </NavLink>
      <NavTooltip className="nav-tooltip">{label}</NavTooltip>
    </NavItemWrapper>
  );
}

const Main = styled.main({
  marginLeft: 64,
  background: color.bg,
  padding: "24px 32px",
  minWidth: 0,
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  overflow: "hidden",
});

const OutletWrapper = styled.div({
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  paddingBottom: 8,
});

const Header = styled.header({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
});

const UserChip = styled.div({
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 12,
  color: color.inkMuted,
  fontFamily: font.mono,
});

const LogoutBtn = styled.button({
  display: "flex",
  alignItems: "center",
  gap: 5,
  padding: "4px 10px",
  border: `1px solid ${color.border}`,
  borderRadius: 6,
  background: "transparent",
  color: color.inkFaint,
  fontSize: 12,
  cursor: "pointer",
  transition: "color 140ms, border-color 140ms",
  "&:hover": {
    color: color.danger,
    borderColor: color.danger,
  },
});

const NAV_GROUPS: {
  items: { to: string; label: string; icon: LucideIcon; end?: boolean }[];
}[] = [
  {
    items: [{ to: "/", label: "대시보드", icon: LayoutDashboard, end: true }],
  },
  {
    items: [
      { to: "/users", label: "사용자 관리", icon: Users },
      { to: "/companies", label: "건설사 관리", icon: Building2 },
      { to: "/sites", label: "현장 관리", icon: MapPin },
    ],
  },
  {
    items: [
      { to: "/equipment", label: "장비 마스터", icon: Package },
      { to: "/shipments", label: "출고 관리", icon: Truck, end: true },
      { to: "/shipments/dashboard", label: "출고 현황", icon: BarChart2 },
    ],
  },
  {
    items: [
      { to: "/requirements", label: "시스템 요구사항", icon: ClipboardList },
      { to: "/system", label: "시스템 관리", icon: Settings },
    ],
  },
];

export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" replace />;

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <Shell>
      <Sidebar>
        <BrandMark>
          <BrandDot />
        </BrandMark>
        {NAV_GROUPS.map((group, gi) => (
          <div
            key={gi}
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {gi > 0 && <Divider />}
            {group.items.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                end={item.end}
              />
            ))}
          </div>
        ))}
      </Sidebar>
      <Main>
        <Header>
          <div />
          <UserChip>
            {`${user.name} · ${user.department} · ${user.role}`}
            <LogoutBtn onClick={handleLogout}>
              <LogOut size={12} />
              로그아웃
            </LogoutBtn>
          </UserChip>
        </Header>
        <OutletWrapper>
          <Outlet />
        </OutletWrapper>
      </Main>
    </Shell>
  );
}
