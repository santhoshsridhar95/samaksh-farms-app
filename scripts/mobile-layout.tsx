// Development-only fixture. No production API calls or writes are made.
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import api from "../src/admin/services/api";
import MoneyPage from "../src/admin/pages/MoneyPage";
import SalesPage from "../src/admin/pages/SalesPage";
import FarmOperationsPage from "../src/admin/pages/FarmOperationsPage";
import SourcingPage from "../src/admin/pages/SourcingPage";
import EmployeesPage from "../src/admin/pages/EmployeesPage";
import OrderPage from "../src/admin/pages/OrderPage";
import DashboardPage from "../src/admin/pages/DashBoardPage";
import UserManagementPage from "../src/admin/pages/UserManagementPage";
import AuditTrailPage from "../src/admin/pages/AuditTrailPage";
import ReviewManagementPage from "../src/admin/pages/ReviewManagementPage";
import ProductPricingPage from "../src/admin/pages/ProductPricingPage";
import ServerKeepAlivePage from "../src/admin/pages/ServerKeepAlivePage";
import RetroDataPage from "../src/admin/pages/RetroDataPage";
import "../src/index.css";

localStorage.setItem("token", "isolated-layout-fixture");
localStorage.setItem("roles", '["SUPER_ADMIN"]');
localStorage.setItem("role", "SUPER_ADMIN");
localStorage.setItem("userName", "Mobile layout reviewer with a long name");
localStorage.setItem("loginAt", String(Date.now()));
const date = new Intl.DateTimeFormat("en-CA", {timeZone: "Asia/Kolkata"}).format(new Date());
const shops = [{id: 1, customerName: "Sri Lakshmi Fresh Vegetables and Mushroom Supermarket", shopCategory: "Vegetable Shop", location: "R.T. Nagar", minimumBoxesPerDay: 10, defaultBoxPrice: 50, active: true, products: ["Oyster Mushroom"], address: "Very long address near the main market, Bengaluru", phoneNumber: "9999999999", email: "long-shop-contact@example.test"}];
const accounts = [{id: 1, name: "Farm bank account with a long holder name", kind: "BANK", balance: 100000}, {id: 2, name: "Personal pocket with a long employee name", kind: "PERSONAL", balance: -500}];
const employee = {id: 1, name: "Employee with a long full name", designation: "Delivery and harvest coordinator", responsibilities: "Coordinates shops and daily deliveries", joinedOn: "2026-01-01", active: true, version: 0};
const batch = {id: 1, batchCode: "OYSTER-2026-VERY-LONG-BATCH-REFERENCE", mushroomType: "OYSTER", bagsUsed: 100, spawnUsed: 20, pelletsUsed: 50, darkRoomBags: 40, lightRoomBags: 60, contaminatedBags: 0, discardedBags: 0, startDate: date, status: "ACTIVE"};
const sale = {id: 1, customerId: 1, customerName: shops[0].customerName, productName: "Oyster Mushroom", quantity: 10, unitPrice: 50, totalAmount: 500, amountCollected: 300, pendingAmount: 200, saleDate: date + "T09:00:00", exchangeType: "NONE", status: "PARTIAL"};
if(new URLSearchParams(location.search).get("collection")==="true")Object.assign(sale,{salesChannel:"COLLECTION",productName:"Balance collection",quantity:0,totalAmount:0,amountCollected:0,amountReceivedToday:200,pendingAmount:0,status:"PAID"});
const page = (content: unknown[]) => ({content, totalPages: 1, totalElements: content.length, last: true});
api.defaults.adapter = async config => {
  if (new URLSearchParams(location.search).get("test") === "funding") {
    const state = window as typeof window & {fundingCalls?: {url: string; body: any}[]; fundingFailure?: boolean};
    if (config.method === "post" && ["/api/money/entries", "/api/money/entries/split", "/api/sourcing/payments", "/api/sourcing/payments/split"].includes(config.url || "")) {
      const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
      (state.fundingCalls ||= []).push({url: config.url!, body});
      await new Promise(resolve => setTimeout(resolve, 600));
      if (state.fundingFailure) throw Object.assign(new Error("Simulated failure"), {config, response: {status:400, data:{message:"Simulated funding rejection"}}});
      const original = body.entry || body.payment || body;
      const data = body.sources ? body.sources.map((source: any, i: number) => ({...original, id:100+i, sourceId:source.accountId, sourceAccountId:source.accountId, amount:source.amount})) : {...original,id:100};
      return {data:{success:true,data},status:200,statusText:"OK",headers:{},config};
    }
    if (config.method === "get" && config.url === "/api/sourcing") {
      return {data:{success:true,data:{accounts, vendors:[{id:1,name:"Fixture vendor",kind:"VENDOR",active:true}],receipts:[{
        receipt:{id:1,vendorId:1,date,product:"Mushrooms",quantityKg:10,boxes:50,costPerKg:100,transportCost:0,otherCost:0,expensesBorneBy:"VENDOR",expensesPaidBy:"VENDOR"},
        vendorName:"Fixture vendor",kind:"VENDOR",costs:{deduction:0,payable:1000},paid:0,balanceDue:1000
      }],payments:[],recoveries:[],sellingPricePerKg:250}},status:200,statusText:"OK",headers:{},config};
    }
  }
  if (config.method !== "get") {
    if(new URLSearchParams(location.search).get("test")!=="sale-edit" || config.method!=="put" || config.url!=="/api/sales/1/entry") throw new Error("Layout fixtures never save data");
    const state=window as typeof window & {fixtureEditCalls?:number;fixtureEditFailure?:boolean};
    state.fixtureEditCalls=(state.fixtureEditCalls||0)+1;
    await new Promise(resolve=>setTimeout(resolve,800));
    if(state.fixtureEditFailure)throw Object.assign(new Error("Simulated save failure"),{config,response:{status:400,data:{message:"Simulated correction rejection"}}});
    const body=typeof config.data==="string"?JSON.parse(config.data):config.data;
    Object.assign(sale,body,{totalAmount:body.quantity*body.unitPrice});
    return {data:{success:true,data:{...sale}},status:200,statusText:"OK",headers:{},config};
  }
  const path = (config.url || "").split("?")[0];
  const fixtures: Record<string, unknown> = {
    "/api/customers": page(shops), "/api/sales": page([sale]), "/api/users": [{id:1,name:employee.name,email:"long-employee-contact@example.test",roles:["SALES_EMPLOYEE"],role:"SALES_EMPLOYEE",active:true}],
    "/api/products": [{id: 1, productName: "Oyster Mushroom", name: "Oyster Mushroom", price: 50, active: true}],
    "/api/sales/planning-history": {today: date, from: "2026-01-01", days: [{date, customerId: 1, product: "Oyster Mushroom", boxes: 10, exchanges: 0, returns: 0}]},
    "/api/direct-sales/customers": shops, "/api/direct-sales": [sale],
    "/api/money": {accounts, entries: [{id: 1, type: "OPENING", destinationId: 1, amount: 100000, date, description: "Opening", recordedBy: "fixture@example.test"}], reconciliationRequired: false},
    "/api/employees": {employees: [employee], salaries: [{id: 1, employeeId: 1, effectiveMonth: "2026-01", amount: 18000}]},
    "/api/sourcing": {vendors: [], receipts: [], payments: [], recoveries: [], accounts, sellingPricePerKg: 250},
    "/api/production": [batch], "/api/harvest": [], "/api/orders": page([]),
    "/api/inventory-options": [{id: "spawn", category: "ITEM", code: "SPAWN", label: "Oyster mushroom spawn", unit: "kg", active: true}],
    "/api/inventory-transactions": [{id: 1, inventoryType: "SPAWN", transactionType: "PURCHASE", quantity: 30, remarks: "Sample stock", transactionDate: date, createdByEmail: "fixture@example.test"}],
    "/api/farm-dashboard": {},
    "/api/sourcing/report": {days: [], totals: {}, previousTotals: {}, receipts: [], sales: [], expenses: [], recoverable: 0},
    "/api/server/keep-awake": {enabled:false,intervalMinutes:10,targetUrl:"https://example.test/health"},
    "/api/retro-import/modules": [{id:"MONEY",label:"Money & Expenses",help:"Sample historical data"}],
    "/api/retro-import/MONEY/schema": {fields:[{name:"externalReference",type:"STRING",required:true,choices:[],defaultValue:""},{name:"description",type:"STRING",required:true,choices:[],defaultValue:""}],lookups:{},help:"Fixture records only"},
  };
  return {data: {success: true, data: fixtures[path] ?? []}, status: 200, statusText: "OK", headers: {}, config};
};
const views: Record<string, React.ComponentType> = {money: MoneyPage, sales: SalesPage, farm: FarmOperationsPage, sourcing: SourcingPage, employees: EmployeesPage, orders: OrderPage, dashboard:DashboardPage, users:UserManagementPage, audit:AuditTrailPage, reviews:ReviewManagementPage, prices:ProductPricingPage, server:ServerKeepAlivePage, historical:RetroDataPage};
const View = views[new URLSearchParams(location.search).get("view") || "money"] || MoneyPage;
createRoot(document.getElementById("root")!).render(<BrowserRouter><View /></BrowserRouter>);
