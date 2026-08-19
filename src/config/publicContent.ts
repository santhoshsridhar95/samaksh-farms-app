import { API_BASE_URL } from "./api";

const BUILD_TIME_DYNAMIC_CONTENT =
  String(import.meta.env.VITE_ENABLE_PUBLIC_DYNAMIC_CONTENT || "false")
    .toLowerCase() === "true";

export type PublicContentSettings = {
  dynamicContentEnabled: boolean;
};

export async function isPublicDynamicContentEnabled(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/public-content/settings`, {
      cache: "no-store",
      method: "GET",
    });

    if (!response.ok) {
      return BUILD_TIME_DYNAMIC_CONTENT;
    }

    const body = await response.json();

    return Boolean(body?.data?.dynamicContentEnabled);
  } catch {
    return BUILD_TIME_DYNAMIC_CONTENT;
  }
}
