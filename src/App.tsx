import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import RoomTransferPage
  from "./admin/pages/RoomTransferPage";

import LoginPage
  from "./admin/pages/LoginPage";

import InventoryPage
  from "./admin/pages/InventoryPage";

import ProductionPage
  from "./admin/pages/ProductionPage";
  
import DashboardPage from "./admin/pages/DashBoardPage";
import HomePage from "./pages/Homepage";
import HarvestPage from "./admin/pages/HarvestPage";
import OrderPage from "./admin/pages/OrderPage";
import SalesPage from "./admin/pages/SalesPage";

export default function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<HomePage />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/admin/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/admin/inventory"
          element={<InventoryPage />}
        />

        <Route
          path="/admin/production"
          element={<ProductionPage />}
        />

        <Route
          path="/admin/room-transfer"
          element={<RoomTransferPage />}
        />

        <Route
          path="/admin/harvest"
          element={<HarvestPage />}
        />

        <Route
          path="/admin/orders"
          element={<OrderPage />}
        />
        <Route
          path="/admin/sales"
          element={<SalesPage />}
        />

      </Routes>

    </BrowserRouter>
  );
}