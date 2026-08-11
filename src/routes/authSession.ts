import { AUTH_CONFIG } from "../config/authConfig";

type JwtPayload = {
  exp?: number;
};

export function getActiveSession() {
  const token = localStorage.getItem(AUTH_CONFIG.tokenKey);
  const role = localStorage.getItem(AUTH_CONFIG.roleKey);
  const roles = getStoredRoles();
  const loginAt = Number(localStorage.getItem("loginAt") || 0);

  if (!token || isJwtExpired(token) || isClientSessionExpired(loginAt)) {
    clearSession();
    return { token: null, role: null, roles: [] };
  }

  return { token, role, roles };
}

export function clearSession() {
  localStorage.removeItem(AUTH_CONFIG.tokenKey);
  localStorage.removeItem(AUTH_CONFIG.roleKey);
  localStorage.removeItem("roles");
  localStorage.removeItem("userName");
  localStorage.removeItem("userId");
  localStorage.removeItem("loginAt");
}

export function getStoredRoles() {
  const primaryRole = localStorage.getItem(AUTH_CONFIG.roleKey);

  try {
    const roles = JSON.parse(localStorage.getItem("roles") || "[]");

    if (Array.isArray(roles) && roles.length > 0) {
      return roles.map(String);
    }
  } catch {
    // Fall back to the primary role below.
  }

  return primaryRole ? [primaryRole] : [];
}

export function markSessionStarted() {
  localStorage.setItem("loginAt", String(Date.now()));
}

function isJwtExpired(token: string) {
  const payload = decodeJwtPayload(token);

  if (payload?.exp) {
    return Date.now() >= payload.exp * 1000;
  }

  return false;
}

function isClientSessionExpired(loginAt: number) {
  if (!loginAt || !AUTH_CONFIG.sessionTimeoutMinutes) {
    return false;
  }

  return (
    Date.now() - loginAt >
    AUTH_CONFIG.sessionTimeoutMinutes * 60 * 1000
  );
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}
