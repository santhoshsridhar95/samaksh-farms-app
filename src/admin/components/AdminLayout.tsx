import { useState, type ReactNode } from "react";
import { Bell, Menu, Search, UserCircle } from "lucide-react";
import "./AdminResponsive.css";

import Sidebar from "./Sidebar";
import { getStoredRoles } from "../../routes/authSession";

type Props = {
  children: ReactNode;
};

export default function AdminLayout({ children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const userName = localStorage.getItem("userName") || "User";
  const roles = getStoredRoles();
  const entitlementText = roles.map(formatRole).join(" · ");
  return (
    <div className="admin-shell">
      <Sidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="admin-main">
        <header className="admin-topbar">
          <button className="admin-button admin-mobile-menu" type="button" data-local-action="true" aria-label="Open navigation menu" aria-expanded={menuOpen} aria-controls="admin-mobile-navigation" onClick={() => setMenuOpen(true)}><Menu size={20} /><span>Menu</span></button>
          <div className="admin-search">
            <Search size={18} />
            <span>{roles.includes("SUPER_ADMIN") ? "Farm administration" : roles.some(r=>r.startsWith("SALES_")) ? "Sales workspace" : "Farm operations"}</span>
          </div>

          <div className="admin-topbar-actions">
            <button className="admin-icon-button" type="button" aria-label="Notifications">
              <Bell size={18} />
            </button>

            <div className="admin-user-chip">
              <UserCircle size={22} />
              <div>
                <strong>{userName}</strong>
                <span title={entitlementText}>{entitlementText}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}

function formatRole(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
