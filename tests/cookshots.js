// Phone checks for cooking: open Brew, switch to the Kitchen, cook and eat with real taps, buy a recipe card at the
// market. iPhone 13 and Pixel 7; screenshots (iPhone) go to shots/. Needs local.html (build_site.py with fake keys).
const { chromium, devices } = require('playwright'); const fs = require('fs');
fs.mkdirSync('shots', { recursive:true });
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
(async () => {
  const b = await chromium.launch(), errs = [];
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    const ip = dev === 'iPhone 13';
    const ctx = await b.newContext(devices[dev]); await ctx.route('**/firestore.googleapis.com/**', r => r.fulfill({ status: 200, body: '{}' }));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(dev + ': ' + e.message));
    await p.goto('file://' + process.cwd() + '/local.html'); await p.waitForTimeout(300);
    // an old save with no cooking at all
    const s = JSON.parse(fs.readFileSync('shot-save.json', 'utf8')); delete s.recipes; delete s.fed;
    Object.assign(s, { day:13, time:600, energy:40, coins:2000 }); s.cloud = { name:'test-save-name-01', intro:true };
    s.inv = Object.assign(s.inv || {}, { minnow:4, thorn:2 });
    await p.evaluate(v => localStorage.setItem('brambleroot-save-v1', v), JSON.stringify(s));
    await p.reload(); await p.waitForTimeout(300); await p.tap('#tContinue'); await p.waitForTimeout(500);
    const close = async () => { for (let i = 0; i < 6; i++) { if (await p.isHidden('#sheet')) return; await p.tap('#shClose').catch(() => {}); await p.waitForTimeout(150); } };
    await close(); await p.waitForTimeout(1800); await close();
    await p.tap('#bPot'); await p.waitForTimeout(250);
    await p.tap('button[data-act="btab"][data-id="kitchen"]'); await p.waitForTimeout(250);
    ok(dev + ': kitchen tab opens', /Recipes/.test(await p.innerHTML('#shBody')));
    await p.tap('button[data-act="cook"][data-id="minnowfry"]'); await p.waitForTimeout(200);
    await p.tap('button[data-act="cook"][data-id="minnowfry"]'); await p.waitForTimeout(200);
    ok(dev + ': cooked two Minnow Fry', /Minnow Fry ×2/.test(await p.innerHTML('#shBody')));
    if (ip) await p.screenshot({ path: 'shots/kitchen.png' });
    const w0 = await p.evaluate(() => parseFloat(document.getElementById('enBar').style.width));
    await p.tap('button[data-act="eat"][data-id="minnowfry"]'); await p.waitForTimeout(250);
    const w1 = await p.evaluate(() => parseFloat(document.getElementById('enBar').style.width));
    ok(dev + ': eating fills the energy bar', w1 > w0);
    await p.tap('button[data-act="eat"][data-id="minnowfry"]'); await p.waitForTimeout(250);
    ok(dev + ': full after two', /full today/.test(await p.innerHTML('#shBody')));
    await close();
    await p.tap('#bMarket').catch(async () => { await p.tap('text=Market'); }); await p.waitForTimeout(300);
    const tabBuy = p.locator('button[data-act="tab"][data-id="buy"]'); if (await tabBuy.count()) { await tabBuy.tap(); await p.waitForTimeout(200); }
    ok(dev + ': market shows recipe cards', /Recipe cards/.test(await p.innerHTML('#shBody')));
    if (ip) await p.screenshot({ path: 'shots/recipecards.png' });
    await p.tap('button[data-act="recipe"][data-id="troutsup"]'); await p.waitForTimeout(250);
    ok(dev + ': bought a recipe card', !/Recipe: Trout Supper/.test(await p.innerHTML('#shBody')));
    await close();
    await p.waitForTimeout(400);
    const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('brambleroot-save-v1') || '{}'));
    ok(dev + ': old save got the starters and kept the new card', saved.recipes && saved.recipes.minnowfry && saved.recipes.troutsup);
    await ctx.close();
  }
  ok('no page errors', !errs.length); if (errs.length) console.log(errs.join('\n'));
  console.log(`${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0);
})();
