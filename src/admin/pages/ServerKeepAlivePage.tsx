import { useEffect, useState } from "react";
import { Activity, Clock, Power, RefreshCw, Save } from "lucide-react";

import AdminLayout from "../components/AdminLayout";
import { Field, PageHeader, Panel, StatCard, StatusPill } from "../components/AdminUI";
import api from "../services/api";
import {
  getLastServerPingResult,
  getServerKeepAliveSettings,
  pingServer,
  saveServerKeepAliveSettings,
  serverKeepAliveResultEventName,
  type ServerKeepAliveSettings,
  type ServerPingResult,
} from "../utils/serverKeepAlive";

type BackendKeepAwakeSettings = {
  enabled: boolean;
  intervalMinutes: number;
  targetUrl: string;
  lastPingAt?: string;
  lastStatusCode?: number;
  lastMessage?: string;
};

export default function ServerKeepAlivePage() {
  const [settings, setSettings] = useState<ServerKeepAliveSettings>(
    getServerKeepAliveSettings,
  );
  const [lastResult, setLastResult] = useState<ServerPingResult | null>(
    getLastServerPingResult,
  );
  const [saving, setSaving] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [backendSaving, setBackendSaving] = useState(false);
  const [backendPinging, setBackendPinging] = useState(false);
  const [backendSettings, setBackendSettings] =
    useState<BackendKeepAwakeSettings>({
      enabled: false,
      intervalMinutes: 10,
      targetUrl: "",
    });

  useEffect(() => {
    const refreshResult = () => setLastResult(getLastServerPingResult());
    const eventName = serverKeepAliveResultEventName();

    window.addEventListener(eventName, refreshResult);
    return () =>
      window.removeEventListener(eventName, refreshResult);
  }, []);

  useEffect(() => {
    loadBackendSettings();
  }, []);

  const updateSetting = <Key extends keyof ServerKeepAliveSettings>(
    key: Key,
    value: ServerKeepAliveSettings[Key],
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const saveSettings = () => {
    setSaving(true);
    const normalized = saveServerKeepAliveSettings(settings);
    setSettings(normalized);
    window.setTimeout(() => setSaving(false), 400);
  };

  const wakeServerNow = async () => {
    setPinging(true);
    const result = await pingServer();
    setLastResult(result);
    setPinging(false);
  };

  const loadBackendSettings = async () => {
    try {
      const response = await api.get("/api/server/keep-awake");
      setBackendSettings(response?.data?.data || backendSettings);
    } catch (error) {
      console.error(error);
    }
  };

  const updateBackendSetting = <Key extends keyof BackendKeepAwakeSettings>(
    key: Key,
    value: BackendKeepAwakeSettings[Key],
  ) => {
    setBackendSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const saveBackendSettings = async () => {
    try {
      setBackendSaving(true);
      const response = await api.put(
        "/api/server/keep-awake",
        backendSettings,
      );
      setBackendSettings(response?.data?.data || backendSettings);
    } catch (error) {
      console.error(error);
      alert("Unable to update backend keep-awake settings");
    } finally {
      setBackendSaving(false);
    }
  };

  const pingBackendNow = async () => {
    try {
      setBackendPinging(true);
      const response = await api.post("/api/server/keep-awake/ping");
      setBackendSettings(response?.data?.data || backendSettings);
    } catch (error) {
      console.error(error);
      alert("Unable to ping from backend");
    } finally {
      setBackendPinging(false);
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Render"
        title="Server Keep Awake"
        subtitle="Ping the API without touching the database so delivery and sales users do not wait through a cold start."
        actions={
          <button className="admin-button" type="button" onClick={wakeServerNow}>
            <RefreshCw size={17} className={pinging ? "spin" : ""} />
            Wake Server Now
          </button>
        }
      />

      <div className="admin-stat-grid">
        <StatCard
          label="Keep Awake"
          value={settings.enabled ? "Enabled" : "Disabled"}
          icon={<Power size={20} />}
          tone={settings.enabled ? "green" : "slate"}
        />
        <StatCard
          label="Ping Interval"
          value={`${settings.intervalMinutes} min`}
          icon={<Clock size={20} />}
          tone="blue"
        />
        <StatCard
          label="Schedule"
          value={
            settings.scheduleMode === "startTime"
              ? `From ${settings.startTime}`
              : "Always"
          }
          icon={<RefreshCw size={20} />}
          tone="violet"
        />
        <StatCard
          label="Last Ping"
          value={lastResult ? formatDateTime(lastResult.timestamp) : "Not yet"}
          icon={<Activity size={20} />}
          tone={lastResult?.ok ? "green" : "amber"}
        />
      </div>

      <Panel
        title="Backend Keep Awake"
        subtitle="Runs from the API server. Set the target to your public Render health URL, for example https://your-api.onrender.com/api/health/ping."
        actions={
          <button
            className="admin-button admin-button-secondary"
            type="button"
            onClick={pingBackendNow}
          >
            <RefreshCw size={17} className={backendPinging ? "spin" : ""} />
            Backend Ping Now
          </button>
        }
      >
        <div className="admin-form-grid">
          <Field label="Backend Keep Awake">
            <select
              value={backendSettings.enabled ? "true" : "false"}
              onChange={(event) =>
                updateBackendSetting("enabled", event.target.value === "true")
              }
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </Field>

          <Field label="Backend Ping Minutes">
            <input
              type="number"
              min="1"
              step="1"
              value={backendSettings.intervalMinutes}
              onChange={(event) =>
                updateBackendSetting(
                  "intervalMinutes",
                  Number(event.target.value) || 1,
                )
              }
            />
          </Field>

          <Field label="Backend Target URL" span="full">
            <input
              value={backendSettings.targetUrl}
              onChange={(event) =>
                updateBackendSetting("targetUrl", event.target.value)
              }
              placeholder="https://your-api.onrender.com/api/health/ping"
            />
          </Field>

          <button
            className="admin-button"
            type="button"
            onClick={saveBackendSettings}
          >
            <Save size={17} />
            {backendSaving ? "Saving" : "Save Backend Settings"}
          </button>
        </div>

        <div className="sales-context-strip">
          <span>
            <StatusPill
              status={backendSettings.enabled ? "Backend enabled" : "Backend disabled"}
              tone={backendSettings.enabled ? "success" : "neutral"}
            />
          </span>
          <span>
            Last backend ping:{" "}
            {backendSettings.lastPingAt
              ? formatDateTime(backendSettings.lastPingAt)
              : "-"}
          </span>
          <span>Status: {backendSettings.lastStatusCode ?? "-"}</span>
          <span>{backendSettings.lastMessage || "No backend ping yet"}</span>
        </div>
      </Panel>

      <Panel
        title="Browser Keep Awake Settings"
        subtitle="These settings are stored on this browser and do not require a database call."
      >
        <div className="admin-form-grid">
          <Field label="Enable Keep Awake">
            <select
              value={settings.enabled ? "true" : "false"}
              onChange={(event) =>
                updateSetting("enabled", event.target.value === "true")
              }
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </Field>

          <Field label="Ping Every Minutes">
            <input
              type="number"
              min="1"
              step="1"
              value={settings.intervalMinutes}
              onChange={(event) =>
                updateSetting("intervalMinutes", Number(event.target.value) || 1)
              }
            />
          </Field>

          <Field label="Schedule Mode">
            <select
              value={settings.scheduleMode}
              onChange={(event) =>
                updateSetting(
                  "scheduleMode",
                  event.target.value === "startTime" ? "startTime" : "always",
                )
              }
            >
              <option value="always">Always</option>
              <option value="startTime">Start from time</option>
            </select>
          </Field>

          <Field label="Start Time">
            <input
              type="time"
              value={settings.startTime}
              disabled={settings.scheduleMode !== "startTime"}
              onChange={(event) =>
                updateSetting("startTime", event.target.value || "08:00")
              }
            />
          </Field>

          <Field label="Wake On App Open">
            <select
              value={settings.wakeOnAppOpen ? "true" : "false"}
              onChange={(event) =>
                updateSetting("wakeOnAppOpen", event.target.value === "true")
              }
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </Field>

          <Field label="Wake On Login Page">
            <select
              value={settings.wakeOnLoginPage ? "true" : "false"}
              onChange={(event) =>
                updateSetting("wakeOnLoginPage", event.target.value === "true")
              }
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </Field>

          <button className="admin-button" type="button" onClick={saveSettings}>
            <Save size={17} />
            {saving ? "Saved" : "Save Settings"}
          </button>
        </div>
      </Panel>

      <Panel title="Last Wake Result">
        <div className="sales-context-strip">
          <span>
            <StatusPill
              status={lastResult?.ok ? "Server awake" : "Not confirmed"}
              tone={lastResult?.ok ? "success" : "warning"}
            />
          </span>
          <span>Status: {lastResult?.status ?? "-"}</span>
          <span>Response: {lastResult ? `${lastResult.durationMs} ms` : "-"}</span>
          <span>{lastResult?.error || "No database query is used for this ping."}</span>
        </div>
      </Panel>
    </AdminLayout>
  );
}

function formatDateTime(value: string): string;
function formatDateTime(value: number): string;
function formatDateTime(value: string | number) {
  return new Date(value).toLocaleString("en-IN");
}
