// Run against a local Vite server. Uses an isolated Chrome profile, synthetic API
// fixtures, and CDP viewport emulation; never signs into or writes to the backend.
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const base = process.env.LAYOUT_TEST_URL || 'http://127.0.0.1:5187';
const server = process.env.LAYOUT_TEST_URL ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5187', '--strictPort'], {windowsHide: true, stdio:'ignore'});
for(let attempt = 0; attempt < 100; attempt++) {
  try {if((await fetch(base + '/scripts/mobile-layout.html')).ok) break;} catch {}
  if(attempt === 99) {server?.kill(); throw new Error('Local fixture server did not start');}
  await new Promise(resolve => setTimeout(resolve, 100));
}
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile = await mkdtemp(path.join(tmpdir(), 'samaksh-mobile-'));
const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], {windowsHide: true, stdio: ['ignore', 'ignore', 'pipe']});
let stderr = '';
const endpoint = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('Chrome did not start')), 15000);
  chrome.on('error', reject);
  chrome.stderr.on('data', chunk => {stderr += chunk; const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/); if(match) { clearTimeout(timer); resolve(match[1]); }});
});
const ws = new WebSocket(endpoint);
await new Promise((resolve, reject) => {ws.onopen = resolve; ws.onerror = reject;});
let sequence = 0;
const pending = new Map();
const errors = [];
ws.onmessage = event => {const message = JSON.parse(event.data); if(message.id) {const p = pending.get(message.id); pending.delete(message.id); if(message.error) p.reject(new Error(message.error.message)); else p.resolve(message.result);} else if(message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text + ': ' + (message.params.exceptionDetails.exception?.description || ''));};
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {const id = ++sequence; pending.set(id, {resolve, reject}); ws.send(JSON.stringify({id, method, params, ...(sessionId ? {sessionId} : {})}));});
const {targetId} = await send('Target.createTarget', {url: 'about:blank'});
const {sessionId} = await send('Target.attachToTarget', {targetId, flatten: true});
const cdp = (method, params) => send(method, params, sessionId);
const evaluate = async expression => {const r = await cdp('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true}); if(r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value;};
await cdp('Runtime.enable'); await cdp('Page.enable');

const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
const click=label=>evaluate('[...document.querySelectorAll("button")].find(el=>el.textContent.trim()==='+JSON.stringify(label)+')?.click()');

const field = async (label, value, tag='input') => {
 await evaluate('(() => { const label=[...document.querySelectorAll(".money-dialog label")].find(l=>l.textContent.trim().startsWith('+JSON.stringify(label)+')); const el=label?.querySelector('+JSON.stringify(tag)+'); if(!el) throw Error("Missing field"); Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),"value").set.call(el,'+JSON.stringify(value)+'); el.dispatchEvent(new Event('+JSON.stringify(tag==='select'?'change':'input')+',{bubbles:true})); })()');
 await pause(60);
};
const toggle = async label => {await evaluate('[...document.querySelectorAll(".money-dialog label")].find(l=>l.textContent.includes('+JSON.stringify(label)+'))?.querySelector("input[type=checkbox]")?.click()');await pause(60);};
try {
 for(const view of ['money','sourcing']) for(const width of [320,390,768,1440]) {
  await cdp('Emulation.setDeviceMetricsOverride',{width,height:850,deviceScaleFactor:1,mobile:width<768});
  await cdp('Page.navigate',{url:base+'/scripts/mobile-layout.html?view='+view+'&test=funding'});
  const open=view==='money'?'Add expense':'Record vendor payment';
  for(let i=0;i<80;i++){await pause(100);if(await evaluate('[...document.querySelectorAll("button")].some(b=>b.textContent.trim()==='+JSON.stringify(open)+'&&!b.disabled)'))break;}
  await click(open);await pause(100);
  await field(view==='money'?'Amount (':'Invoice payment','500');
  if(view==='money')await field('Purpose / details','Personal and held payment','textarea');
  await field('Payment date','2026-01-02');
  await field('Paid from','2','select');
  assert(await evaluate('document.querySelector(".money-dialog form").checkValidity()'),'Personal pocket or historical date blocked by form validation');
  await toggle('Pay from multiple sources');
  await toggle('Farm bank account');await toggle('Personal pocket with');
  await field('Amount from Farm bank','200');await field('Amount from Personal pocket','299');
  await click('Save');await pause(150);
  assert(await evaluate('!window.fundingCalls?.length && document.querySelector(".money-dialog").textContent.includes("Funding amounts must equal")'),'Mismatched allocation should not reach API');
  await field('Amount from Personal pocket','300');
  await toggle('Farm bank account');
  assert(await evaluate('document.querySelectorAll(".split-funding-amount").length===1'),'Unchecking must remove allocation');
  await toggle('Farm bank account');await field('Amount from Farm bank','200');
  const layout=await evaluate('({page:document.documentElement.scrollWidth<=innerWidth+1, dialog:document.querySelector(".money-dialog").scrollWidth<=document.querySelector(".money-dialog").clientWidth+1})');
  assert(layout.page&&layout.dialog,'Split dialog overflows at '+width);
  await evaluate('window.fundingFailure=true');await click('Save');await pause(100);
  assert(await evaluate('!!document.querySelector(".money-dialog .money-spinner") && document.querySelector(".money-dialog button[type=submit]").disabled'),'Save must show pending state');
  await click('Saving…');await pause(700);
  assert(await evaluate('window.fundingCalls.length===1 && !!document.querySelector(".money-dialog") && document.querySelector(".money-dialog").textContent.includes("Simulated funding rejection")'),'Failed save must retain the form');
  await evaluate('window.fundingFailure=false');await click('Save');await pause(800);
  const calls=await evaluate('window.fundingCalls');
  assert(calls.length===2,'Duplicate submission');
  const payload=calls[1].body;
  assert(calls[1].url===(view==='money'?'/api/money/entries/split':'/api/sourcing/payments/split'),'Wrong endpoint');
  assert(JSON.stringify(payload.sources)===JSON.stringify([{accountId:1,amount:200},{accountId:2,amount:300}]),'Split amounts changed');
  assert((payload.entry||payload.payment).date==='2026-01-02','Historical date changed');
  assert((calls[0].body.entry||calls[0].body.payment).requestKey===(payload.entry||payload.payment).requestKey,'Retry lost idempotency key');
  assert(await evaluate('!document.querySelector(".money-dialog")'),'Successful save did not close');

  await click(open);await pause(100);
  await field(view==='money'?'Amount (':'Invoice payment','900');
  if(view==='money')await field('Purpose / details','Personal pocket only','textarea');
  await field('Payment date','2026-01-02');await field('Paid from','2','select');
  await click('Save');await pause(800);
  const last=await evaluate('window.fundingCalls.at(-1)');
  assert(last.url===(view==='money'?'/api/money/entries':'/api/sourcing/payments'),'Single source flow changed');
  assert((last.body.sourceId||last.body.sourceAccountId)===2 && last.body.amount===900,'Personal expense was capped or misattributed');
  assert(await evaluate('!document.querySelector(".money-dialog")'),'Single personal payment failed');
  console.log(view+' personal funding, historical date, split totals, retry, and layout passed at '+width+'px');
 }
 assert(errors.length===0,JSON.stringify(errors));
} finally {await send('Browser.close').catch(()=>{});ws.close();chrome.kill();server?.kill();}
