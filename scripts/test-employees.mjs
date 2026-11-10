import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const output = ts.transpileModule(fs.readFileSync('src/admin/utils/employees.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const context={exports:{}};vm.runInNewContext(output,context);
const {salarySummary,salaryAt}=context.exports;
const employee={id:1,joinedOn:'2026-01-12'};
const salaries=[{employeeId:1,effectiveMonth:'2026-01',amount:10000},{employeeId:1,effectiveMonth:'2026-06',amount:12000}];
test('effective salary preserves earlier rates and excludes other employees',()=>{
 assert.equal(salaryAt([...salaries,{employeeId:2,effectiveMonth:'2026-05',amount:999}],1,'2026-05'),10000);
 assert.equal(salaryAt(salaries,1,'2026-06'),12000);
});
test('salary balance includes cross-date installments and reversals but excludes expenses',()=>{
 const base={employeeId:1,salaryMonth:'2026-05',date:'2026-06-03'};
 const result=salarySummary(employee,salaries,[{...base,type:'SALARY',amount:6000},{...base,type:'SALARY',amount:2000},{...base,type:'REVERSAL',amount:1000},{...base,type:'EXPENSE',amount:500},{...base,employeeId:2,type:'SALARY',amount:10000}],'2026-05');
 assert.equal(result.paid,7000);assert.equal(result.remaining,3000);assert.equal(result.overpaid,0);
});
test('overpayments are visible and salaries stop after leaving month',()=>{
 assert.equal(salarySummary(employee,salaries,[{employeeId:1,salaryMonth:'2026-05',type:'SALARY',amount:12000}],'2026-05').overpaid,2000);
 assert.equal(salarySummary({...employee,leftOn:'2026-05-14'},salaries,[],'2026-06').salary,0);
});
