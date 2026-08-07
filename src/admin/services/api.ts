import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import { AUTH_CONFIG } from "../../config/authConfig";
import { clearSession, getActiveSession } from "../../routes/authSession";

const api = axios.create({
  baseURL: API_BASE_URL
});

api.interceptors.request.use((config) => {

  if (isAuthEndpoint(config.url)) {
    return config;
  }

  const { token } = getActiveSession();

  if (token) {
    config.headers.Authorization =
      `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  response => response,
  error => {

    if (
      error.response?.status === 401 &&
      !isAuthEndpoint(error.config?.url)
    ) {

      clearSession();

      window.location.href = AUTH_CONFIG.loginPath;
    }

    return Promise.reject(error);
  }
);

function isAuthEndpoint(url?: string) {
  return Boolean(url?.includes("/api/auth/"));
}

export default api;
