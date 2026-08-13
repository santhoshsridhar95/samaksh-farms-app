import axios from "axios";
import { API_BASE_URL } from "../config/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  if (isPublicEndpoint(config.url)) {
    delete config.headers.Authorization;
    return config;
  }

  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;

function isPublicEndpoint(url?: string) {
  return Boolean(
    url === "/api/reviews" ||
      url?.includes("/api/auth/") ||
      url?.includes("/api/products"),
  );
}
