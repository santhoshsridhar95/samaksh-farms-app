import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function loadTs(file, extra = {}) {
  const source = ts.transpileModule(fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const context = { exports: {}, ...extra };
  vm.runInNewContext(source, context, { filename: file });
  return context.exports;
}

test('Save remains enabled until native form submission; request then locks and releases it', () => {
  const listeners = {};
  let request, success;
  const client = { interceptors: { request: { use(fn) { request = fn; } }, response: { use(fn) { success = fn; } } } };
  class Element { closest() { return this; } }
  const button = new Element();
  Object.assign(button, { type: 'submit', form: {}, disabled: false, dataset: {}, setAttribute() {}, removeAttribute() {} });
  const overlay = { removeAttribute() {}, setAttribute() {} };
  loadTs('src/admin/services/api.ts', {
    Element,
    document: { addEventListener(type, fn) { listeners[type] = fn; }, getElementById() { return overlay; } },
    window: { setTimeout() { return 1; }, clearTimeout() {} },
    require(name) {
      if (name.includes('readCache')) return loadTs('src/admin/services/readCache.ts');
      if (name === 'axios') return { __esModule: true, default: { create: () => client } };
      if (name.includes('authSession')) return { getActiveSession: () => ({ token: 'test' }), clearSession() {} };
      return { API_BASE_URL: 'http://test', AUTH_CONFIG: {} };
    },
  });
  listeners.click({ target: button });
  assert.equal(button.disabled, false, 'disabling during capture cancels form submission');
  button.type = 'button'; button.form = null;
  listeners.click({ target: button });
  assert.equal(button.disabled, false, 'capture must not suppress a React onClick handler');
  listeners.submit();
  const config = request({ method: 'post', url: '/api/direct-sales', headers: {}, data: { customerName: 'Customer A' } });
  assert.equal(button.disabled, true);
  assert.equal(button.dataset.apiMutationPending, 'true');
  success({ config });
  assert.equal(button.disabled, false);
});

const customerTools = loadTs('src/admin/utils/directSaleCustomers.ts');
const customers = [
  { id: 1, customerName: 'Customer A', phoneNumber: '+91 98765 43210', email: 'a@example.com' },
  { id: 2, customerName: 'Customer A', phoneNumber: '9123456780', email: 'b@example.com' },
];
test('returning customer search finds name, formatted phone and case-insensitive email', () => {
  assert.equal(customerTools.findCustomers(customers, 'customer a').length, 2);
  assert.equal(customerTools.findCustomers(customers, '9876543210')[0].id, 1);
  assert.equal(customerTools.findCustomers(customers, 'A@EXAMPLE.COM')[0].id, 1);
});
test('exact contact match reuses one customer but never silently merges ambiguous contacts', () => {
  assert.equal(customerTools.exactContactMatch(customers, '98765 43210', '')?.id, 1);
  assert.equal(customerTools.exactContactMatch(customers, '', 'B@example.com')?.id, 2);
  assert.equal(customerTools.exactContactMatch(customers, '9876543210', 'b@example.com'), undefined);
});

const { monthlyMoney } = loadTs('src/admin/utils/moneyMonthly.ts');
const accounts = [{ id: 1, name: 'Santosh', kind: 'HELD' }, { id: 2, name: 'Bank', kind: 'BANK' }, { id: 3, name: 'Pocket', kind: 'PERSONAL' }];
const entries = [
  { id: 1, type: 'COLLECTION', destinationId: 1, amount: 500, date: '2026-10-31' },
  { id: 2, type: 'EXPENSE', sourceId: 1, amount: 100, date: '2026-11-01' },
  { id: 3, type: 'TRANSFER', sourceId: 1, destinationId: 2, amount: 400, date: '2026-11-02' },
  { id: 4, type: 'SALARY', sourceId: 3, amount: 1000, date: '2026-11-03' },
  { id: 5, type: 'REVERSAL', destinationId: 1, reversalOf: 2, amount: 100, date: '2026-12-01' },
];
test('month opening carries forward and full transfer clears holder without inflating expenditure', () => {
  const month = monthlyMoney(accounts, entries, '2026-11');
  assert.equal(month.rows[0].opening, 500);
  assert.equal(month.rows[0].closing, 0);
  assert.equal(month.rows[1].closing, 400);
  assert.equal(month.expenses, 100);
  assert.equal(month.salaries, 1000);
  assert.equal(month.closing, 400);
});
test('later reversal does not retroactively erase the earlier month expense', () => {
  assert.equal(monthlyMoney(accounts, entries, '2026-11').expenses, 100);
  assert.equal(monthlyMoney(accounts, entries, '2026-12').expenses, -100);
});

const { summarizeShopPrices } = loadTs('src/admin/utils/shopPrices.ts');
test('shop effective prices weight delivery quantities and include exchange credits once',()=>{
 const base={customerId:1,shop:'A',location:'Town',unit:'BOX',exchangeBoxes:0,exchangeCredit:0,collected:0,pending:0};
 const [r]=summarizeShopPrices([{...base,saleId:1,quantity:10,grossValue:500,revenue:400,exchangeBoxes:2,exchangeCredit:100},{...base,saleId:2,quantity:30,grossValue:1800,revenue:1800}]);
 assert.equal(r.quotedAverage,57.5);assert.equal(r.effectiveAverage,55);assert.equal(r.exchangeCredit,100);assert.equal(r.exchangeRate,5);assert.equal(r.priceReduction,2.5);
});
test('shop averages never mix boxes and kilograms or divide zero quantities',()=>{
 const base={customerId:1,shop:'A',location:'Town',exchangeBoxes:0,exchangeCredit:0,collected:0,pending:0};
 const rows=summarizeShopPrices([{...base,unit:'BOX',quantity:10,grossValue:500,revenue:400},{...base,unit:'KG',quantity:2,grossValue:500,revenue:500},{...base,customerId:2,unit:'BOX',quantity:0,grossValue:0,revenue:0}]);
 assert.equal(rows.length,3);assert.equal(rows[0].effectiveAverage,40);assert.equal(rows[1].effectiveAverage,250);assert.equal(rows[2].effectiveAverage,0);
});

const { createReadCache } = loadTs('src/admin/services/readCache.ts');
test('read cache shares in-flight reads and expires cached values',async()=>{
 let time=0,calls=0;const cache=createReadCache(()=>time);const fetch=async()=>++calls;
 const results=await Promise.all([cache.read('a',fetch,15),cache.read('a',fetch,15)]);assert.deepEqual(results,[1,1]);assert.equal(calls,1);assert.equal(await cache.read('a',fetch,15),1);time=16;assert.equal(await cache.read('a',fetch,15),2);
});
test('invalidated in-flight results cannot repopulate the read cache',async()=>{
 const cache=createReadCache();let finish;const old=cache.read('a',()=>new Promise(resolve=>finish=resolve));await Promise.resolve();cache.clear();assert.equal(await cache.read('a',async()=>2),2);finish(1);await old;assert.equal(await cache.read('a',async()=>3),2);
});
test('failed reads are retried rather than cached',async()=>{
 const cache=createReadCache();await assert.rejects(cache.read('a',async()=>{throw Error('offline')}));assert.equal(await cache.read('a',async()=>4),4);
});
const { calendarWeek,shiftDate,weeklySales }=loadTs('src/admin/utils/salesWeeks.ts');
test('historical date selection uses Monday to Sunday even across month and year boundaries',()=>{
 assert.equal(calendarWeek('2026-11-01').from,'2026-10-26');assert.equal(calendarWeek('2026-11-01').to,'2026-11-01');assert.equal(shiftDate('2026-01-01',-7),'2025-12-25');
});
test('selected week and comparisons retain cents and trace all matching sale IDs',()=>{
 const base={customerId:1,shop:'A',location:'Town',unit:'BOX',quantity:2};
 const r=weeklySales([{...base,saleId:1,date:'2026-07-06',revenue:100.25},{...base,saleId:2,date:'2026-06-29',revenue:50.10},{...base,saleId:3,date:'2026-07-12',revenue:25.25},{...base,saleId:4,date:'2026-07-13',revenue:999}],'2026-07-06');
 assert.equal(r.revenue,125.5);assert.equal(r.previousRevenue,50.1);assert.equal(r.daily.length,7);assert.deepEqual(Array.from(r.current,l=>l.saleId),[1,3]);assert.equal(r.shops[0].deliveries,2);
});

test('Funding choices distinguish available farm cash from personal amounts owed',()=>{
 const {fundingAccountLabel}=loadTs('src/admin/utils/fundingAccounts.ts');
 const personal=fundingAccountLabel({id:1,name:'Santosh — Personal pocket',kind:'PERSONAL',balance:-500});
 assert.match(personal,/Santosh — Personal funds/);assert.equal(personal.includes('Personal pocket'),false);assert.match(personal,/Owed.*500/);assert.equal(personal.includes('Available'),false);
 assert.match(fundingAccountLabel({id:2,name:'Sandeep',kind:'HELD',balance:1200}),/Available.*1,200/);
});

test('Role navigation limits sales staff and farm employees to their workspaces',()=>{
 const {canAccessSection,salesTabsForRoles,landingPage}=loadTs('src/routes/roleAccess.ts');
 for(const role of ['SALES_EMPLOYEE','SALES_USER']){assert.deepEqual(Array.from(salesTabsForRoles([role]),t=>t.id),['delivery','planning','direct']);assert.equal(canAccessSection([role],'money'),false);assert.equal(canAccessSection([role],'employees'),false);assert.equal(canAccessSection([role],'farm-operations'),false);assert.equal(landingPage([role]),'/admin/sales');}
 assert.deepEqual(Array.from(salesTabsForRoles(['SALES_ADMIN']),t=>t.id),['delivery','planning','direct','allocation','shops']);
 for(const role of ['FARM_MANAGER','LABOUR']){assert.equal(canAccessSection([role],'farm-operations'),true);assert.equal(canAccessSection([role],'sales'),false);assert.equal(canAccessSection([role],'dashboard'),false);assert.equal(landingPage([role]),'/admin/farm-operations');}
 assert.equal(canAccessSection(['FARM_MANAGER','SALES_ADMIN'],'sales'),true);assert.equal(canAccessSection(['FARM_MANAGER','SALES_ADMIN'],'farm-operations'),true);assert.equal(canAccessSection(['SUPER_ADMIN'],'money'),true);assert.equal(canAccessSection(['SUPER_ADMIN'],'employees'),true);assert.equal(salesTabsForRoles(['SUPER_ADMIN']).length,8);
});
test('Repaying personal funds reduces debt without inflating monthly expenditure',()=>{
 const {monthlyMoney}=loadTs('src/admin/utils/moneyMonthly.ts');
 const result=monthlyMoney([{id:1,name:'Farm',kind:'BANK',balance:800},{id:2,name:'Santosh',kind:'PERSONAL',balance:-300}],[{id:1,type:'OPENING',destinationId:1,amount:1000,date:'2026-10-01'},{id:2,type:'EXPENSE',sourceId:2,amount:500,date:'2026-10-02'},{id:3,type:'REIMBURSEMENT',sourceId:1,destinationId:2,amount:200,date:'2026-11-01'}],'2026-11');
 assert.equal(result.expenses,0);assert.equal(result.rows[1].closing,-300);assert.equal(result.closing,800);
});


test('Actual balance corrections reset cash without changing historical income or expenses',()=>{
 const {monthlyMoney}=loadTs('src/admin/utils/moneyMonthly.ts');
 const entries=[{id:1,type:'LEGACY_COLLECTION',destinationId:1,amount:15000,date:'2026-10-01'},{id:2,type:'BALANCE_ADJUSTMENT',sourceId:1,amount:15000,date:'2026-11-10'},{id:3,type:'COLLECTION',destinationId:1,amount:300,date:'2026-11-11'}];
 const result=monthlyMoney([{id:1,name:'Holder',kind:'HELD'}],entries,'2026-11');
 assert.equal(result.rows[0].opening,15000);assert.equal(result.rows[0].adjustments,-15000);assert.equal(result.rows[0].paid,0);assert.equal(result.rows[0].closing,300);assert.equal(result.expenses,0);assert.equal(result.collections,300);
 assert.equal(monthlyMoney([{id:1,name:'Holder',kind:'HELD'}],entries,'2026-10').closing,15000);
});
test('Personal contributions add farm funds and a repayable liability without income or spending',()=>{
 const {monthlyMoney}=loadTs('src/admin/utils/moneyMonthly.ts');
 const result=monthlyMoney([{id:1,name:'Pocket',kind:'PERSONAL'},{id:2,name:'Sandeep',kind:'HELD'}],[{id:1,type:'CONTRIBUTION',sourceId:1,destinationId:2,amount:500,date:'2026-11-10'}],'2026-11');
 assert.equal(result.closing,500);assert.equal(result.rows[0].current,-500);assert.equal(result.collections,0);assert.equal(result.expenses,0);
});

const { fundingSources } = loadTs('src/admin/utils/splitFunding.ts');
test('split funding preserves exact cents, validates totals and removes deselected accounts', () => {
 const selection = {'1':'0.10', '2':'0.20'};
 assert.equal(JSON.stringify(fundingSources(selection,'0.30')),JSON.stringify([{accountId:1,amount:0.1},{accountId:2,amount:0.2}]));
 delete selection['1'];
 assert.equal(fundingSources(selection,'0.20').length,1);
 assert.throws(()=>fundingSources(selection,'0.30'),/equal/);
 assert.throws(()=>fundingSources({'2':'0'},'0'),/positive/);
 assert.throws(()=>fundingSources({'2':'1.001'},'1.001'),/decimal/);
 assert.throws(()=>fundingSources({},'5'),/Choose/);
});
