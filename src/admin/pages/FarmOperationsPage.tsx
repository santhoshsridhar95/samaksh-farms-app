import HistoricalDataLink from "../components/HistoricalDataLink";
import InventoryPage from "./InventoryPage";
import { useSearchParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { PageHeader } from "../components/AdminUI";
import ProductionPage from "./ProductionPage";
import RoomTransferPage from "./RoomTransferPage";
import HarvestPage from "./HarvestPage";
import "./MoneyPage.css";
export default function FarmOperationsPage(){
 const [params,setParams]=useSearchParams();const tab=params.get("tab")||"production";
 return <AdminLayout><PageHeader title="Farm Operations" subtitle="Inventory, production, room transfers and harvest in one place."/><div className="money-actions" role="tablist" aria-label="Farm operations">{[["inventory","Inventory"],["production","Production"],["rooms","Room Transfer"],["harvest","Harvest"]].map(([key,label])=><button key={key} role="tab" aria-selected={tab===key} className={'admin-button '+(tab===key?'':'admin-button-secondary')} onClick={()=>setParams({tab:key})}>{label}</button>)}</div><HistoricalDataLink module={tab==="inventory"?"INVENTORY":tab==="rooms"?"ROOM_TRANSFER":tab==="harvest"?"HARVEST":"PRODUCTION"}/><div role="tabpanel">{tab==="inventory"?<InventoryPage embedded/>:tab==="rooms"?<RoomTransferPage embedded/>:tab==="harvest"?<HarvestPage embedded/>:<ProductionPage embedded/>}</div></AdminLayout>;
}
