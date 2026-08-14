import { BrowserRouter, Routes, Route } from "react-router-dom";

import RoomTransferPage from "./admin/pages/RoomTransferPage";

import LoginPage from "./admin/pages/LoginPage";

import InventoryPage from "./admin/pages/InventoryPage";

import ProductionPage from "./admin/pages/ProductionPage";

import DashboardPage from "./admin/pages/DashBoardPage";
import HomePage from "./pages/Homepage";
import HarvestPage from "./admin/pages/HarvestPage";
import OrderPage from "./admin/pages/OrderPage";
import SalesPage from "./admin/pages/SalesPage";
import UserManagementPage from "./admin/pages/UserManagementPage";
import AuditTrailPage from "./admin/pages/AuditTrailPage";
import VerifyEmailPage from "./admin/pages/VerifyEmailPage";
import ServerKeepAlivePage from "./admin/pages/ServerKeepAlivePage";
import ReviewManagementPage from "./admin/pages/ReviewManagementPage";
import ProductPricingPage from "./admin/pages/ProductPricingPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleBasedRoute from "./routes/RoleProtectedRoute";
import { useEffect } from "react";
import { startServerKeepAlive } from "./admin/utils/serverKeepAlive";

export default function App() {
  useEffect(() => {
    startServerKeepAlive();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/signup" element={<LoginPage initialMode="signup" />} />

        <Route
          path="/forgot-password"
          element={<LoginPage initialMode="forgot" />}
        />

        <Route path="/verify-email" element={<VerifyEmailPage />} />

        <Route
          path="/admin/dashboard"
          element={
            <RoleBasedRoute
              allowedRoles={[
                "SUPER_ADMIN",
                "FARM_MANAGER",
              ]}
            >
              <DashboardPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/inventory"
          element={
            <RoleBasedRoute
              allowedRoles={["SUPER_ADMIN", "FARM_MANAGER", "LABOUR"]}
            >
              <InventoryPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/production"
          element={
            <RoleBasedRoute
              allowedRoles={["SUPER_ADMIN", "FARM_MANAGER", "LABOUR"]}
            >
              <ProductionPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/room-transfer"
          element={
            <RoleBasedRoute
              allowedRoles={["SUPER_ADMIN", "FARM_MANAGER", "LABOUR"]}
            >
              <RoomTransferPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/harvest"
          element={
            <RoleBasedRoute
              allowedRoles={["SUPER_ADMIN", "FARM_MANAGER", "LABOUR"]}
            >
              <HarvestPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <RoleBasedRoute
              allowedRoles={[
                "SUPER_ADMIN",
                "FARM_MANAGER",
                "SALES_ADMIN",
                "SALES_EMPLOYEE",
                "SALES_USER",
              ]}
            >
              <OrderPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/sales"
          element={
            <RoleBasedRoute
              allowedRoles={[
                "SUPER_ADMIN",
                "FARM_MANAGER",
                "SALES_ADMIN",
                "SALES_EMPLOYEE",
                "SALES_USER",
              ]}
            >
              <SalesPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <RoleBasedRoute allowedRoles={["SUPER_ADMIN"]}>
              <UserManagementPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/audit"
          element={
            <RoleBasedRoute allowedRoles={["SUPER_ADMIN", "FARM_MANAGER"]}>
              <AuditTrailPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/reviews"
          element={
            <RoleBasedRoute allowedRoles={["SUPER_ADMIN"]}>
              <ReviewManagementPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/product-prices"
          element={
            <RoleBasedRoute allowedRoles={["SUPER_ADMIN", "FARM_MANAGER"]}>
              <ProductPricingPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/server"
          element={
            <RoleBasedRoute
              allowedRoles={[
                "SUPER_ADMIN",
                "FARM_MANAGER",
              ]}
            >
              <ServerKeepAlivePage />
            </RoleBasedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
