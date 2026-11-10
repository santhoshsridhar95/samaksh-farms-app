import { useState } from "react";
import { routeSections, shopDirections } from "../utils/shopNavigation";

export default function ManualDeliveryRoutes({shops, origin}: {shops: any[]; origin: string}) {
  const [routes, setRoutes] = useState<string[][]>([[]]);
  const [selected, setSelected] = useState(0);
  const [search, setSearch] = useState("");
  const [names, setNames] = useState<Record<number, string>>({});
  const select = (ids: string[], checked: boolean) => setRoutes(current => current.map((route, i) => i === selected && checked ? [...route.filter(id => !ids.includes(id)), ...ids] : i === selected || checked ? route.filter(id => !ids.includes(id)) : route));
  const move = (route: number, index: number, offset: number) => setRoutes(current => current.map((ids, i) => {
    if (i !== route) return ids;
    const next = [...ids]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; return next;
  }));
  const unassigned = shops.filter(s => s.allocatedBoxes > 0 && !routes.some(ids => ids.includes(String(s.shopId))));
  return <div>
    <p>Select shops, whole areas, or a combination. A shop belongs to one route. Prospective shops are zero-box visit stops. This plan remains on this screen until you leave; share it before leaving.</p>
    <label>Route to edit <select value={selected} onChange={e => setSelected(Number(e.target.value))}>{routes.map((_, i) => <option key={i} value={i}>Route {i + 1}</option>)}</select></label>
    <button type="button" className="admin-button admin-button-secondary" onClick={() => {setRoutes(r => [...r, []]); setSelected(routes.length);}}>Add route</button>
    <div className="route-option-grid">{[...new Set<string>(shops.map(s => s.location))].map(location => {
      const ids = shops.filter(s => s.location === location).map(s => String(s.shopId));
      return <label className="route-option-card" key={location}><input type="checkbox" checked={ids.every(id => routes[selected].includes(id))} onChange={e => select(ids, e.target.checked)} />Area: {location || "Unspecified"}</label>;
    })}</div>
    <label>Find shops or areas <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or location" /></label>
    <div className="sales-table-wrap"><table className="admin-data-table"><thead><tr><th>Select</th><th>Shop</th><th>Area</th><th>Boxes</th><th>Assigned route</th></tr></thead><tbody>{shops.filter(shop => `${shop.shopName} ${shop.location}`.toLowerCase().includes(search.trim().toLowerCase())).map(shop => <tr key={shop.shopId}><td><input aria-label={`Select ${shop.shopName}`} type="checkbox" checked={routes[selected].includes(String(shop.shopId))} onChange={e => select([String(shop.shopId)], e.target.checked)} /></td><td>{shop.shopName}</td><td>{shop.location}</td><td>{shop.allocatedBoxes || "Visit"}</td><td>{routes.findIndex(ids => ids.includes(String(shop.shopId))) + 1 || "Unassigned"}</td></tr>)}</tbody></table></div>
    <p role="status">{unassigned.length} allocated shops still unassigned ({unassigned.reduce((n, s) => n + s.allocatedBoxes, 0)} boxes).</p>
    <div className="sales-route-grid">{routes.map((ids, routeIndex) => {
      const stops = ids.map(id => shops.find(s => String(s.shopId) === id)).filter(Boolean);
      const links = routeSections(origin, stops);
      const text = [`Route ${routeIndex + 1}${names[routeIndex] ? " — " + names[routeIndex] : ""}`, `Start: ${origin}`, "Follow stops in numbered order.", ...stops.map((s, i) => `${i + 1}. ${s.shopName} · ${s.allocatedBoxes} boxes\n${shopDirections(s)}`), ...links.map((link, i) => `Section ${i + 1}: ${link}`)].join("\n\n");
      return <div className="sales-route-card" key={routeIndex}><h3>Route {routeIndex + 1} · {stops.length} stops · {stops.reduce((n, s) => n + s.allocatedBoxes, 0)} boxes</h3>
        <label>Delivery partner / employee <input value={names[routeIndex] || ""} onChange={e => setNames(n => ({...n, [routeIndex]: e.target.value}))} placeholder="Name (optional)" /></label>
        <ol className="sales-route-stops">{stops.map((shop, i) => <li key={shop.shopId}><strong>{shop.shopName}</strong><span>{shop.location} · {shop.allocatedBoxes} boxes</span><a href={shopDirections(shop)} target="_blank" rel="noreferrer">Navigate to shop</a>{!shop.mapLocation && <small>Address-based destination; confirm pin</small>}<span><button type="button" aria-label={`Move ${shop.shopName} earlier`} disabled={i === 0} onClick={() => move(routeIndex, i, -1)}>↑</button><button type="button" aria-label={`Move ${shop.shopName} later`} disabled={i === stops.length - 1} onClick={() => move(routeIndex, i, 1)}>↓</button></span></li>)}</ol>
        {links.map((url, i) => <a className="admin-action-button" key={i} href={url} target="_blank" rel="noreferrer">Directions section {i + 1}</a>)}
        {stops.length > 0 && <a className="admin-button" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">Share via WhatsApp</a>}
      </div>;
    })}</div>
  </div>;
}
