import { useEffect, useState, type ReactNode } from "react";
import { Bell, Search, UserCircle } from "lucide-react";

import Sidebar from "./Sidebar";
import api from "../services/api";

type Props = {
  children: ReactNode;
};

export default function AdminLayout({ children }: Props) {
  const userName = localStorage.getItem("userName") || "User";
  const role = localStorage.getItem("role") || "User";
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    loadEntitlements();
  }, []);

  const loadEntitlements = async () => {
    try {
      const response = await api.get("/api/entitlements/me");
      setPermissions(response?.data?.data?.permissions || []);
    } catch (error) {
      console.error(error);
      setPermissions([]);
    }
  };

  const entitlementText =
    permissions.length > 0
      ? permissions.map(formatPermission).join(", ")
      : formatRole(role);

  return (
    <div className="admin-shell">
      <Sidebar />

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-search">
            <Search size={18} />
            <span>Search farm operations</span>
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

function formatPermission(permission: string) {
  return permission
    .replace(/\./g, " ")
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function formatRole(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
