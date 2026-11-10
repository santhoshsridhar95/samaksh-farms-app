import type { MoneyEntry } from "./moneyMonthly";
export type Employee = { id: number; name: string; designation: string; responsibilities: string; userId?: number; joinedOn: string; leftOn?: string; active: boolean; version: number };
export type Salary = { id: number; employeeId: number; effectiveMonth: string; amount: number; updatedBy: string };
export type EmployeeDirectory = { employees: Employee[]; salaries: Salary[] };
export function salaryAt(salaries: Salary[], id: number, month: string) {
  return Number(salaries.filter(s => s.employeeId === id && s.effectiveMonth <= month).sort((a,b) => b.effectiveMonth.localeCompare(a.effectiveMonth))[0]?.amount || 0);
}
export const workLabels: Record<string,string> = { BAGGING: "Bags prepared", HARVEST_KG: "Harvest (kg)", DELIVERY_BOXES: "Boxes delivered", SHOP_SETUP: "Shops set up", HOURS: "Hours worked", OTHER: "Other contribution (count)" };

export function salarySummary(employee: Employee, salaries: Salary[], entries: MoneyEntry[], month: string) {
 const employed = employee.joinedOn.slice(0,7) <= month && (!employee.leftOn || employee.leftOn.slice(0,7) >= month);
 const salary = employed ? salaryAt(salaries,employee.id,month) : 0;
 const paidCents = entries.filter(e=>e.employeeId===employee.id && e.salaryMonth===month).reduce((n,e)=>n+(e.type==="SALARY"?1:e.type==="REVERSAL"?-1:0)*Math.round(Number(e.amount)*100),0);
 const remainingCents = Math.round(salary*100)-paidCents;
 return {salary,paid:paidCents/100,remaining:Math.max(0,remainingCents)/100,overpaid:Math.max(0,-remainingCents)/100};
}
