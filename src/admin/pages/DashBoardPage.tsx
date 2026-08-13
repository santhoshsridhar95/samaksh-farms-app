import { useEffect, useMemo, useState } from "react";

import "./DashBoardPage.css";

import {
  Activity,
  AlertTriangle,
  Bug,
  ClipboardList,
  IndianRupee,
  Package,
  PieChart,
  Sprout,
  TrendingDown,
  TrendingUp,
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
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [exchangeHandovers, setExchangeHandovers] = useState<any[]>([]);
  const [receivingExchangeKey, setReceivingExchangeKey] = useState("");
  const [rankPeriod, setRankPeriod] = useState("day");
  const [rankLimit, setRankLimit] = useState("5");
  const [rankLocation, setRankLocation] = useState("ALL");
  const [rankSort, setRankSort] = useState("revenue");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const [
      dashboardResponse,
      alertResponse,
      salesResponse,
      auditResponse,
      exchangeHandoversResponse,
    ] =
      await Promise.allSettled([
        api.get("/api/farm-dashboard"),
        api.get("/api/inventory-alerts"),
        api.get("/api/sales?size=1000"),
        api.get("/api/audit"),
        api.get("/api/exchange-box-handovers"),
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

    if (auditResponse.status === "fulfilled") {
      setAuditLogs(auditResponse.value?.data?.data || []);
    } else {
      setAuditLogs([]);
    }

    if (exchangeHandoversResponse.status === "fulfilled") {
      setExchangeHandovers(exchangeHandoversResponse.value?.data?.data || []);
    } else {
      setExchangeHandovers([]);
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

  const salesSimulation = useMemo(() => buildSalesSimulation(sales), [sales]);
  const shopPieSegments = useMemo(
    () => buildShopPieSegments(rankedShops.slice(0, 6)),
    [rankedShops],
  );
  const auditDigest = useMemo(() => buildAuditDigest(auditLogs), [auditLogs]);
  const exchangeAnalytics = useMemo(
    () => buildExchangeBoxAnalytics(sales, exchangeHandovers),
    [sales, exchangeHandovers],
  );

  const receiveExchangeBoxes = async (user: any) => {
    const boxes = Number(user.outstanding) || 0;

    if (boxes <= 0 || receivingExchangeKey) {
      return;
    }

    const ownerName = window.prompt(
      `Who received ${boxes} exchange boxes from ${user.name}?`,
      "Santhosh",
    );

    if (!ownerName?.trim()) {
      return;
    }

    setReceivingExchangeKey(user.key);

    try {
      await api.post("/api/exchange-box-handovers", {
        collectorUserId: user.userId || null,
        collectorName: user.name,
        collectorEmail: user.email || null,
        ownerName: ownerName.trim(),
        boxes,
        remarks: "Exchange boxes received by owner",
      });
      await loadDashboard();
    } finally {
      setReceivingExchangeKey("");
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
        title="Sales Simulation"
        subtitle="Day-to-day sales movement, today's shop changes, and shop contribution share."
      >
        <div className="dashboard-simulation-grid">
          <article className="dashboard-chart-card">
            <header>
              <div>
                <h3>Daily Sales Trend</h3>
                <span>
                  Today: Rs. {salesSimulation.todayRevenue} | Yesterday: Rs.{" "}
                  {salesSimulation.yesterdayRevenue}
                </span>
              </div>
              {salesSimulation.delta >= 0 ? (
                <TrendingUp size={20} />
              ) : (
                <TrendingDown size={20} />
              )}
            </header>

            <div className="dashboard-bar-chart" aria-label="Daily sales trend">
              {salesSimulation.dailyTrend.map((day) => (
                <div className="dashboard-bar-item" key={day.label}>
                  <div className="dashboard-bar-track">
                    <span style={{ height: `${day.percent}%` }} />
                  </div>
                  <small>{day.label}</small>
                  <strong>Rs. {day.revenue}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-chart-card">
            <header>
              <div>
                <h3>Shop Sales Share</h3>
                <span>Top shops by selected sales focus filter</span>
              </div>
              <PieChart size={20} />
            </header>

            {shopPieSegments.length === 0 && (
              <EmptyState
                title="No shop share yet"
                message="Sales share appears after delivery entries."
              />
            )}

            {shopPieSegments.length > 0 && (
              <div className="dashboard-pie-wrap">
                <div
                  className="dashboard-pie"
                  style={{ background: pieGradient(shopPieSegments) }}
                  aria-label="Shop sales share pie chart"
                />
                <div className="dashboard-pie-legend">
                  {shopPieSegments.map((segment) => (
                    <div key={segment.label}>
                      <span style={{ background: segment.color }} />
                      <strong>{segment.label}</strong>
                      <small>{segment.percent.toFixed(1)}%</small>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>

        <div className="dashboard-movers-grid">
          <article className="dashboard-chart-card">
            <header>
              <div>
                <h3>Increased Today</h3>
                <span>Compared with yesterday</span>
              </div>
              <TrendingUp size={20} />
            </header>
            {salesSimulation.increased.length === 0 && (
              <EmptyState title="No increases" message="No shop increased today." />
            )}
            {salesSimulation.increased.map((shop) => (
              <div className="dashboard-mover dashboard-mover-up" key={shop.shopName}>
                <strong>{shop.shopName}</strong>
                <span>+Rs. {shop.delta}</span>
              </div>
            ))}
          </article>

          <article className="dashboard-chart-card">
            <header>
              <div>
                <h3>Decreased Today</h3>
                <span>Compared with yesterday</span>
              </div>
              <TrendingDown size={20} />
            </header>
            {salesSimulation.decreased.length === 0 && (
              <EmptyState title="No decreases" message="No shop decreased today." />
            )}
            {salesSimulation.decreased.map((shop) => (
              <div className="dashboard-mover dashboard-mover-down" key={shop.shopName}>
                <strong>{shop.shopName}</strong>
                <span>Rs. {shop.delta}</span>
              </div>
            ))}
          </article>
        </div>
      </Panel>

      <Panel
        title="Exchange Box Tracking"
        subtitle="Boxes exchanged with shops, returned boxes, and boxes still with each employee."
      >
        <div className="admin-stat-grid">
          <StatCard
            label="Today Exchanged"
            value={exchangeAnalytics.today.exchanged}
            icon={<Package size={20} />}
            tone="blue"
            helper={`Yesterday: ${exchangeAnalytics.yesterday.exchanged}`}
          />
          <StatCard
            label="Today Returned"
            value={exchangeAnalytics.today.returned}
            icon={<Warehouse size={20} />}
            tone="green"
            helper={`Yesterday: ${exchangeAnalytics.yesterday.returned}`}
          />
          <StatCard
            label="With Employees"
            value={exchangeAnalytics.totalOutstanding}
            icon={<Users size={20} />}
            tone="amber"
            helper="Exchanged boxes not yet returned"
            critical={exchangeAnalytics.totalOutstanding > 0}
          />
          <StatCard
            label="Exchange Rate"
            value={`${exchangeAnalytics.today.exchangeRate.toFixed(1)}%`}
            icon={
              exchangeAnalytics.exchangeRateDelta >= 0 ? (
                <TrendingUp size={20} />
              ) : (
                <TrendingDown size={20} />
              )
            }
            tone={exchangeAnalytics.exchangeRateDelta >= 0 ? "violet" : "slate"}
            helper={`Yesterday: ${exchangeAnalytics.yesterday.exchangeRate.toFixed(1)}%`}
          />
        </div>

        {exchangeAnalytics.userBalances.length === 0 && (
          <EmptyState
            title="No exchange boxes"
            message="Employee exchange balances appear after delivery entries with exchange boxes."
          />
        )}

        {exchangeAnalytics.userBalances.length > 0 && (
          <div className="sales-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Exchanged</th>
                  <th>Returned</th>
                  <th>Owner Received</th>
                  <th>With Employee</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {exchangeAnalytics.userBalances.map((user) => (
                  <tr key={user.key}>
                    <td>
                      <strong>{user.name}</strong>
                      <span>{user.email || "-"}</span>
                    </td>
                    <td>{user.exchanged}</td>
                    <td>{user.returned}</td>
                    <td>{user.receivedByOwner}</td>
                    <td>{user.outstanding}</td>
                    <td>
                      <StatusPill
                        status={
                          user.outstanding > 0
                            ? "Boxes pending"
                            : "Returned all"
                        }
                        tone={user.outstanding > 0 ? "warning" : "success"}
                      />
                    </td>
                    <td>
                      <button
                        className="admin-action-button"
                        type="button"
                        disabled={
                          user.outstanding <= 0 ||
                          receivingExchangeKey === user.key
                        }
                        onClick={() => receiveExchangeBoxes(user)}
                      >
                        Receive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        title="Today Audit Digest"
        subtitle="Who delivered, created shops, approved users, changed roles, or granted access today."
      >
        <div className="admin-stat-grid">
          <StatCard
            label="Deliveries"
            value={auditDigest.deliveryCount}
            icon={<Activity size={20} />}
            tone="green"
            helper="Delivery entries today"
          />
          <StatCard
            label="Shop Setup"
            value={auditDigest.shopCount}
            icon={<Users size={20} />}
            tone="blue"
            helper="Shop changes today"
          />
          <StatCard
            label="Access Changes"
            value={auditDigest.accessCount}
            icon={<ClipboardList size={20} />}
            tone="amber"
            helper="Approvals, roles, entitlements"
          />
        </div>

        {auditDigest.logs.length === 0 && (
          <EmptyState
            title="No audit actions today"
            message="Today's tracked user actions will appear here."
          />
        )}

        {auditDigest.logs.length > 0 && (
          <div className="sales-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Person</th>
                  <th>Action</th>
                  <th>Reference</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {auditDigest.logs.slice(0, 12).map((log) => (
                  <tr key={log.id}>
                    <td>{formatTime(log.createdAt)}</td>
                    <td>
                      <strong>{log.userName || "System"}</strong>
                      <span>{log.userEmail || "-"}</span>
                    </td>
                    <td>{formatAction(log.action)}</td>
                    <td>{log.referenceId || "-"}</td>
                    <td>{log.remarks || "-"}</td>
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
    const saleDate = sale.saleDate ? parseBusinessDate(sale.saleDate) : null;
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

function buildSalesSimulation(sales: any[]) {
  const todayKey = dateKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = dateKey(yesterday);

  const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date;
  });

  const revenueByDate = sales.reduce<Record<string, number>>((result, sale) => {
    const key = sale.saleDate ? dateKey(parseBusinessDate(sale.saleDate)) : "";

    if (!key) {
      return result;
    }

    result[key] = (result[key] || 0) + (Number(sale.totalAmount) || 0);
    return result;
  }, {});

  const maxRevenue = Math.max(
    1,
    ...lastSevenDays.map((date) => revenueByDate[dateKey(date)] || 0),
  );

  const dailyTrend = lastSevenDays.map((date) => {
    const revenue = Math.round(revenueByDate[dateKey(date)] || 0);

    return {
      label: date.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
      }),
      revenue,
      percent: Math.max(4, (revenue / maxRevenue) * 100),
    };
  });

  const todayByShop = salesByShopForDate(sales, todayKey);
  const yesterdayByShop = salesByShopForDate(sales, yesterdayKey);

  const movers = Array.from(
    new Set([...Object.keys(todayByShop), ...Object.keys(yesterdayByShop)]),
  )
    .map((shopName) => ({
      shopName,
      today: todayByShop[shopName] || 0,
      yesterday: yesterdayByShop[shopName] || 0,
      delta: Math.round((todayByShop[shopName] || 0) - (yesterdayByShop[shopName] || 0)),
    }))
    .filter((shop) => shop.delta !== 0);

  return {
    todayRevenue: Math.round(revenueByDate[todayKey] || 0),
    yesterdayRevenue: Math.round(revenueByDate[yesterdayKey] || 0),
    delta: Math.round((revenueByDate[todayKey] || 0) - (revenueByDate[yesterdayKey] || 0)),
    dailyTrend,
    increased: movers
      .filter((shop) => shop.delta > 0)
      .sort((first, second) => second.delta - first.delta)
      .slice(0, 5),
    decreased: movers
      .filter((shop) => shop.delta < 0)
      .sort((first, second) => first.delta - second.delta)
      .slice(0, 5),
  };
}

function buildExchangeBoxAnalytics(sales: any[], handovers: any[]) {
  const todayKey = dateKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = dateKey(yesterday);
  const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date;
  });
  const daily = sales.reduce<Record<string, any>>((result, sale) => {
    const key = sale.saleDate ? dateKey(parseBusinessDate(sale.saleDate)) : "";

    if (!key) {
      return result;
    }

    const current =
      result[key] ||
      {
        boxes: 0,
        exchanged: 0,
        returned: 0,
      };

    current.boxes += Number(sale.quantity) || 0;
    current.exchanged += Number(sale.exchangeBoxes) || 0;
    current.returned += Number(sale.returnedBoxes) || 0;
    result[key] = current;
    return result;
  }, {});
  const maxExchanged = Math.max(
    1,
    ...lastSevenDays.map((date) => Number(daily[dateKey(date)]?.exchanged) || 0),
  );
  const dailyTrend = lastSevenDays.map((date) => {
    const key = dateKey(date);
    const day = daily[key] || { boxes: 0, exchanged: 0, returned: 0 };

    return {
      label: date.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
      }),
      boxes: Math.round(day.boxes || 0),
      exchanged: Math.round(day.exchanged || 0),
      returned: Math.round(day.returned || 0),
      exchangeRate: percentOf(day.exchanged, day.boxes),
      percentHeight: Math.max(4, ((day.exchanged || 0) / maxExchanged) * 100),
    };
  });
  const today = summarizeExchangeDay(daily[todayKey]);
  const yesterdaySummary = summarizeExchangeDay(daily[yesterdayKey]);
  const userBalances = buildExchangeUserBalances(sales, handovers);

  return {
    today,
    yesterday: yesterdaySummary,
    exchangeRateDelta: today.exchangeRate - yesterdaySummary.exchangeRate,
    totalOutstanding: userBalances.reduce(
      (total, user) => total + user.outstanding,
      0,
    ),
    dailyTrend,
    userBalances,
  };
}

function summarizeExchangeDay(day: any) {
  const boxes = Math.round(Number(day?.boxes) || 0);
  const exchanged = Math.round(Number(day?.exchanged) || 0);
  const returned = Math.round(Number(day?.returned) || 0);

  return {
    boxes,
    exchanged,
    returned,
    outstanding: Math.max(0, exchanged - returned),
    exchangeRate: percentOf(exchanged, boxes),
  };
}

function buildExchangeUserBalances(sales: any[], handovers: any[]) {
  const grouped = sales.reduce<Record<string, any>>((result, sale) => {
    const exchanged = Number(sale.exchangeBoxes) || 0;
    const returned = Number(sale.returnedBoxes) || 0;

    if (exchanged <= 0 && returned <= 0) {
      return result;
    }

    const userId = sale.collectorUserId || sale.createdByUserId || "";
    const email = sale.collectorEmail || sale.createdByEmail || "";
    const name = sale.collectorName || sale.createdByName || "Unknown user";
    const key = exchangeUserKey(userId, email, name);
    const current =
      result[key] ||
      {
        key,
        userId,
        name,
        email,
        exchanged: 0,
        returned: 0,
        receivedByOwner: 0,
        outstanding: 0,
      };

    current.exchanged += exchanged;
    current.returned += returned;
    current.outstanding = Math.max(
      0,
      current.exchanged - current.returned - current.receivedByOwner,
    );
    result[key] = current;
    return result;
  }, {});

  handovers.forEach((handover) => {
    const userId = handover.collectorUserId || "";
    const email = handover.collectorEmail || "";
    const name = handover.collectorName || "Unknown user";
    const key = exchangeUserKey(userId, email, name);
    const current =
      grouped[key] ||
      {
        key,
        userId,
        name,
        email,
        exchanged: 0,
        returned: 0,
        receivedByOwner: 0,
        outstanding: 0,
      };

    current.receivedByOwner += Number(handover.boxes) || 0;
    current.outstanding = Math.max(
      0,
      current.exchanged - current.returned - current.receivedByOwner,
    );
    grouped[key] = current;
  });

  return Object.values(grouped)
    .map((user) => ({
      ...user,
      exchanged: Math.round(user.exchanged),
      returned: Math.round(user.returned),
      receivedByOwner: Math.round(user.receivedByOwner),
      outstanding: Math.max(
        0,
        Math.round(user.exchanged - user.returned - user.receivedByOwner),
      ),
    }))
    .sort((first, second) => second.outstanding - first.outstanding);
}

function exchangeUserKey(userId: string | number, email: string, name: string) {
  return userId ? `id:${userId}` : email ? `email:${email}` : `name:${name}`;
}

function percentOf(value: number, total: number) {
  if (!total) {
    return 0;
  }

  return (Number(value || 0) / Number(total || 0)) * 100;
}

function salesByShopForDate(sales: any[], key: string) {
  return sales.reduce<Record<string, number>>((result, sale) => {
    const saleKey = sale.saleDate ? dateKey(parseBusinessDate(sale.saleDate)) : "";

    if (saleKey !== key) {
      return result;
    }

    const shopName = sale.customerName || "Unknown";
    result[shopName] = (result[shopName] || 0) + (Number(sale.totalAmount) || 0);
    return result;
  }, {});
}

function buildShopPieSegments(shops: any[]) {
  const colors = ["#166534", "#2563eb", "#f59e0b", "#7c3aed", "#dc2626", "#0891b2"];
  const total = shops.reduce(
    (sum, shop) => sum + (Number(shop.revenue) || 0),
    0,
  );

  if (!total) {
    return [];
  }

  return shops.map((shop, index) => ({
    label: shop.shopName || "Unknown",
    value: Number(shop.revenue) || 0,
    percent: ((Number(shop.revenue) || 0) / total) * 100,
    color: colors[index % colors.length],
  }));
}

function pieGradient(segments: any[]) {
  let cursor = 0;
  const parts = segments.map((segment) => {
    const start = cursor;
    cursor += segment.percent;
    return `${segment.color} ${start}% ${cursor}%`;
  });

  return `conic-gradient(${parts.join(", ")})`;
}

function buildAuditDigest(logs: any[]) {
  const today = dateKey(new Date());
  const todaysLogs = logs
    .filter((log) => log.createdAt && dateKey(parseBusinessDate(log.createdAt)) === today)
    .sort(
      (first, second) =>
        parseBusinessDate(second.createdAt).getTime() -
        parseBusinessDate(first.createdAt).getTime(),
    );

  return {
    logs: todaysLogs,
    deliveryCount: todaysLogs.filter((log) => log.action === "CREATE_SALE").length,
    shopCount: todaysLogs.filter((log) => log.module === "CUSTOMER").length,
    accessCount: todaysLogs.filter((log) =>
      ["APPROVE_USER", "REJECT_USER", "CHANGE_ROLE", "CHANGE_ENTITLEMENTS", "RESET_PASSWORD"].includes(
        log.action,
      ),
    ).length,
  };
}

function dateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function parseBusinessDate(value?: string) {
  if (!value) {
    return new Date("");
  }

  const normalized = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value)
    ? value
    : `${value}+05:30`;

  return new Date(normalized);
}

function formatTime(value?: string) {
  if (!value) {
    return "-";
  }

  return parseBusinessDate(value).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAction(value?: string) {
  return String(value || "-")
    .toLowerCase()
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
