import {
  ClipboardList,
  Factory,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Package,
  Repeat2,
  Sprout,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();

  const role = localStorage.getItem("role");

  const menuItems = [
    {
      to: "/admin/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["SUPER_ADMIN", "FARM_MANAGER", "SALES_USER"],
    },
    {
      to: "/admin/inventory",
      label: "Inventory",
      icon: Package,
      roles: ["SUPER_ADMIN", "FARM_MANAGER", "LABOUR"],
    },
    {
      to: "/admin/production",
      label: "Production",
      icon: Factory,
      roles: ["SUPER_ADMIN", "FARM_MANAGER", "LABOUR"],
    },
    {
      to: "/admin/room-transfer",
      label: "Room Transfer",
      icon: Repeat2,
      roles: ["SUPER_ADMIN", "FARM_MANAGER", "LABOUR"],
    },
    {
      to: "/admin/harvest",
      label: "Harvest",
      icon: Sprout,
      roles: ["SUPER_ADMIN", "FARM_MANAGER", "LABOUR"],
    },
    {
      to: "/admin/orders",
      label: "Orders",
      icon: ClipboardList,
      roles: ["SUPER_ADMIN", "FARM_MANAGER", "SALES_USER"],
    },
    {
      to: "/admin/sales",
      label: "Sales",
      icon: IndianRupee,
      roles: ["SUPER_ADMIN", "FARM_MANAGER", "SALES_USER"],
    },
  ];

  const visibleMenus = menuItems.filter(
    (item) => role && item.roles.includes(role),
  );

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");

    navigate("/login");
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <img src="/Samaksh_Mushroom_Icon.png" alt="" />

        <div>
          <strong>Samaksh Farms</strong>

          <span>ERP System</span>
        </div>
      </div>

      <nav className="admin-nav" aria-label="Admin navigation">
        {visibleMenus.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? "is-active" : ""}`
            }
          >
            <Icon size={18} />

            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div
        style={{
          marginTop: "auto",
          paddingTop: "20px",
        }}
      >
        <button
          onClick={logout}
          className="admin-nav-link"
          style={{
            width: "100%",
            cursor: "pointer",
            border: "none",
            background: "transparent",
          }}
        >
          <LogOut size={18} />

          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
