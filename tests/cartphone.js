// Part 3 phone checks: the gate, the village map, tapping people and buildings, rain, night, the calendar and the notebook.
// Usage: node villagemaptest.js [screenshot folder]
const { chromium, devices } = require('playwright'); const fs = require('fs');
const KEY = 'brambleroot-save-v1', URL0 = 'file://' + process.cwd() + '/local.html', OUT = process.argv[2] || '.';
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
const wait = (p, ms) => p.waitForTimeout(ms || 250);
async function closeSheets(p) { for (let i = 0; i < 6; i++) { if (await p.isHidden('#sheet')) return; await p.tap('#shClose').catch(() => {}); await wait(p, 150); } }
async function start(p, patch) {
  await p.goto(URL0); await wait(p, 300);
  const s = JSON.parse(fs.readFileSync('shot-save.json', 'utf8')); Object.assign(s, { cloud:{ name:'moss-fern-owl-42', last:0 } }, patch);
  await p.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(s)]);
  await p.reload(); await wait(p, 300); await p.tap('#tContinue'); await wait(p, 500); await closeSheets(p);
}
// The same tile maths as resize() in the game.
async function tile(p, c, r) {
  return p.evaluate(([c, r]) => {
    const W = innerWidth, H = innerHeight, top = document.getElementById('hud').getBoundingClientRect().height - 6, bot = document.getElementById('tray').getBoundingClientRect().height;
    const aw = W - 12, ah = H - top - bot - 8, T = Math.max(20, Math.floor(Math.min(aw / 9, ah / 13)));
    const ox = Math.round((W - T * 9) / 2), oy = Math.round(top + (ah - T * 13) / 2 + 4);
    return { x:ox + (c + .5) * T, y:oy + (r + .5) * T };
  }, [c, r]);
}
async function tapTile(p, c, r, ms) { const { x, y } = await tile(p, c, r); await p.touchscreen.tap(x, y); await wait(p, ms || 1500); }
const body = p => p.innerHTML('#shBody');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    const ctx = await b.newContext(devices[dev]);
    await ctx.route('**/firestore.googleapis.com/**', r => r.fulfill({ status: 200, body: '{}' }));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(dev + ': ' + e.message));
    await start(p, { season:1, day:12, time:600, rain:false, coins:3000, visits:[], visitKey:'', evToday:null });
    await p.evaluate(() => {}); 
    await tapTile(p, 0, 6, 2500); // farm gate
    if (!(await p.isHidden('#sheet'))) { await p.tap('button[data-act="govillage"]'); await wait(p, 600); }
    await closeSheets(p);
    await tapTile(p, 7, 6, 4000); // the cart
    let h = await body(p);
    ok(dev + ': tapping the cart opens it', (await p.textContent('#shTitle')) === "Zara's cart");
    ok(dev + ': wares are listed', /Zara's wares/.test(h) && (h.match(/data-act="zbuy"/g) || []).length === 5);
    const st = await p.evaluate(() => document.getElementById('shBody').scrollHeight);
    await p.evaluate(() => { const b = document.getElementById('shBody'), el = b.querySelector('[data-id="starshard"]'); b.scrollTop = el.offsetTop - 120; }); await wait(p, 200);
    const before = await p.evaluate(() => document.getElementById('shBody').scrollTop);
    await p.tap('button[data-act="zbuy"][data-id="starshard"]'); await wait(p, 300);
    const after = await p.evaluate(() => document.getElementById('shBody').scrollTop);
    h = await body(p);
    ok(dev + ': buying a Starshard works', /Sold out/.test(h) && /Sold out/.test(h));
    ok(dev + ': buying keeps the scroll position', (console.log(before, after), Math.abs(after - before) < 40));
    ok(dev + ': coins went down', (await p.textContent('#hud')).includes('2,400'));
    await p.evaluate(() => document.getElementById('shBody').scrollTop = 0); await wait(p, 150);
    if (dev === 'iPhone 13') { await p.screenshot({ path: 'cart-sheet.png' }); await p.evaluate(() => { const b = document.getElementById('shBody'); b.scrollTop = b.scrollHeight; }); await wait(p, 150); await p.screenshot({ path: 'cart-sheet2.png' }); }
    await closeSheets(p);
    if (dev === 'iPhone 13') await p.screenshot({ path: 'cart-village.png' });
    await ctx.close();
  }
  ok('no page errors', !errs.length); if (errs.length) console.log(errs);
  console.log(`${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0);
})();
