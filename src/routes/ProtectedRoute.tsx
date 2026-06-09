import {
  Navigate
} from "react-router-dom";

import {
  AUTH_CONFIG
} from "../config/authConfig";

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({
  children
}: Props) {

  const token =
    localStorage.getItem(
      AUTH_CONFIG.tokenKey
    );

  if (!token) {

    return (
      <Navigate
        to={
          AUTH_CONFIG.loginPath
        }
        replace
      />
    );
  }

  return <>{children}</>;
}