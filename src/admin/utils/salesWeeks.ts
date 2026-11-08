import type { ShopPriceLine } from "./shopPrices";
export function shiftDate(date:string,days:number){const d=new Date(date+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
export function calendarWeek(date:string){const weekday=new Date(date+"T12:00:00Z").getUTCDay();const from=shiftDate(date,-((weekday+6)%7));return {from,to:shiftDate(from,6)};}
export function weeklySales(lines:ShopPriceLine[],from:string){
 const daily=Array.from({length:7},(_,i)=>{const date=shiftDate(from,i),previousDate=shiftDate(date,-7);const rows=lines.filter(l=>l.date===date),previous=lines.filter(l=>l.date===previousDate);const total=(items:ShopPriceLine[])=>items.reduce((n,l)=>n+Math.round(Number(l.revenue)*100),0)/100;return {date,revenue:total(rows),previousRevenue:total(previous),boxes:rows.filter(l=>l.unit==="BOX").reduce((n,l)=>n+Number(l.quantity),0),kg:rows.filter(l=>l.unit==="KG").reduce((n,l)=>n+Number(l.quantity),0),buyers:new Set(rows.map(l=>l.customerId??l.shop)).size};});
 const current=lines.filter(l=>!!l.date&&l.date>=from&&l.date<=shiftDate(from,6));
 const grouped=new Map<string,{key:string;shop:string;location:string;revenue:number;previous:number;deliveries:number}>();
 for(const l of lines){if(!l.date||l.date<shiftDate(from,-7)||l.date>shiftDate(from,6))continue;const key=String(l.customerId??l.shop);let row=grouped.get(key);if(!row){row={key,shop:l.shop,location:l.location||"Unspecified",revenue:0,previous:0,deliveries:0};grouped.set(key,row);}if(l.date>=from){row.revenue+=Number(l.revenue);row.deliveries++;}else row.previous+=Number(l.revenue);}
 return {daily,current,revenue:daily.reduce((n,d)=>n+Math.round(d.revenue*100),0)/100,previousRevenue:daily.reduce((n,d)=>n+Math.round(d.previousRevenue*100),0)/100,shops:[...grouped.values()].sort((a,b)=>b.revenue-a.revenue)};
}
