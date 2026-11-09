// Phone checks for the Nov 8 garden requests (board stays open, trowel, silver sprinkler heads). Pass a folder for screenshots.
const { chromium, devices } = require('playwright'); const fs = require('fs');
const KEY = 'brambleroot-save-v1', URL0 = 'file://' + process.cwd() + '/local.html', OUT = process.argv[2] || '.';
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
async function closeSheets(p) { for (let i = 0; i < 6; i++) { if (await p.isHidden('#sheet')) return; await p.tap('#shClose').catch(() => {}); await p.waitForTimeout(150); } }
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    const ctx = await b.newContext(devices[dev]);
    await ctx.route('**/firestore.googleapis.com/**', r => r.fulfill({ status: 200, body: '{}' }));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(dev + ': ' + e.message));
    await p.goto(URL0); await p.waitForTimeout(300);
    const s = JSON.parse(fs.readFileSync('shot-save.json', 'utf8'));
    Object.assign(s, { day: 13, time: 600, coins: 5000, sprinklers: 2 }); s.cloud = s.cloud || { name: 'test-save-name-01', intro: true };
    s.inv.mint = 10; s.inv.ember = 10;
    s.reqs = [['mara', 'mint'], ['odile', 'ember'], ['fen', 'mint']].map(([v, item], i) => ({ v, item, n: 1, text: 'Could you spare one, witch?', due: s.day + 3, reward: 40 + i, fresh: false }));
    await p.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(s)]);
    await p.reload(); await p.waitForTimeout(300); await p.tap('#tContinue'); await p.waitForTimeout(400); await closeSheets(p);
    // board
    await p.tap('#bBoard'); await p.waitForTimeout(250);
    await p.tap('button[data-act="give"][data-i="1"]'); await p.waitForTimeout(300);
    ok(dev + ': board still open after Give', await p.isVisible('#sheet') && (await p.textContent('#shTitle')) === 'Village requests');
    ok(dev + ': thank-you card in the middle', (await p.$$eval('#shBody .card .nm', a => a.map(x => x.textContent))).join() === 'Mara,Odile,Old Fen');
    await p.tap('button[data-act="give"][data-i="1"]'); await p.waitForTimeout(300);
    ok(dev + ': a second Give also stays open', await p.isVisible('#sheet') && ((await p.textContent('#shBody')).match(/Done · thank you!/g) || []).length === 2);
    if (dev === 'iPhone 13') await p.screenshot({ path: OUT + '/board.png' });
    await closeSheets(p);
    // trowel
    await p.tap('#bSeeds'); await p.waitForTimeout(250);
    ok(dev + ': trowel in the seed pouch', (await p.textContent('#shBody')).includes('Trowel'));
    if (dev === 'iPhone 13') await p.screenshot({ path: OUT + '/pouch.png' });
    await p.tap('button[data-act="sel"][data-id="trowel"]'); await p.waitForTimeout(250);
    ok(dev + ': tray shows Trowel', (await p.textContent('#seedLbl')) === 'Trowel');
    // silver heads in the market
    await closeSheets(p); await p.tap('#bMarket'); await p.waitForTimeout(250); await p.tap('button[data-act="tab"][data-id="upgrades"]'); await p.waitForTimeout(200);
    await p.tap('button[data-act="up"][data-id="sprhead"]'); await p.waitForTimeout(250);
    ok(dev + ': silver heads bought', (await p.textContent('#shBody')).includes('all 8 beds'));
    if (dev === 'iPhone 13') await p.screenshot({ path: OUT + '/market.png' });
    await closeSheets(p);
    if (dev === 'iPhone 13') await p.screenshot({ path: OUT + '/garden.png' });
    await ctx.close();
  }
  ok('no page errors', !errs.length); if (errs.length) console.log(errs.join('\n'));
  console.log(`${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0);
})();
