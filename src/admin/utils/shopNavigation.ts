export function mapTarget(value = ""): string {
  const text = value.trim();
  const pin = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (pin) return coordinates(pin[1], pin[2]);
  if (/^https?:\/\//i.test(text)) {
    const url = new URL(text);
    if (!isGoogleMap(url)) throw new Error("Use a Google Maps link, address, or latitude, longitude.");
    for (const key of ["destination", "query", "q"]) {
      const query = url.searchParams.get(key);
      if (query && !/^https?:/i.test(query)) return mapTarget(query);
    }
    // A map viewport is not necessarily the selected shop pin.
    return "";
  }
  const pair = text.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (pair) return coordinates(pair[1], pair[2]);
  if (/^[\d\s.,+-]+$/.test(text) && text) throw new Error("Enter latitude, longitude as a pair.");
  return text;
}
function coordinates(lat: string, lng: string) {
  if (Math.abs(Number(lat)) > 90 || Math.abs(Number(lng)) > 180) throw new Error("Latitude must be -90 to 90 and longitude -180 to 180.");
  return `${Number(lat)},${Number(lng)}`;
}
function isGoogleMap(url: URL) {
  return url.protocol === "https:" && (url.hostname === "maps.app.goo.gl" ||
    (url.hostname === "goo.gl" && url.pathname.startsWith("/maps")) ||
    (["www.google.com", "google.com", "maps.google.com", "www.google.co.in", "maps.google.co.in"].includes(url.hostname) && (url.pathname.startsWith("/maps") || url.hostname.startsWith("maps."))));
}
function safeTarget(value = "") {
  try { return mapTarget(value); } catch { return ""; }
}
function savedMapLink(value: string) {
  try { return isGoogleMap(new URL(value)) ? value : ""; } catch { return ""; }
}
export function shopDirections(shop: {mapLocation?: string; address?: string; customerName?: string; shopName?: string; location?: string}) {
  const saved = shop.mapLocation?.trim() || "";
  const target = safeTarget(saved);
  if (!target && savedMapLink(saved)) return saved;
  return `https://www.google.com/maps/dir/?${new URLSearchParams({api: "1", destination: target || [shop.customerName || shop.shopName, shop.address, shop.location].filter(Boolean).join(", "), travelmode: "driving", dir_action: "navigate"})}`;
}
export function routeSections(origin: string, shops: {mapLocation?: string; address?: string; shopName: string; location: string}[]) {
  const result: string[] = [];
  let start = safeTarget(origin);
  let group: string[] = [];
  const flush = () => {
    if (!group.length) return;
    const params = new URLSearchParams({api: "1", destination: group[group.length - 1], travelmode: "driving"});
    if (start) params.set("origin", start);
    if (group.length > 1) params.set("waypoints", group.slice(0, -1).join("|"));
    result.push(`https://www.google.com/maps/dir/?${params}`);
    start = group[group.length - 1]; group = [];
  };
  for (const shop of shops) {
    const target = safeTarget(shop.mapLocation || "");
    if (shop.mapLocation && !target && savedMapLink(shop.mapLocation)) { flush(); result.push(shopDirections(shop)); start = ""; continue; }
    const next = target || [shop.shopName, shop.address, shop.location].filter(Boolean).join(", ");
    if (encodeURIComponent([...group, next].join("|")).length > 1300) flush();
    group.push(next);
    if (group.length === 4) flush();
  }
  flush(); return result;
}
