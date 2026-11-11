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
 await evaluate('(() => { const label=[...document.querySelectorAll(".direct-sale-fields label")].find(l=>l.textContent.trim().startsWith('+JSON.stringify(label)+')); const el=label?.querySelector('+JSON.stringify(tag)+'); if(!el) throw Error("Missing field"); Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),"value").set.call(el,'+JSON.stringify(value)+'); el.dispatchEvent(new Event('+JSON.stringify(tag==='select'?'change':'input')+',{bubbles:true})); })()');
 await pause(60);
};
try {
 await cdp('Page.navigate',{url:base+'/scripts/mobile-layout.html?view=sales&test=direct-edit'});for(let i=0;i<100;i++){await pause(100);if(await evaluate("[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Direct Sales')"))break;}
 await click('Direct Sales');for(let i=0;i<100;i++){await pause(100);if(await evaluate("[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Edit purchase')"))break;}
 await click('Edit purchase');await pause(150);
 await field('Quantity','3');await field('Unit price','70');await field('Total collected','100');await field('Purchased at','Corrected market');await field('Product / purchase','Fresh mushrooms');await field('Notes','Corrected notes');await field('Purchase date','2026-01-02');
 await click('Update direct sale');await click('Update direct sale');await pause(1000);
 const calls=await evaluate('window.directCalls');if(calls?.length!==1)console.log(await evaluate(`({calls:window.directCalls,invalid:[...document.querySelectorAll('.direct-sale-fields input,.direct-sale-fields select')].filter(e=>!e.checkValidity()).map(e=>({label:e.closest('label')?.textContent,value:e.value,error:e.validationMessage})),errors:[...document.querySelectorAll('[role=alert]')].map(e=>e.textContent),buttons:[...document.querySelectorAll('.direct-sale-fields button')].map(e=>e.textContent)})`));assert(calls?.length===1,'Exactly one update should be sent');const r=calls[0];assert(r.quantity===3&&r.unitPrice===70&&r.amountCollected===100&&r.saleDate==='2026-01-02'&&r.collectorUserId===1&&r.customerId===1&&r.purchaseLocation==='Corrected market'&&r.productName==='Fresh mushrooms'&&r.remarks==='Corrected notes'&&r.expectedFingerprint==='sale-v1','All editable fields must reach the update API');
 assert(await evaluate("document.body.textContent.includes('Direct sale saved for')"),'Saved feedback');assert(!errors.length,errors.join('\n'));console.log('Direct-sale edit payload and duplicate-submit checks passed.');
} finally {await send('Browser.close').catch(()=>{});ws.close();chrome.kill();server?.kill();}
