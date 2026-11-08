import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/admin/utils/salesForecast.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
const { forecast, nextWeek } = context.exports;
const row = (date, boxes, extras = {}) => ({date, boxes, exchanges: 0, returns: 0, customerId: 1, product: 'Oyster', ...extras});
const history = days => ({today: '2026-11-09', from: '2026-09-07', days});
test('same weekday average sums deliveries and keeps products and shops separate', () => {
 const h = history([row('2026-10-12', 10), row('2026-10-19', 20), row('2026-10-26', 30), row('2026-11-02', 10, {exchanges: 2}), row('2026-11-02', 30, {returns: 4}), row('2026-11-02', 900, {product: 'Corn'}), row('2026-11-02', 800, {customerId: 2}), row('2026-11-09', 1000)]);
 const f = forecast(h, '2026-11-16', 4, 'Oyster', '1');
 assert.equal(f.boxes, 25); assert.equal(f.exchanges, .5); assert.equal(f.returns, 1); assert.equal(f.rate, 2); assert.equal(f.count, 4); assert.equal(f.low, 10); assert.equal(f.high, 40);
});
test('missing weekdays count zero after history starts; earlier history stays unknown', () => {
 const f = forecast(history([row('2026-10-19', 20), row('2026-11-02', 40)]), '2026-11-09', 8, 'Oyster');
 assert.equal(f.count, 3); assert.equal(f.boxes, 20);
 assert.equal(forecast(history([]), '2026-11-09', 8, 'Oyster').boxes, null);
});
test('historical estimate excludes later observations and actual is separate', () => {
 const f = forecast(history([row('2026-10-26', 10), row('2026-11-02', 50), row('2026-11-09', 900)]), '2026-11-02', 4, 'Oyster');
 assert.equal(f.boxes, 10); assert.equal(f.actual, 50);
});
test('next week is always the next calendar Monday through Sunday', () => {
 assert.equal(nextWeek('2026-11-09')[0], '2026-11-16');
 assert.equal(nextWeek('2026-11-15')[0], '2026-11-16');
 assert.equal(nextWeek('2026-12-31')[6], '2027-01-10');
});
