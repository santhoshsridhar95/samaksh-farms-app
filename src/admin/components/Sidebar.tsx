import { canAccessSection } from "../../routes/roleAccess";
import { useEffect, useRef } from "react";
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
  X,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import { clearSession, getStoredRoles } from "../../routes/authSession";

export default function Sidebar({mobileOpen, onClose}: {mobileOpen: boolean; onClose: () => void}) {
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (mobileOpen && !dialog.open) dialog.showModal();
    if (!mobileOpen && dialog.open) dialog.close();
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 1101px)");
    const closeOnDesktop = () => { if (desktop.matches) closeRef.current(); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => { document.body.style.overflow = previousOverflow; desktop.removeEventListener("change", closeOnDesktop); };
  }, [mobileOpen]);

  const roles = getStoredRoles();

  const menuItems = [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/sales", label: "Sales", icon: IndianRupee },
    { to: "/admin/money", label: "Money & Expenses", icon: IndianRupee },
    { to: "/admin/farm-operations", label: "Farm Operations", icon: Factory },
    { to: "/admin/employees", label: "Employees", icon: Users },
    { to: "/admin/sourcing", label: "Sourcing & Vendors", icon: Package },
    { to: "/admin/historical-data", label: "Historical Data", icon: History },
    { to: "/admin/orders", label: "Orders", icon: ClipboardList },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/audit", label: "Audit", icon: History },
    { to: "/admin/reviews", label: "Reviews", icon: MessageSquareText },
    { to: "/admin/product-prices", label: "Product Prices", icon: IndianRupee },
    { to: "/admin/server", label: "Server", icon: Server },
  ];

  const visibleMenus = menuItems.filter(
    (item) => canAccessSection(roles, item.to.split("/").pop() || ""),
  );

  const logout = () => {
    clearSession();

    navigate("/login");
  };

  const content = (mobile: boolean) => <>
      {mobile && <button type="button" data-local-action="true" className="admin-drawer-close" aria-label="Close navigation menu" onClick={onClose}><X size={22} /></button>}
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
            onClick={mobile ? onClose : undefined}
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
    </>;
  return <>
    <aside className="admin-sidebar admin-sidebar-desktop">{content(false)}</aside>
    <dialog ref={dialogRef} id="admin-mobile-navigation" className="admin-navigation-dialog" aria-label="Navigation menu" onClose={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="admin-sidebar admin-sidebar-mobile">{content(true)}</div>
    </dialog>
  </>;
}
