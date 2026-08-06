import { useEffect, useMemo, useState } from "react";

import "./DashBoardPage.css";

import {
  AlertTriangle,
  Bug,
  ClipboardList,
  IndianRupee,
  Package,
  Sprout,
  Trophy,
  Users,
  Warehouse,
} from "lucide-react";

import AdminLayout from "../components/AdminLayout";

import {
  EmptyState,
  Field,
  PageHeader,
  Panel,
  StatCard,
  StatusPill,
} from "../components/AdminUI";
import api from "../services/api";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [rankPeriod, setRankPeriod] = useState("day");
  const [rankLimit, setRankLimit] = useState("5");
  const [rankLocation, setRankLocation] = useState("ALL");
  const [rankSort, setRankSort] = useState("revenue");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const [dashboardResponse, alertResponse, salesResponse] =
      await Promise.allSettled([
        api.get("/api/farm-dashboard"),
        api.get("/api/inventory-alerts"),
        api.get("/api/sales?size=1000"),
      ]);

    if (dashboardResponse.status === "fulfilled") {
      setDashboard(dashboardResponse.value?.data?.data || {});
    } else {
      console.error(dashboardResponse.reason);
      setDashboard({});
    }

    if (alertResponse.status === "fulfilled") {
      setAlerts(alertResponse.value?.data?.data || []);
    } else {
      console.error(alertResponse.reason);
      setAlerts([]);
    }

    if (salesResponse.status === "fulfilled") {
      setSales(salesResponse.value?.data?.data?.content || []);
    } else {
      console.error(salesResponse.reason);
      setSales([]);
    }
  };

  const locations = useMemo(() => {
    const values = new Set<string>();
    const shopBalances = dashboard?.shopBalances || [];

    shopBalances.forEach((shop: any) => {
      values.add(shop.location || "R.T. Nagar");
    });

    sales.forEach((sale) => {
      values.add(sale.location || "R.T. Nagar");
    });

    return Array.from(values).sort();
  }, [dashboard?.shopBalances, sales]);

  const rankedShops = useMemo(
    () =>
      rankSales({
        sales,
        period: rankPeriod,
        location: rankLocation,
        limit: Number(rankLimit) || 5,
        sortBy: rankSort,
      }),
    [sales, rankPeriod, rankLocation, rankLimit, rankSort],
  );

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
          label="Pending Balance"
          value={`Rs. ${dashboard.totalPendingAmount ?? 0}`}
          icon={<ClipboardList size={20} />}
          tone="amber"
          helper="Shop amount due"
        />

        <StatCard
          label="Customers"
          value={dashboard.totalCustomers ?? 0}
          icon={<Users size={20} />}
          tone="violet"
          helper="Active customer base"
        />

        <StatCard
          label="Top Today"
          value={dashboard.dailyTopShop ?? "No sales yet"}
          icon={<Trophy size={20} />}
          tone="blue"
          helper="Best shop today"
        />
      </div>

      <Panel
        title="Revenue Focus"
        subtitle="Lifetime shop purchases, kg movement, collection, and balance."
      >
        {(dashboard.shopBalances || []).length === 0 && (
          <EmptyState
            title="No shop balances yet"
            message="Balances will appear after sales are recorded."
          />
        )}

        {(dashboard.shopBalances || []).length > 0 && (
          <div className="sales-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Boxes</th>
                  <th>Kgs</th>
                  <th>Total</th>
                  <th>Collected</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {(dashboard.shopBalances || []).map((shop: any) => (
                  <tr key={shop.customerId}>
                    <td>
                      <strong>{shop.shopName}</strong>
                    </td>
                    <td>{shop.shopCategory || "Shop"}</td>
                    <td>{shop.location || "R.T. Nagar"}</td>
                    <td>{shop.totalBoxes ?? 0}</td>
                    <td>{Number(shop.totalKgs ?? 0).toFixed(2)}</td>
                    <td>Rs. {shop.totalAmount ?? 0}</td>
                    <td>Rs. {shop.collectedAmount ?? 0}</td>
                    <td>Rs. {shop.pendingAmount ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        title="Sales Focus"
        subtitle="Choose the period, rank count, location, and sort rule for top-performing shops."
      >
        <div className="admin-form-grid dashboard-filter-grid">
          <Field label="Period">
            <select
              value={rankPeriod}
              onChange={(event) => setRankPeriod(event.target.value)}
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </Field>

          <Field label="Ranks">
            <input
              type="number"
              min="1"
              value={rankLimit}
              onChange={(event) => setRankLimit(event.target.value)}
            />
          </Field>

          <Field label="Location">
            <select
              value={rankLocation}
              onChange={(event) => setRankLocation(event.target.value)}
            >
              <option value="ALL">All locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Sort By">
            <select
              value={rankSort}
              onChange={(event) => setRankSort(event.target.value)}
            >
              <option value="revenue">Revenue</option>
              <option value="boxes">Boxes</option>
              <option value="kgs">Kgs</option>
              <option value="pending">Pending Balance</option>
              <option value="location">Location</option>
            </select>
          </Field>
        </div>

        {rankedShops.length === 0 && (
          <EmptyState
            title="No ranked shops"
            message="No sales match the selected filters."
          />
        )}

        {rankedShops.length > 0 && (
          <div className="sales-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Shop</th>
                  <th>Location</th>
                  <th>Boxes</th>
                  <th>Kgs</th>
                  <th>Revenue</th>
                  <th>Collected</th>
                  <th>Pending</th>
                </tr>
              </thead>
              <tbody>
                {rankedShops.map((shop, index) => (
                  <tr key={`${shop.customerId}-${shop.shopName}`}>
                    <td>#{index + 1}</td>
                    <td>
                      <strong>{shop.shopName}</strong>
                      <span>{shop.shopCategory || "Shop"}</span>
                    </td>
                    <td>{shop.location}</td>
                    <td>{shop.boxes}</td>
                    <td>{shop.kgs.toFixed(2)}</td>
                    <td>Rs. {shop.revenue}</td>
                    <td>Rs. {shop.collected}</td>
                    <td>Rs. {shop.pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

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
            src="/mushroom-farm.jpg"
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

function rankSales({
  sales,
  period,
  location,
  limit,
  sortBy,
}: {
  sales: any[];
  period: string;
  location: string;
  limit: number;
  sortBy: string;
}) {
  const startDate = startDateForPeriod(period);
  const endDate = endOfToday();

  const filteredSales = sales.filter((sale) => {
    const saleDate = sale.saleDate ? new Date(sale.saleDate) : null;
    const matchesDate =
      period === "all" ||
      (saleDate && saleDate >= startDate && saleDate <= endDate);
    const matchesLocation =
      location === "ALL" || (sale.location || "R.T. Nagar") === location;

    return matchesDate && matchesLocation;
  });

  const grouped = filteredSales.reduce<Record<string, any>>((result, sale) => {
    const customerId = String(sale.customerId || sale.customerName);
    const current =
      result[customerId] ||
      {
        customerId,
        shopName: sale.customerName || "Unknown",
        shopCategory: sale.shopCategory || "Shop",
        location: sale.location || "R.T. Nagar",
        boxes: 0,
        kgs: 0,
        revenue: 0,
        collected: 0,
        pending: 0,
      };

    const boxes = Number(sale.quantity) || 0;

    current.boxes += boxes;
    current.kgs += boxes * 0.2;
    current.revenue += Number(sale.totalAmount) || 0;
    current.collected += Number(sale.amountCollected) || 0;
    current.pending += salePending(sale);

    result[customerId] = current;
    return result;
  }, {});

  return Object.values(grouped)
    .sort((first, second) => {
      if (sortBy === "location") {
        return String(first.location).localeCompare(String(second.location));
      }

      const key =
        sortBy === "boxes"
          ? "boxes"
          : sortBy === "kgs"
            ? "kgs"
            : sortBy === "pending"
              ? "pending"
              : "revenue";

      return Number(second[key]) - Number(first[key]);
    })
    .slice(0, Math.max(1, limit));
}

function startDateForPeriod(period: string) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  if (period === "week") {
    const day = date.getDay();
    const daysSinceMonday = day === 0 ? 6 : day - 1;
    date.setDate(date.getDate() - daysSinceMonday);
  }

  if (period === "month") {
    date.setDate(1);
  }

  return date;
}

function endOfToday() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function salePending(sale: any) {
  if (sale.pendingAmount !== null && sale.pendingAmount !== undefined) {
    return Number(sale.pendingAmount) || 0;
  }

  return (Number(sale.totalAmount) || 0) - (Number(sale.amountCollected) || 0);
}
