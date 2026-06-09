import type { ReactNode } from "react";
import { Bell, Search, UserCircle } from "lucide-react";

import Sidebar from "./Sidebar";

type Props = {
  children: ReactNode;
};

export default function AdminLayout({ children }: Props) {
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
                <strong>Admin</strong>
                <span>Operations</span>
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
