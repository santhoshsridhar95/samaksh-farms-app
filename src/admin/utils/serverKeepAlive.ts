import { API_BASE_URL } from "../../config/api";

export type ServerKeepAliveSettings = {
  enabled: boolean;
  intervalMinutes: number;
  scheduleMode: "always" | "startTime";
  startTime: string;
  wakeOnAppOpen: boolean;
  wakeOnLoginPage: boolean;
};

export type ServerPingResult = {
  ok: boolean;
  status?: number;
  timestamp: number;
  durationMs: number;
  error?: string;
};

const SETTINGS_KEY = "serverKeepAliveSettings";
const LAST_RESULT_KEY = "serverKeepAliveLastResult";
const SETTINGS_EVENT = "server-keep-alive-settings-changed";
const RESULT_EVENT = "server-keep-alive-result-changed";
const MIN_INTERVAL_MINUTES = 1;
const DEFAULT_SETTINGS: ServerKeepAliveSettings = {
  enabled: true,
  intervalMinutes: 10,
  scheduleMode: "always",
  startTime: "08:00",
  wakeOnAppOpen: true,
  wakeOnLoginPage: true,
};

let intervalId: number | undefined;
let timeoutId: number | undefined;
let started = false;

export function getServerKeepAliveSettings(): ServerKeepAliveSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");

    return normalizeSettings({
      ...DEFAULT_SETTINGS,
      ...saved,
    });
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveServerKeepAliveSettings(
  settings: ServerKeepAliveSettings,
) {
  const normalized = normalizeSettings(settings);
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event(SETTINGS_EVENT));

  return normalized;
}

export function getLastServerPingResult(): ServerPingResult | null {
  try {
    const value = localStorage.getItem(LAST_RESULT_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function serverKeepAliveResultEventName() {
  return RESULT_EVENT;
}

export async function pingServer(): Promise<ServerPingResult> {
  const startedAt = performance.now();

  try {
    const response = await fetch(`${API_BASE_URL}/api/health/ping`, {
      cache: "no-store",
      method: "GET",
    });
    const result = {
      ok: response.ok,
      status: response.status,
      timestamp: Date.now(),
      durationMs: Math.round(performance.now() - startedAt),
    };

    saveLastResult(result);
    return result;
  } catch (error: any) {
    const result = {
      ok: false,
      timestamp: Date.now(),
      durationMs: Math.round(performance.now() - startedAt),
      error: error?.message || "Unable to reach server",
    };

    saveLastResult(result);
    return result;
  }
}

export function pingServerOnLoginPage() {
  const settings = getServerKeepAliveSettings();

  if (settings.enabled && settings.wakeOnLoginPage) {
    void pingServer();
  }
}

export function startServerKeepAlive() {
  if (started) {
    restartServerKeepAlive();
    return;
  }

  started = true;
  window.addEventListener(SETTINGS_EVENT, restartServerKeepAlive);
  window.addEventListener("focus", pingWhenEnabled);
  document.addEventListener("visibilitychange", pingWhenVisible);
  restartServerKeepAlive();
}

function restartServerKeepAlive() {
  if (intervalId) {
    window.clearInterval(intervalId);
    intervalId = undefined;
  }
  if (timeoutId) {
    window.clearTimeout(timeoutId);
    timeoutId = undefined;
  }

  const settings = getServerKeepAliveSettings();

  if (!settings.enabled) {
    return;
  }

  const pingedNow = settings.wakeOnAppOpen && shouldPingNow(settings);

  if (pingedNow) {
    void pingServer();
  }

  scheduleNextPing(settings, pingedNow);
}

function pingWhenEnabled() {
  const settings = getServerKeepAliveSettings();

  if (settings.enabled && shouldPingNow(settings)) {
    void pingServer();
  }
}

function pingWhenVisible() {
  if (document.visibilityState === "visible") {
    pingWhenEnabled();
  }
}

function normalizeSettings(settings: ServerKeepAliveSettings) {
  return {
    enabled: Boolean(settings.enabled),
    intervalMinutes: Math.max(
      MIN_INTERVAL_MINUTES,
      Math.floor(Number(settings.intervalMinutes) || DEFAULT_SETTINGS.intervalMinutes),
    ),
    scheduleMode:
      settings.scheduleMode === "startTime" ? "startTime" : "always",
    startTime: normalizeTime(settings.startTime),
    wakeOnAppOpen: Boolean(settings.wakeOnAppOpen),
    wakeOnLoginPage: Boolean(settings.wakeOnLoginPage),
  };
}

function scheduleNextPing(
  settings: ServerKeepAliveSettings,
  pingedOnRestart: boolean,
) {
  const delayMs =
    settings.scheduleMode === "startTime"
      ? nextScheduledDelay(settings, pingedOnRestart)
      : settings.intervalMinutes * 60 * 1000;

  timeoutId = window.setTimeout(() => {
    void pingServer();
    intervalId = window.setInterval(
      () => void pingServer(),
      settings.intervalMinutes * 60 * 1000,
    );
  }, delayMs);
}

function nextScheduledDelay(
  settings: ServerKeepAliveSettings,
  pingedOnRestart: boolean,
) {
  if (isAfterStartTime(settings.startTime)) {
    return pingedOnRestart ? settings.intervalMinutes * 60 * 1000 : 0;
  }

  return msUntilStartTime(settings.startTime);
}

function shouldPingNow(settings: ServerKeepAliveSettings) {
  return settings.scheduleMode === "always" || isAfterStartTime(settings.startTime);
}

function msUntilStartTime(value: string) {
  const now = new Date();
  const [hours, minutes] = normalizeTime(value)
    .split(":")
    .map((part) => Number(part));
  const next = new Date(now);

  next.setHours(hours, minutes, 0, 0);

  if (next.getTime() <= now.getTime()) {
    return 0;
  }

  return next.getTime() - now.getTime();
}

function isAfterStartTime(value: string) {
  return msUntilStartTime(value) === 0;
}

function normalizeTime(value?: string) {
  if (value && /^\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  return DEFAULT_SETTINGS.startTime;
}

function saveLastResult(result: ServerPingResult) {
  localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(result));
  window.dispatchEvent(new Event(RESULT_EVENT));
}
