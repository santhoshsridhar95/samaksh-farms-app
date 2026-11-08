export const adminRoles=["SUPER_ADMIN"];
export const farmRoles=["SUPER_ADMIN","FARM_MANAGER","LABOUR"];
export const salesRoles=["SUPER_ADMIN","SALES_ADMIN","SALES_EMPLOYEE","SALES_USER"];
export function canAccessSection(roles:string[],section:string){
 const allowed=section==="farm-operations"?farmRoles:section==="sales"?salesRoles:adminRoles;
 return roles.some(r=>allowed.includes(r));
}
export function salesTabsForRoles(roles:string[]){
 if(!canAccessSection(roles,"sales"))return [];
 const tabs=[{id:"delivery",label:"Delivery Entry"},{id:"planning",label:"Sales Planning"},{id:"direct",label:"Direct Sales"}];
 if(roles.some(r=>["SUPER_ADMIN","SALES_ADMIN"].includes(r)))tabs.push({id:"allocation",label:"Box Allocation"},{id:"shops",label:"Shop Setup"});
 if(roles.includes("SUPER_ADMIN"))tabs.push({id:"collections",label:"Collections"},{id:"ledger",label:"Sales Ledger"},{id:"history",label:"Shop History"});
 return tabs;
}
export function landingPage(roles:string[]){
 if(roles.includes("SUPER_ADMIN"))return "/admin/dashboard";
 if(canAccessSection(roles,"sales"))return "/admin/sales";
 if(canAccessSection(roles,"farm-operations"))return "/admin/farm-operations";
 return "/login";
}
