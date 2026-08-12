import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import { AUTH_CONFIG } from "../../config/authConfig";
import { clearSession, getActiveSession } from "../../routes/authSession";

const api = axios.create({
  baseURL: API_BASE_URL
});

const inFlightMutations = new Set<string>();
const lockedButtons = new Set<HTMLButtonElement>();
let pendingActionButton: HTMLButtonElement | null = null;

if (typeof document !== "undefined") {
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      pendingActionButton = target.closest("button");
      window.setTimeout(() => {
        pendingActionButton = null;
      }, 0);
    },
    true,
  );
}

api.interceptors.request.use((config) => {

  if (isAuthEndpoint(config.url)) {
    attachMutationGuard(config);
    return config;
  }

  const { token } = getActiveSession();

  if (token) {
    config.headers.Authorization =
      `Bearer ${token}`;
  }

  attachMutationGuard(config);

  return config;
});

api.interceptors.response.use(
  response => {
    releaseMutationGuard(response.config);
    return response;
  },
  error => {
    releaseMutationGuard(error.config);

    if (error?.isDuplicateMutation) {
      return Promise.reject(error);
    }

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

function attachMutationGuard(config: any) {
  if (!isMutationMethod(config.method)) {
    return;
  }

  const mutationKey = mutationRequestKey(config);

  if (inFlightMutations.has(mutationKey)) {
    const error: any = new Error("Request already in progress");
    error.isDuplicateMutation = true;
    error.config = config;
    throw error;
  }

  inFlightMutations.add(mutationKey);
  config.__mutationKey = mutationKey;

  if (pendingActionButton) {
    config.__actionButton = pendingActionButton;
    lockButton(pendingActionButton);
  }
}

function releaseMutationGuard(config: any) {
  if (!config) {
    return;
  }

  if (config.__mutationKey) {
    inFlightMutations.delete(config.__mutationKey);
  }

  if (config.__actionButton) {
    unlockButton(config.__actionButton);
  }
}

function isMutationMethod(method?: string) {
  return ["post", "put", "patch", "delete"].includes(
    String(method || "get").toLowerCase(),
  );
}

function mutationRequestKey(config: any) {
  return [
    String(config.method || "get").toUpperCase(),
    config.baseURL || "",
    config.url || "",
    stableSerialize(config.params),
    stableSerialize(config.data),
  ].join("|");
}

function stableSerialize(value: unknown): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, Object.keys(value as object).sort());
  } catch {
    return String(value);
  }
}

function lockButton(button: HTMLButtonElement) {
  if (button.disabled) {
    return;
  }

  lockedButtons.add(button);
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
}

function unlockButton(button: HTMLButtonElement) {
  if (!lockedButtons.has(button)) {
    return;
  }

  lockedButtons.delete(button);
  button.disabled = false;
  button.removeAttribute("aria-busy");
}

export default api;
