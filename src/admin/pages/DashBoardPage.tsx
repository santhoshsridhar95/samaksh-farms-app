import { useEffect, useState } from "react";

import "./DashboardPage.css";

import {
  AlertTriangle,
  Bug,
  ClipboardList,
  IndianRupee,
  Package,
  Sprout,
  Users,
  Warehouse,
} from "lucide-react";

import AdminLayout from "../components/AdminLayout";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatCard,
  StatusPill,
} from "../components/AdminUI";
import api from "../services/api";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const dashboardResponse = await api.get("/api/farm-dashboard");
      const alertResponse = await api.get("/api/inventory-alerts");

      setDashboard(dashboardResponse.data.data);
      setAlerts(alertResponse.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  if (!dashboard) {
    return (
      <AdminLayout>
        <div className="admin-loading">Loading dashboard...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Operations"
        title="Samaksh Farms Dashboard"
        subtitle="A live command view for inventory, production, orders, and sales."
      />

      <div className="admin-stat-grid">
        <StatCard
          label="Revenue"
          value={`Rs. ${dashboard.totalRevenue ?? 0}`}
          icon={<IndianRupee size={20} />}
          tone="green"
          helper="Total sales value"
        />

        <StatCard
          label="Orders"
          value={dashboard.totalOrders ?? 0}
          icon={<ClipboardList size={20} />}
          tone="blue"
          helper="Customer demand"
        />

        <StatCard
          label="Customers"
          value={dashboard.totalCustomers ?? 0}
          icon={<Users size={20} />}
          tone="violet"
          helper="Active customer base"
        />

        <StatCard
          label="Harvest Ready"
          value={dashboard.lightRoomBags ?? 0}
          icon={<Sprout size={20} />}
          tone="amber"
          helper="Bags in light room"
        />
      </div>

      <Panel
        title="Inventory Status"
        subtitle="Material balances that affect production continuity."
      >
        <div className="admin-stat-grid">
          <StatCard
            label="Spawn Balance"
            value={dashboard.spawnBalance ?? 0}
            icon={<Package size={20} />}
            tone="blue"
            critical={(dashboard.spawnBalance ?? 0) < 0}
          />

          <StatCard
            label="Pellet Balance"
            value={dashboard.pelletBalance ?? 0}
            icon={<Warehouse size={20} />}
            tone="green"
            critical={(dashboard.pelletBalance ?? 0) < 0}
          />

          <StatCard
            label="Bag Balance"
            value={dashboard.bagBalance ?? 0}
            icon={<Package size={20} />}
            tone="violet"
            critical={(dashboard.bagBalance ?? 0) < 0}
          />
        </div>
      </Panel>

      <Panel
        title="Production Status"
        subtitle="Current bag distribution across farm rooms and losses."
      >
        <div className="admin-stat-grid">
          <StatCard
            label="Dark Room"
            value={dashboard.darkRoomBags ?? 0}
            icon={<Sprout size={20} />}
            tone="slate"
          />

          <StatCard
            label="Light Room"
            value={dashboard.lightRoomBags ?? 0}
            icon={<Sprout size={20} />}
            tone="blue"
          />

          <StatCard
            label="Contaminated"
            value={dashboard.contaminatedBags ?? 0}
            icon={<Bug size={20} />}
            tone="red"
          />

          <StatCard
            label="Discarded"
            value={dashboard.discardedBags ?? 0}
            icon={<AlertTriangle size={20} />}
            tone="amber"
          />
        </div>
      </Panel>

      <div className="admin-dashboard-grid">
        <Panel
          title="Inventory Alerts"
          subtitle="Items below minimum required thresholds."
        >
          {alerts.length === 0 && (
            <EmptyState
              title="No active alerts"
              message="Inventory levels are currently within the configured range."
            />
          )}

          {alerts.length > 0 && (
            <div className="admin-alert-list">
              {alerts.map((alert, index) => (
                <article
                  className={
                    alert.alertStatus === "OK"
                      ? "admin-alert-item admin-alert-ok"
                      : "admin-alert-item admin-alert-danger"
                  }
                  key={`${alert.inventoryType}-${index}`}
                >
                  <header>
                    <h3>{alert.inventoryType}</h3>
                    <StatusPill
                      status={alert.alertStatus || "LOW_STOCK"}
                      tone={
                        alert.alertStatus === "OK"
                          ? "success"
                          : alert.alertStatus === "WARNING"
                            ? "warning"
                            : "danger"
                      }
                    />
                  </header>

                  <div className="admin-record-details">
                    <div>
                      <span>Current Balance</span>
                      <strong>{alert.currentBalance}</strong>
                    </div>
                    <div>
                      <span>Minimum Required</span>
                      <strong>{alert.minimumRequired}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Farm Summary"
          subtitle="Daily operating areas at a glance."
        >
          <img
            className="admin-summary-media"
            src="/mush-farm.jpg"
            alt="Samaksh Farms mushrooms"
          />

          <div className="admin-record-details">
            <div>
              <span>Operational Focus</span>
              <strong>Production, harvest, orders, sales</strong>
            </div>
            <div>
              <span>Attention Needed</span>
              <strong>{alerts.length} alerts</strong>
            </div>
          </div>
        </Panel>
      </div>
    </AdminLayout>
  );
}
