export const AUTH_CONFIG = {

  tokenKey: "token",

  roleKey: "role",

  loginPath: "/login",

  defaultAdminPage:
    "/admin/sales",

  sessionTimeoutMinutes:
    Number(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES || 60)
};
