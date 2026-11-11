// Shop phone checks (PLAN-shop.md Part 1), iPhone 13 and Pixel 7, all by tapping:
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

    // 1. the story's second step: through the village arch to the boarded shop
    await start(p, s => Object.assign({}, base, { quests:Object.assign({}, s.quests, { shop:{ s:1, at:1 } }) }));
    await tapTile(p, 0, 6, 1000);
    if (await seen(p, 'button[data-act="govillage"]')) { await p.tap('button[data-act="govillage"]'); await wait(p, 600); }
    await closeSheets(p);
    await shot('shop-village-arch');
    await tapTile(p, 8, 8, 4500);
    await shot('shop-row-boarded');
    await tapTile(p, 4, 1, 3500);
    ok(dev + ': the boarded shop shows its story card', (await title(p)) === 'Brambleroot' && /Unlock the door/.test(await body(p)));
    await p.tap('button[data-act="qdo"]'); await wait(p, 500);
    ok(dev + ': unlocking tells the story', /BRAMBLEROOT/.test(await body(p)));
    await closeSheets(p);

    // 2. the shop restored: the gate goes straight to the row
    await start(p, s => Object.assign({}, base, { quests:Object.assign({}, s.quests, { shop:{ s:5, at:1, done:true } }), inv:{ pepper:14, melon:6, mint:8, salve:2 }, shop:null }));
    await tapTile(p, 0, 6, 1000);
    ok(dev + ': the gate offers Old Market Row', await seen(p, 'button[data-act="gorow"]'));
    await p.tap('button[data-act="gorow"]'); await wait(p, 600);
    await shot('shop-row-open');
    await tapTile(p, 4, 1, 3500);
    await shot('shop-inside-empty');
    // stock a shelf on each side
    await tapTile(p, 0, 3, 4500);
    ok(dev + ': tapping a shelf opens it', (await title(p)) === 'Shelf 1' && /Put out/.test(await body(p)));
    await p.tap('button[data-act="shelfput"][data-item="pepper"]'); await wait(p, 300);
    ok(dev + ': put out 10 Sunpeppers', /Sunpepper ×10 of 10/.test(await body(p)));
    await p.tap('button[data-act="shelfprice"][data-item="kind"]'); await wait(p, 200);
    ok(dev + ': price set to kind', /Kind: a little under/.test(await body(p)));
    await closeSheets(p);
    await tapTile(p, 8, 3, 4500);
    await p.tap('button[data-act="shelfput"][data-item="melon"]'); await wait(p, 300);
    ok(dev + ': put out the melons', /Bellmelon ×6 of 10/.test(await body(p)));
    await closeSheets(p);
    // open up from the ledger
    await tapTile(p, 4, 2, 5000);
    ok(dev + ': the ledger opens the shop sheet', (await title(p)) === 'Brambleroot' && /Open up/.test(await body(p)));
    await p.tap('button[data-act="shopopen"]'); await wait(p, 400);
    ok(dev + ': the shop is open', await p.isHidden('#sheet'));
    // wait for the first customer to reach the counter, then tap them
    const c0 = await coins(p);
    await wait(p, 9000);
    await shot('shop-customers');
    let served = false;
    for (let i = 0; i < 12 && !served; i++) {
      for (const [c, r] of [[4, 3], [3, 3], [5, 3]]) { await tapTile(p, c, r, 900); if (await coins(p) > c0) { served = true; break; } }
      if (!served) await wait(p, 1500);
    }
    ok(dev + ': tapping a waiting customer sells to them', served);
    await shot('shop-served');
    // close up
    await tapTile(p, 4, 2, 2500);
    await p.tap('button[data-act="shopshut"]'); await wait(p, 500);
    ok(dev + ': closing up shows the day', (await title(p)) === 'Closed up' && /till holds/.test(await body(p)));
    await shot('shop-closed-up');
    await closeSheets(p);
    await tapTile(p, 4, 12, 5000);
    ok(dev + ': out of the door, onto the row', await p.isHidden('#sheet'));
    await shot('shop-row-after');
    await ctx.close();
  }
  ok('no page errors', !errs.length); if (errs.length) console.log(errs);
  console.log(`${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0);
})();
