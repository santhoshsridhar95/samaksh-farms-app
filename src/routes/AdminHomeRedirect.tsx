import { Navigate } from "react-router-dom";

import { AUTH_CONFIG } from "../config/authConfig";
import { defaultAdminPageForRoles, getActiveSession } from "./authSession";

export default function AdminHomeRedirect() {
  const { token, roles } = getActiveSession();

  if (!token) {
    return <Navigate to={AUTH_CONFIG.loginPath} replace />;
  }

  return <Navigate to={defaultAdminPageForRoles(roles)} replace />;
}
