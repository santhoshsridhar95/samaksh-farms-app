import { canAccessSection } from "../../routes/roleAccess";
import {
  ClipboardList,
  Factory,
  History,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Package,
  Server,


  Users,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import { clearSession, getStoredRoles } from "../../routes/authSession";

export default function Sidebar() {
  const navigate = useNavigate();

  const roles = getStoredRoles();

  const menuItems = [
    {to:"/admin/historical-data",label:"Historical Data",icon:History},
    { to: "/admin/sourcing", label: "Sourcing & Vendors", icon: Package },
    { to: "/admin/money", label: "Money & Expenses", icon: IndianRupee },
    {
      to: "/admin/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },

    {
      to: "/admin/farm-operations",
      label: "Farm Operations",
      icon: Factory,
    },

    {
      to: "/admin/orders",
      label: "Orders",
      icon: ClipboardList,
    },
    {
      to: "/admin/sales",
      label: "Sales",
      icon: IndianRupee,
    },
    {
      to: "/admin/users",
      label: "Users",
      icon: Users,
    },
    {
      to: "/admin/audit",
      label: "Audit",
      icon: History,
    },
    {
      to: "/admin/reviews",
      label: "Reviews",
      icon: MessageSquareText,
    },
    {
      to: "/admin/product-prices",
      label: "Product Prices",
      icon: IndianRupee,
    },
    {
      to: "/admin/server",
      label: "Server",
      icon: Server,
    },
  ];

  const visibleMenus = menuItems.filter(
    (item) => canAccessSection(roles, item.to.split("/").pop() || ""),
  );

  const logout = () => {
    clearSession();

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
