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
await mkdir('artifacts/mobile-layout', {recursive: true});
let checks = 0;
const failures = [];
const pause = ms => new Promise(r => setTimeout(r, ms));
const check = async label => {
  const result = await evaluate(`(() => {
    const width = innerWidth;
    const shell = document.querySelector('.admin-shell');
    const overflow = document.documentElement.scrollWidth > width + 1;
    const bad = [...document.querySelectorAll('.admin-content button, .admin-content input, .admin-content select, .admin-content textarea')].filter(el => {
      if (!el.getClientRects().length || el.closest('[hidden]')) return false;
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) if (['auto','scroll'].includes(getComputedStyle(p).overflowX) && p.scrollWidth > p.clientWidth) return false;
      const r = el.getBoundingClientRect(); return r.right > width + 1 || r.left < -1;
    }).map(el => el.textContent?.trim().slice(0,70) || el.tagName);
    return {width, actual: document.documentElement.scrollWidth, shell: !!shell, overflow, bad};
  })()`);
  checks++;
  console.log(label, JSON.stringify(result));
  if(!result.shell || result.overflow || result.bad.length) failures.push({label, ...result});
};
try {
  for(const width of [320, 390, 768, 1440]) {
    await cdp('Emulation.setDeviceMetricsOverride', {width, height: 850, deviceScaleFactor: 1, mobile: width < 768});
    for(const view of ['money', 'sales', 'farm', 'sourcing', 'employees', 'orders', 'dashboard', 'users', 'audit', 'reviews', 'prices', 'server', 'historical']) {
      const navigation = await cdp('Page.navigate', {url: `${base}/scripts/mobile-layout.html?view=${view}`});
      if(navigation.errorText) throw new Error(navigation.errorText);
      for(let i = 0; i < 80; i++) {await pause(100); if(await evaluate(`!!document.querySelector('.admin-content h1') && !document.body.textContent.includes('Loading weekday suggestions')`)) break;}
      await pause(150);
      await check(`${view}/${width}`);
      if(await evaluate(`document.querySelectorAll('details').length`)) {
        await evaluate(`document.querySelectorAll('details').forEach(el => el.open = true)`);
        await check(`${view}/expanded/${width}`);
      }
      const tabs = await evaluate(`[...document.querySelectorAll('[role="tab"]')].map(el => el.textContent.trim())`);
      for(const tab of tabs) {
        await evaluate(`[...document.querySelectorAll('[role="tab"]')].find(el => el.textContent.trim() === ${JSON.stringify(tab)})?.click()`);
        await pause(150); await check(`${view}/${tab}/${width}`);
        if(tab === 'Box Allocation') {
          await evaluate(`[...document.querySelectorAll('label')].find(el => el.textContent.includes('Manual routing'))?.querySelector('input')?.click()`);
          await pause(100); await check(`sales/manual-routing/${width}`);
        }
        // Inventory's own sections use the shared action bar.
        if(tab === 'Inventory') for(const label of ['Transactions', 'Inventory & transaction types']) {
          await evaluate(`[...document.querySelectorAll('.admin-content button')].find(el => el.textContent.trim() === ${JSON.stringify(label)})?.click()`);
          await pause(100); await check(`inventory/${label}/${width}`);
        }
      }
      if(view === 'money') {
        await evaluate(`[...document.querySelectorAll('button')].find(el => el.textContent.trim() === 'Add expense')?.click()`);
        await pause(150); await check(`money/dialog/${width}`);
        const dialog = await evaluate(`(() => {const el=document.querySelector('.money-dialog[open]');if(!el)return null;const r=el.getBoundingClientRect();return {left:r.left,right:r.right,bottom:r.bottom,width:innerWidth,height:innerHeight};})()`);
        if(!dialog || dialog.left < 0 || dialog.right > width + 1 || dialog.bottom > dialog.height + 1) failures.push({label: `money/dialog-bounds/${width}`, dialog});
        await evaluate(`document.querySelector('.money-dialog button')?.click()`);
      }
      if(view === 'money') {
        await evaluate(`[...document.querySelectorAll('[role="tab"]')].find(el=>el.textContent.trim()==='Monthly overview')?.click()`);
        for(const action of ['Set actual balances','Transfer / add funds']) {
          await evaluate(`[...document.querySelectorAll('button')].find(el=>el.textContent.trim()===${JSON.stringify(action)})?.click()`);
          await pause(100);await check(`money/${action}/${width}`);
          const bounds=await evaluate(`(()=>{const d=document.querySelector('.money-dialog[open]');if(!d)return null;const r=d.getBoundingClientRect();return {left:r.left,right:r.right,bottom:r.bottom};})()`);
          if(!bounds||bounds.left<0||bounds.right>width+1||bounds.bottom>851)failures.push({label:action,width,bounds});
          await evaluate(`document.querySelector('.money-dialog button')?.click()`);
        }
      }
      if(width === 390 && view === 'sales') {
        await evaluate(`document.querySelector('.admin-mobile-menu')?.focus(); document.querySelector('.admin-mobile-menu')?.click()`); await pause(100);
        if(!await evaluate(`document.querySelector('#admin-mobile-navigation')?.open && document.querySelector('#admin-mobile-navigation').contains(document.activeElement)`)) failures.push({label:'drawer focus'});
        const shot = await cdp('Page.captureScreenshot', {format:'png'}); await writeFile('artifacts/mobile-layout/drawer-390.png', Buffer.from(shot.data, 'base64'));
        await cdp('Input.dispatchKeyEvent', {type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
        await cdp('Input.dispatchKeyEvent', {type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27}); await pause(100);
        if(await evaluate(`document.querySelector('#admin-mobile-navigation')?.open`)) failures.push({label:'drawer Escape'});
        if(!await evaluate(`document.activeElement === document.querySelector('.admin-mobile-menu')`)) failures.push({label:'drawer focus return'});
        await evaluate(`document.querySelector('.admin-mobile-menu')?.click()`);
        await cdp('Emulation.setDeviceMetricsOverride', {width:1440,height:850,deviceScaleFactor:1,mobile:false});
        await pause(100);
        if(await evaluate(`document.querySelector('#admin-mobile-navigation')?.open || document.body.style.overflow === 'hidden'`)) failures.push({label:'drawer desktop resize'});
        await cdp('Emulation.setDeviceMetricsOverride', {width,height:850,deviceScaleFactor:1,mobile:true});
      }
      if(view === 'users') {
        await evaluate(`document.querySelector('[data-role-picker-trigger]')?.click()`); await pause(100);
        const bounds = await evaluate(`(() => {const el=document.querySelector('[data-role-picker-menu]');if(!el)return null;const r=el.getBoundingClientRect();return {left:r.left,right:r.right};})()`);
        if(!bounds || bounds.left < 0 || bounds.right > width) failures.push({label:`role-picker/${width}`,bounds});
      }
      if(width === 390 && ['money','farm'].includes(view)) {const shot = await cdp('Page.captureScreenshot', {format:'png'}); await writeFile(`artifacts/mobile-layout/${view}-390.png`,Buffer.from(shot.data,'base64'));}
    }
  }
  const result = {checks, failures, errors};
  await writeFile('artifacts/mobile-layout/results.json',JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
  if(failures.length || errors.length) process.exitCode=1;
} finally {await send('Browser.close').catch(()=>{}); ws.close(); chrome.kill(); server?.kill();}
