import { Link } from "react-router-dom";
import { getStoredRoles } from "../../routes/authSession";
export default function HistoricalDataLink({module}:{module:string}){return getStoredRoles().includes("SUPER_ADMIN")?<div className="money-actions"><Link className="admin-button admin-button-secondary" to={'/admin/historical-data?module='+module}>Add historical data / Excel import</Link></div>:null;}
