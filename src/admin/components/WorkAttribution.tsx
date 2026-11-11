import { useEffect, useState } from "react";
import { Field } from "./AdminUI";
import api from "../services/api";
import { getStoredRoles } from "../../routes/authSession";
import type { Employee } from "../utils/employees";
export function WorkAttribution({value,onChange}:{value:string;onChange:(id:string)=>void}) {
 const [employees,setEmployees]=useState<Employee[]>([]),[error,setError]=useState(false);
 const admin=getStoredRoles().includes("SUPER_ADMIN");
 useEffect(()=>{if(admin)api.get("/api/employees").then(r=>setEmployees(r.data.data.employees)).catch(()=>setError(true));},[admin]);
 if(!admin)return null;
 return <Field label="Work done by"><select value={value} onChange={e=>onChange(e.target.value)}><option value="">Unassigned — select employee</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name}{!e.active?" (inactive)":""}</option>)}</select>{error&&<small role="alert">Could not load employees. Reopen this form to retry.</small>}<small>Credits this employee’s performance. The signed-in user remains the recorder.</small></Field>;
}
export function WorkerName({id}:{id?:number}) {
 const [employees,setEmployees]=useState<Employee[]>([]);
 const admin=getStoredRoles().includes("SUPER_ADMIN");
 useEffect(()=>{if(admin)api.get("/api/employees").then(r=>setEmployees(r.data.data.employees)).catch(()=>{});},[admin]);
 return <>{id?(employees.find(e=>e.id===id)?.name||("Employee #"+id)):"Unassigned"}</>;
}
