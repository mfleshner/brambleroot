// Shop phone checks, Part 5 (the row reopened: the bakery, Zara's Curios, the Guild seal, Bramble's ledger pages). Was: Shop phone checks (PLAN-shop.md Part 1), iPhone 13 and Pixel 7, all by tapping:
// the arch in the village → Old Market Row → the boarded shop's story card; then with the shop restored:
// the gate → the row → inside → stock two shelves → open up from the ledger → serve the first customer → close up
// → out of the door. Usage: node shopphone.js [screenshot folder]   (needs local.html: a keyless test build)
const { chromium, devices } = require('playwright'); const fs = require('fs');
const KEY = 'brambleroot-save-v1', URL0 = 'file://' + process.cwd() + '/local.html', OUT = process.argv[2] || '.';
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
const wait = (p, ms) => p.waitForTimeout(ms || 250);
async function closeSheets(p) { for (let i = 0; i < 6; i++) { if (await p.isHidden('#sheet')) return; await p.tap('#shClose').catch(() => {}); await wait(p, 150); } }
async function start(p, patch) {
  await p.goto(URL0); await wait(p, 300);
  const s = JSON.parse(fs.readFileSync('shot-save.json', 'utf8')); Object.assign(s, { cloud:{ name:'moss-fern-owl-42', last:0 } }, patch(s));
  await p.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(s)]);
  await p.reload(); await wait(p, 300); await p.tap('#tContinue'); await wait(p, 500); await closeSheets(p);
}
async function tile(p, c, r) {
  return p.evaluate(([c, r]) => {
    const W = innerWidth, H = innerHeight, top = document.getElementById('hud').getBoundingClientRect().height - 6, bot = document.getElementById('tray').getBoundingClientRect().height;
    const aw = W - 12, ah = H - top - bot - 8, T = Math.max(20, Math.floor(Math.min(aw / 9, ah / 13)));
    const ox = Math.round((W - T * 9) / 2), oy = Math.round(top + (ah - T * 13) / 2 + 4);
    return { x:ox + (c + .5) * T, y:oy + (r + .5) * T };
  }, [c, r]);
}
async function tapTile(p, c, r, ms) { const { x, y } = await tile(p, c, r); await p.touchscreen.tap(x, y); await wait(p, ms || 1500); }
const body = p => p.innerHTML('#shBody'), title = p => p.textContent('#shTitle');
const seen = async (p, sel, ms) => { for (let i = 0; i < (ms || 8000) / 250; i++) { if (!(await p.isHidden(sel))) return true; await wait(p, 250); } return false; };
const coins = async p => +((await p.textContent('#coins')) || '0').replace(/,/g, '');
const base = { season:1, day:15, time:600, rain:false, coins:3000, visits:[], visitKey:'', evToday:null };
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    const ctx = await b.newContext(devices[dev]);
    await ctx.route('**/firestore.googleapis.com/**', r => r.fulfill({ status: 200, body: '{}' }));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(dev + ': ' + e.message));
    const shot = async n => { if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/${n}.png` }); };
    const shelf = [['pepper', 10], ['melon', 6], ['mint', 10], ['star', 8], ['thorn', 10], ['salve', 2]].map(([id, n]) => ({ id, n, p:'fair' }));
    const done = { s:9, at:1, done:true };
    await start(p, s => Object.assign({}, base, { day:6, coins:5000, quests:Object.assign({}, s.quests, { shop:done, theoshop:done, inspector:done, rowlife:done }), shopSeen:true, rowSeen:true,
      shop:{ shelf, day:null, came:{}, total:15000, sold:300, served:120, days:20, best:0, rep:120, flags:{ theo:1, seal:1, row:1 }, pages:{ open:1, fifty:1, regular:1, week:1, order:1, tenk:1, last:1 }, up:{ sign:1 } } }));
    await tapTile(p, 0, 6, 1000);
    if (await seen(p, 'button[data-act="gorow"]')) { await p.tap('button[data-act="gorow"]'); await wait(p, 900); }
    await closeSheets(p);
    await shot('shop5-row');
    await tapTile(p, 0, 9, 4000);
    ok(dev + ': the bakery is open', (await title(p)) === 'The Little Bakery' && /data-act="bakebuy"/.test(await body(p)));
    const c0 = await coins(p); await p.tap('button[data-act="bakebuy"]'); await wait(p, 300);
    ok(dev + ': buying a bake', (await coins(p)) < c0);
    await shot('shop5-bakery');
    await closeSheets(p);
    await tapTile(p, 8, 5, 4000);
    ok(dev + ': Zara\'s Curios is open', (await title(p)) === "Zara's Curios" && /data-act="curiobuy"/.test(await body(p)));
    await closeSheets(p);
    await tapTile(p, 4, 1, 3500);
    await tapTile(p, 4, 2, 5000);
    ok(dev + ': the ledger has Bramble\'s pages', /7 of 8 pages/.test(await body(p)));
    await p.tap('button[data-act="lpage"][data-id="last"]'); await wait(p, 300);
    ok(dev + ': reading the last page', (await title(p)) === 'The last page' && /Love, B\./.test(await body(p)));
    await shot('shop5-page');
    await ctx.close();
  }
  ok('no page errors', !errs.length); if (errs.length) console.log(errs);
  console.log(`${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0);
})();
