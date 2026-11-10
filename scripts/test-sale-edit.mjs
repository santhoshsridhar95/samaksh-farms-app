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
try {
 for(const collection of [false,true])for(const width of [390,1440]){
  await cdp('Emulation.setDeviceMetricsOverride',{width,height:850,deviceScaleFactor:1,mobile:width<768});
  await cdp('Page.navigate',{url:base+'/scripts/mobile-layout.html?view=sales&test=sale-edit&collection='+collection});
  for(let i=0;i<80;i++){await pause(100);if(await evaluate('!!document.querySelector("select.is-shop-selected") || [...document.querySelectorAll("select option")].some(o=>o.value==="1")'))break;}
  await evaluate('(()=>{const el=[...document.querySelectorAll("select")].find(e=>e.querySelector("option")?.textContent==="Select shop");el.value="1";el.dispatchEvent(new Event("change",{bubbles:true}));})()');
  await pause(200);await click('Edit Entry');await pause(100);
  assert(await evaluate('!!document.querySelector(".sales-entry-edit-modal")'),'Edit popup did not open');
  await evaluate('(()=>{const el=[...document.querySelectorAll(".sales-entry-edit-modal label")].find(e=>e.textContent.includes("Remarks")).querySelector("input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,"Correction regression test");el.dispatchEvent(new Event("input",{bubbles:true}));})()');
  await evaluate('(()=>{const el=[...document.querySelectorAll(".sales-entry-edit-modal label")].find(e=>e.textContent.includes("Amount Received Today")).querySelector("input");if(el.readOnly||el.disabled)throw Error("Receipt field is locked");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,"250");el.dispatchEvent(new Event("input",{bubbles:true}));})()');
  await evaluate('window.fixtureEditFailure=true');await click('Save Correction');await pause(100);
  assert(await evaluate('!!document.querySelector(".sales-entry-edit-actions .money-spinner")'),'Spinner missing during save');
  await click('Saving Correction...');await pause(900);
  assert(await evaluate('window.fixtureEditCalls===1 && !!document.querySelector(".sales-entry-edit-modal") && document.body.textContent.includes("Simulated correction rejection")'),'Failure must keep editable popup and display error');
  await evaluate('window.fixtureEditFailure=false');await click('Save Correction');await pause(1200);
  assert(await evaluate('window.fixtureEditCalls===2 && !document.querySelector(".sales-entry-edit-modal")'),'Successful save must close popup once');
  await click('Edit Entry');await pause(100);
  assert(await evaluate('[...document.querySelectorAll(".sales-entry-edit-modal label")].find(e=>e.textContent.includes("Remarks"))?.querySelector("input")?.value==="Correction regression test"'),'Saved correction not reflected after reload');
  assert(await evaluate('[...document.querySelectorAll(".sales-entry-edit-modal label")].find(e=>e.textContent.includes("Amount Received Today"))?.querySelector("input")?.value==="250"'),'Corrected receipt not reflected');
  console.log('Sales correction success, failure, spinner, duplicate prevention and refresh passed at '+width+'px');
 }
 assert(errors.length===0,JSON.stringify(errors));
}finally{await send('Browser.close').catch(()=>{});ws.close();chrome.kill();server?.kill();}
