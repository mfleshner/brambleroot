// Clock pace + idle pause check on phone-sized pages.
const { chromium, devices } = require('playwright'); const fs = require('fs');
const KEY = 'brambleroot-save-v1', URL0 = 'file://' + process.cwd() + '/local.html';
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
const mins = t => { const m = t.trim().match(/(\d+):(\d+) (am|pm)/); let h = +m[1] % 12; if (m[3] === 'pm') h += 12; return h * 60 + +m[2]; };
async function closeSheets(p) { for (let i = 0; i < 6; i++) { if (await p.isHidden('#sheet')) return; await p.tap('#shClose').catch(() => {}); await p.waitForTimeout(150); } }
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    const ctx = await b.newContext(devices[dev]);
    await ctx.route('**/firestore.googleapis.com/**', r => r.fulfill({ status: 200, body: '{}' }));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(dev + ': ' + e.message));
    await p.goto(URL0); await p.waitForTimeout(300);
    const s = JSON.parse(fs.readFileSync('shot-save.json', 'utf8')); s.time = 600; delete s.pace; delete s.clockTip;
    await p.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(s)]);
    await p.reload(); await p.waitForTimeout(300); await p.tap('#tContinue'); await p.waitForTimeout(400); await closeSheets(p);
    const t0 = mins(await p.textContent('#clock')); await p.waitForTimeout(4000);
    const t1 = mins(await p.textContent('#clock'));
    ok(dev + ': clock waits while she stands still (' + t0 + ' -> ' + t1 + ')', t1 === t0);
    // walk around: tap far-apart spots on the canvas
    const vp = p.viewportSize();
    for (const [x, y] of [[.15, .55], [.85, .75], [.2, .85], [.8, .5]]) { await closeSheets(p); await p.touchscreen.tap(vp.width * x, vp.height * y); await p.waitForTimeout(900); }
    const t2 = mins(await p.textContent('#clock'));
    ok(dev + ': clock moves while she walks (' + t1 + ' -> ' + t2 + ')', t2 > t1);
    // clock sheet
    await closeSheets(p); await p.tap('#clock'); await p.waitForTimeout(300);
    ok(dev + ': tapping the clock opens the clock sheet', (await p.textContent('#sheet')).includes('Gentle'));
    await p.tap('button[data-act="pace"][data-id="gentle"]'); await p.waitForTimeout(200);
    ok(dev + ': Gentle is selected', (await p.getAttribute('button[data-id="gentle"]', 'aria-selected')) === 'true');
    await p.screenshot({ path: 'clock-' + dev.replace(' ', '') + '.png' });
    await p.tap('button[data-act="close"]'); await p.waitForTimeout(300);
    const saved = JSON.parse(await p.evaluate(k => localStorage.getItem(k), KEY));
    ok(dev + ': pace is saved', saved.pace === 'gentle');
    await p.reload(); await p.waitForTimeout(300); await p.tap('#tContinue'); await p.waitForTimeout(400); await closeSheets(p);
    await p.tap('#clock'); await p.waitForTimeout(300);
    ok(dev + ': pace survives a reload', (await p.getAttribute('button[data-id="gentle"]', 'aria-selected')) === 'true');
    await ctx.close();
  }
  await b.close();
  console.log(`\n${pass}/${pass + fail} passed; page errors: ${errs.length ? errs.join(' | ') : 'none'}`);
})();
