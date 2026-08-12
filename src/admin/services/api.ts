import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import { AUTH_CONFIG } from "../../config/authConfig";
import { clearSession, getActiveSession } from "../../routes/authSession";

const api = axios.create({
  baseURL: API_BASE_URL
});

const inFlightMutations = new Set<string>();
const lockedButtons = new Map<HTMLButtonElement, number>();
const pendingButtonTimers = new WeakMap<HTMLButtonElement, number>();
let pendingActionButton: HTMLButtonElement | null = null;
let lockSequence = 0;

if (typeof document !== "undefined") {
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      pendingActionButton = target.closest("button");
      if (!pendingActionButton || pendingActionButton.disabled) {
        return;
      }

      lockButton(pendingActionButton);

      const button = pendingActionButton;
      const timer = window.setTimeout(() => {
        pendingButtonTimers.delete(button);

        if (pendingActionButton === button) {
          pendingActionButton = null;
        }

        if (button.dataset.apiMutationPending !== "true") {
          unlockButton(button);
        }
      }, 750);

      pendingButtonTimers.set(button, timer);

      window.setTimeout(() => {
        if (pendingActionButton === button) {
          pendingActionButton = null;
        }
      }, 0);
    },
    true,
  );

  document.addEventListener(
    "submit",
    () => {
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
    pendingActionButton.dataset.apiMutationPending = "true";
    clearPendingButtonTimer(pendingActionButton);
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
    delete config.__actionButton.dataset.apiMutationPending;
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
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(sortForStableSerialization(value));
  } catch {
    return String(value);
  }
}

function sortForStableSerialization(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortForStableSerialization);
  }

  if (
    value &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [
          key,
          sortForStableSerialization(nestedValue),
        ]),
    );
  }

  return value;
}

function lockButton(button: HTMLButtonElement) {
  if (button.disabled) {
    return;
  }

  if (!lockedButtons.has(button)) {
    lockedButtons.set(button, ++lockSequence);
  }

  button.disabled = true;
  button.setAttribute("aria-busy", "true");
}

function unlockButton(button: HTMLButtonElement) {
  if (!lockedButtons.has(button)) {
    return;
  }

  clearPendingButtonTimer(button);
  lockedButtons.delete(button);
  button.disabled = false;
  button.removeAttribute("aria-busy");
}

function clearPendingButtonTimer(button: HTMLButtonElement) {
  const timer = pendingButtonTimers.get(button);

  if (!timer) {
    return;
  }

  window.clearTimeout(timer);
  pendingButtonTimers.delete(button);
}

export default api;
