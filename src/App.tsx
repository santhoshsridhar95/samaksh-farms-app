import { adminRoles, farmRoles, salesRoles } from "./routes/roleAccess";
import RetroDataPage from "./admin/pages/RetroDataPage";
import SourcingPage from "./admin/pages/SourcingPage";
import EmployeesPage from "./admin/pages/EmployeesPage";
import MoneyPage from "./admin/pages/MoneyPage";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import FarmOperationsPage from "./admin/pages/FarmOperationsPage";

import LoginPage from "./admin/pages/LoginPage";





import DashboardPage from "./admin/pages/DashBoardPage";
import HomePage from "./pages/Homepage";

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
import AdminHomeRedirect from "./routes/AdminHomeRedirect";
import { useEffect } from "react";
import { startServerKeepAlive } from "./admin/utils/serverKeepAlive";

export default function App() {
  useEffect(() => {
    startServerKeepAlive();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/historical-data" element={<RoleBasedRoute allowedRoles={adminRoles}><RetroDataPage /></RoleBasedRoute>} />
        <Route path="/admin/farm-operations" element={<RoleBasedRoute allowedRoles={farmRoles}><FarmOperationsPage /></RoleBasedRoute>} />
        <Route path="/admin/sourcing" element={<RoleBasedRoute allowedRoles={adminRoles}><SourcingPage /></RoleBasedRoute>} />
        <Route path="/admin/employees" element={<RoleBasedRoute allowedRoles={adminRoles}><EmployeesPage /></RoleBasedRoute>} />
        <Route path="/admin/money" element={<RoleBasedRoute allowedRoles={adminRoles}><MoneyPage /></RoleBasedRoute>} />
        <Route path="/admin/direct-sales" element={<RoleBasedRoute allowedRoles={salesRoles}><Navigate to="/admin/sales?tab=direct" replace /></RoleBasedRoute>} />
        <Route path="/" element={<HomePage />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/signup" element={<LoginPage initialMode="signup" />} />

        <Route
          path="/forgot-password"
          element={<LoginPage initialMode="forgot" />}
        />

        <Route path="/verify-email" element={<VerifyEmailPage />} />

        <Route path="/admin" element={<AdminHomeRedirect />} />

        <Route
          path="/admin/dashboard"
          element={
            <RoleBasedRoute
              allowedRoles={adminRoles}
            >
              <DashboardPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/inventory"
          element={
            <RoleBasedRoute
              allowedRoles={farmRoles}
            >
              <Navigate to="/admin/farm-operations?tab=inventory" replace />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/production"
          element={
            <RoleBasedRoute
              allowedRoles={farmRoles}
            >
              <Navigate to="/admin/farm-operations?tab=production" replace />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/room-transfer"
          element={
            <RoleBasedRoute
              allowedRoles={farmRoles}
            >
              <Navigate to="/admin/farm-operations?tab=rooms" replace />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/harvest"
          element={
            <RoleBasedRoute
              allowedRoles={farmRoles}
            >
              <Navigate to="/admin/farm-operations?tab=harvest" replace />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <RoleBasedRoute
              allowedRoles={adminRoles}
            >
              <OrderPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/sales"
          element={
            <RoleBasedRoute
              allowedRoles={salesRoles}
            >
              <SalesPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <RoleBasedRoute allowedRoles={adminRoles}>
              <UserManagementPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/audit"
          element={
            <RoleBasedRoute allowedRoles={adminRoles}>
              <AuditTrailPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/reviews"
          element={
            <RoleBasedRoute allowedRoles={adminRoles}>
              <ReviewManagementPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/product-prices"
          element={
            <RoleBasedRoute allowedRoles={adminRoles}>
              <ProductPricingPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/server"
          element={
            <RoleBasedRoute
              allowedRoles={adminRoles}
            >
              <ServerKeepAlivePage />
            </RoleBasedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
