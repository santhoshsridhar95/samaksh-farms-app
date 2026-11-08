import { type ReactNode } from "react";
import { Bell, Search, UserCircle } from "lucide-react";

import Sidebar from "./Sidebar";
import { getStoredRoles } from "../../routes/authSession";

type Props = {
  children: ReactNode;
};

export default function AdminLayout({ children }: Props) {
  const userName = localStorage.getItem("userName") || "User";
  const roles = getStoredRoles();
  const entitlementText = roles.map(formatRole).join(" · ");
  return (
    <div className="admin-shell">
      <Sidebar />

      <main className="admin-main">
        <header className="admin-topbar">
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
