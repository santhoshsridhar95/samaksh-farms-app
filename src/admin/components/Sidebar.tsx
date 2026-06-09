import {
  ClipboardList,
  Factory,
  IndianRupee,
  LayoutDashboard,
  Package,
  Repeat2,
  Sprout
} from "lucide-react";

import { NavLink } from "react-router-dom";

const menuItems = [
  {
    to: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard
  },
  {
    to: "/admin/inventory",
    label: "Inventory",
    icon: Package
  },
  {
    to: "/admin/production",
    label: "Production",
    icon: Factory
  },
  {
    to: "/admin/room-transfer",
    label: "Room Transfer",
    icon: Repeat2
  },
  {
    to: "/admin/harvest",
    label: "Harvest",
    icon: Sprout
  },
  {
    to: "/admin/orders",
    label: "Orders",
    icon: ClipboardList
  },
  {
    to: "/admin/sales",
    label: "Sales",
    icon: IndianRupee
  }
];

export default function Sidebar() {
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
        {menuItems.map(({ to, label, icon: Icon }) => (
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
    </aside>
  );
}
