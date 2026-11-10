import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const context = {exports: {}, URL, URLSearchParams};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/admin/utils/shopNavigation.ts', 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText, context);
const {mapTarget, routeSections, shopDirections} = context.exports;
test('coordinates and explicit Google pin take priority over viewport', () => {
  assert.equal(mapTarget('12.97, 77.59'), '12.97,77.59');
  assert.equal(mapTarget('https://www.google.com/maps/place/shop/@10,20,15z/data=!3d12.97!4d77.59'), '12.97,77.59');
  assert.equal(mapTarget('https://www.google.com/maps/search/?api=1&query=12.97%2C77.59'), '12.97,77.59');
  assert.throws(() => mapTarget('91,77'));
  assert.throws(() => mapTarget('12,181'));
  assert.throws(() => mapTarget('https://example.com/shop'));
});
test('short links remain individual stops, never become route addresses', () => {
  const shop = {shopName: 'Shop', location: 'Area', mapLocation: 'https://maps.app.goo.gl/abc'};
  assert.equal(shopDirections(shop), shop.mapLocation);
  assert.equal(routeSections('Farm', [shop])[0], shop.mapLocation);
  assert.equal(mapTarget('https://www.google.com/maps/@12,77,15z'), '');
});
test('route sections preserve all stops, order and continuous origins', () => {
  const shops = Array.from({length: 11}, (_, i) => ({shopName: `Shop ${i}`, location: 'Area', mapLocation: `12,${70+i}`}));
  const links = routeSections('Farm', shops);
  assert.equal(links.length, 3);
  const stops = links.flatMap(link => {const p = new URL(link).searchParams; return [...(p.get('waypoints')?.split('|') || []), p.get('destination')];});
  assert.deepEqual(Array.from(stops), shops.map(s => s.mapLocation));
  assert.equal(new URL(links[1]).searchParams.get('origin'), '12,73');
  assert.ok(links.every(link => (new URL(link).searchParams.get('waypoints')?.split('|').length || 0) <= 3));
});
test('invalid origin being edited and old malformed records do not crash rendering', () => {
  assert.ok(routeSections('https://', [{shopName: 'Shop', location: 'Area', mapLocation: '91,0'}])[0].startsWith('https://www.google.com/maps/dir/'));
  assert.ok(shopDirections({mapLocation: 'https://evil.example', customerName: 'Shop'}).startsWith('https://www.google.com/maps/dir/'));
});
