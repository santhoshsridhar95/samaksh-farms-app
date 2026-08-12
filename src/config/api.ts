// src/config/api.ts

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080";

export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export const PUBLIC_SITE_URL =
  String(import.meta.env.VITE_PUBLIC_SITE_URL || "")
    .trim()
    .replace(/\/$/, "");
