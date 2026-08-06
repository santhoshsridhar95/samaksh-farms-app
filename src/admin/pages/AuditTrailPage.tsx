import { useEffect, useMemo, useState } from "react";
import { History, Search } from "lucide-react";

import AdminLayout from "../components/AdminLayout";
import { EmptyState, Field, PageHeader, Panel, StatusPill } from "../components/AdminUI";
import api from "../services/api";

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    const response = await api.get("/api/audit");
    setLogs(response?.data?.data || []);
  };

  const modules = useMemo(
    () =>
      Array.from(new Set(logs.map((log) => log.module).filter(Boolean))).sort(),
    [logs],
  );

  const filteredLogs = logs.filter((log) => {
    const matchesModule = moduleFilter === "ALL" || log.module === moduleFilter;
    const searchable = [
      log.userName,
      log.userEmail,
      log.module,
      log.action,
      log.referenceId,
      log.remarks,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesModule && searchable.includes(search.toLowerCase());
  });

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Audit"
        title="Action History"
        subtitle="Review who created or edited shops, delivery entries, users, and other tracked records."
      />

      <Panel title="Filters" subtitle="Search by user, action, module, reference, or remarks.">
        <div className="admin-form-grid dashboard-filter-grid">
          <Field label="Search">
            <div className="admin-search-field">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search audit history"
              />
            </div>
          </Field>
          <Field label="Module">
            <select
              value={moduleFilter}
              onChange={(event) => setModuleFilter(event.target.value)}
            >
              <option value="ALL">All modules</option>
              {modules.map((module) => (
                <option key={module} value={module}>
                  {module}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Panel>

      <Panel
        title="Audit Trail"
        subtitle={`${filteredLogs.length} action${filteredLogs.length === 1 ? "" : "s"} found.`}
      >
        {filteredLogs.length === 0 && (
          <EmptyState
            title="No audit logs found"
            message="Tracked actions will appear here as users work in the system."
          />
        )}

        {filteredLogs.length > 0 && (
          <div className="sales-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>User</th>
                  <th>Module</th>
                  <th>Action</th>
                  <th>Reference</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDateTime(log.createdAt)}</td>
                    <td>
                      <strong>{log.userName || "System"}</strong>
                      <span>{log.userEmail || "-"}</span>
                    </td>
                    <td>
                      <StatusPill status={log.module} tone="info" />
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
    </AdminLayout>
  );
}

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("en-IN");
}

function formatAction(value?: string) {
  return String(value || "-")
    .toLowerCase()
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
