import { writeFileSync } from "node:fs";

const apiUrl = process.env.MOBILE_API_URL || process.env.VITE_API_URL;

if (!apiUrl) {
  console.error(
    [
      "Mobile API URL is required.",
      "Set MOBILE_API_URL to a phone-reachable backend URL before building.",
      'Example for physical phone: $env:MOBILE_API_URL="http://192.168.1.25:8080"',
      'Example for Android emulator: $env:MOBILE_API_URL="http://10.0.2.2:8080"',
    ].join("\n"),
  );
  process.exit(1);
}

let parsedUrl;

try {
  parsedUrl = new URL(apiUrl);
} catch {
  console.error(`Invalid MOBILE_API_URL: ${apiUrl}`);
  process.exit(1);
}

const blockedHosts = new Set(["localhost", "127.0.0.1", "::1"]);

if (blockedHosts.has(parsedUrl.hostname)) {
  console.error(
    [
      "Mobile builds cannot use localhost because localhost points to the phone.",
      `Current value: ${apiUrl}`,
      'Use your laptop/server IP, for example: $env:MOBILE_API_URL="http://192.168.1.25:8080"',
      'For Android emulator only, use: $env:MOBILE_API_URL="http://10.0.2.2:8080"',
    ].join("\n"),
  );
  process.exit(1);
}

writeFileSync(
  ".env.mobile.local",
  `VITE_API_URL=${apiUrl}\n`,
  "utf8",
);

console.log(`Mobile API URL configured: ${apiUrl}`);
