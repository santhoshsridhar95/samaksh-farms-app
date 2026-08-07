import {
  Navigate
} from "react-router-dom";

import {
  AUTH_CONFIG
} from "../config/authConfig";
import { getActiveSession } from "./authSession";

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({
  children
}: Props) {

  const { token } = getActiveSession();

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
