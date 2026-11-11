// Shop phone checks, Part 3 (improvements, reputation, regulars, decor). Was: Shop phone checks (PLAN-shop.md Part 1), iPhone 13 and Pixel 7, all by tapping:
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
    await start(p, s => Object.assign({}, base, { coins:9000, inv:{ pepper:20, cordial:4 }, ribbons:{ ringtoss:[1], dance:[1], nightfish:[1] }, prizes:Object.assign({}, s.prizes, { maypole:true, scarecrow:true }), quests:Object.assign({}, s.quests, { shop:{ s:5, at:1, done:true } }), shopSeen:true, rowSeen:true, shop:{ shelf, day:null, came:{}, total:0, sold:0, served:0, days:3, best:0, rep:95, buys:{ mara:6, wren:7, fen:6 }, up:{ window:1, sign:1 } } }));
    await tapTile(p, 0, 6, 1000);
    if (await seen(p, 'button[data-act="gorow"]')) { await p.tap('button[data-act="gorow"]'); await wait(p, 900); }
    await closeSheets(p);
    await shot('shop3-row');
    await tapTile(p, 4, 1, 3500);
    await tapTile(p, 4, 2, 5000);
    let h = await body(p);
    ok(dev + ': the ledger shows reputation and regulars', /Popular/.test(h) && /Your regulars/.test(h));
    await p.evaluate(() => { const b = document.getElementById('shBody'), el = b.querySelector('[data-act="shopup"][data-id="tables"]'); b.scrollTop = el.closest('.row').offsetTop - 200; }); await wait(p, 200);
    await shot('shop3-ledger');
    const c0 = await coins(p);
    await p.tap('button[data-act="shopup"][data-id="tables"]'); await wait(p, 400);
    ok(dev + ': buying the tables', (await coins(p)) === c0 - 1500 && /Done\. Two low tables/.test(await body(p)));
    await p.tap('button[data-act="shopup"][data-id="glass"]'); await wait(p, 400);
    ok(dev + ': then the glass case', (await coins(p)) === c0 - 4500);
    await closeSheets(p); await wait(p, 300);
    await tapTile(p, 1, 11, 5000);
    ok(dev + ': a new table can be stocked', (await title(p)) === 'Shelf 7' && /Put out/.test(await body(p)));
    await p.tap('button[data-act="shelfput"][data-item="pepper"]'); await wait(p, 300); await closeSheets(p);
    await tapTile(p, 5, 5, 5000);
    ok(dev + ': the glass case can be stocked', (await title(p)) === 'Shelf 10' && /glass case/i.test(await body(p)));
    await p.tap('button[data-act="shelfput"][data-item="cordial"]'); await wait(p, 300); await closeSheets(p);
    await shot('shop3-inside');
    await ctx.close();
  }
  ok('no page errors', !errs.length); if (errs.length) console.log(errs);
  console.log(`${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0);
})();
