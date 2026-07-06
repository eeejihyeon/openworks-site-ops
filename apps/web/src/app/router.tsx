import { lazy, Suspense } from "react";
import type React from "react";
import { createBrowserRouter } from "react-router";

import { AppLayout } from "./AppLayout";

function withSuspense(Component: React.LazyExoticComponent<() => React.JSX.Element>) {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: "#6B82B8" }}>불러오는 중...</div>}>
      <Component />
    </Suspense>
  );
}

const LoginPage = lazy(() => import("@/features/auth/LoginPage"));
const HomePage = lazy(() => import("@/features/dashboard/pages/HomePage"));
const UsersListPage = lazy(() => import("@/features/users/pages/UsersListPage"));
const CompaniesListPage = lazy(() => import("@/features/companies/pages/CompaniesListPage"));
const EquipmentListPage = lazy(() => import("@/features/equipment/pages/EquipmentListPage"));
const SitesListPage = lazy(() => import("@/features/sites/pages/SitesListPage"));
const ShipmentsListPage = lazy(() => import("@/features/shipments/pages/ShipmentsListPage"));
const ShipmentDashboardPage = lazy(
  () => import("@/features/shipments/pages/ShipmentDashboardPage")
);
const RequirementsPage = lazy(() => import("@/features/requirements/pages/RequirementsPage"));
const SystemInfoPage = lazy(() => import("@/features/system/pages/SystemInfoPage"));

export const router = createBrowserRouter([
  {
    path: "/login",
    element: withSuspense(LoginPage),
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: withSuspense(HomePage) },
      { path: "users", element: withSuspense(UsersListPage) },
      { path: "companies", element: withSuspense(CompaniesListPage) },
      { path: "equipment", element: withSuspense(EquipmentListPage) },
      { path: "sites", element: withSuspense(SitesListPage) },
      { path: "shipments", element: withSuspense(ShipmentsListPage) },
      { path: "shipments/dashboard", element: withSuspense(ShipmentDashboardPage) },
      { path: "requirements", element: withSuspense(RequirementsPage) },
      { path: "system", element: withSuspense(SystemInfoPage) },
    ],
  },
]);
