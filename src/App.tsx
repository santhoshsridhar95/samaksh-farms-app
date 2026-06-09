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
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleBasedRoute from "./routes/RoleProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/admin/dashboard"
          element={
            <RoleBasedRoute
              allowedRoles={["SUPER_ADMIN", "FARM_MANAGER", "SALES_USER"]}
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
              allowedRoles={["SUPER_ADMIN", "FARM_MANAGER", "SALES_USER"]}
            >
              <OrderPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/sales"
          element={
            <RoleBasedRoute
              allowedRoles={["SUPER_ADMIN", "FARM_MANAGER", "SALES_USER"]}
            >
              <SalesPage />
            </RoleBasedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
