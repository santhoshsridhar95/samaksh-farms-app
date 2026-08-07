// src/routes/RoleBasedRoute.tsx

import { Navigate } from "react-router-dom";
import { AUTH_CONFIG } from "../config/authConfig";
import { getActiveSession } from "./authSession";

type Props = {
  children: React.ReactNode;
  allowedRoles: string[];
};

export default function RoleBasedRoute({
  children,
  allowedRoles
}: Props) {

  const { token, role } = getActiveSession();

  if (!token) {

    return (
      <Navigate
        to={AUTH_CONFIG.loginPath}
        replace
      />
    );
  }

  if (
    !role ||
    !allowedRoles.includes(role)
  ) {

    return (
      <Navigate
        to={AUTH_CONFIG.defaultAdminPage}
        replace
      />
    );
  }

  return <>{children}</>;
}
