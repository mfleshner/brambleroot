const { chromium, devices } = require('playwright'); const fs = require('fs');
const data = fs.readFileSync('her.json','utf8');
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
(async () => {
  const b = await chromium.launch(), errs = [];
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    const ctx = await b.newContext(devices[dev]); await ctx.route('**/firestore.googleapis.com/**', r => r.fulfill({ status:200, body:'{}' }));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(dev + ': ' + e.message));
    await p.goto('file://' + process.cwd() + '/local3.html'); await p.waitForTimeout(200);
    await p.evaluate(v => localStorage.setItem('brambleroot-save-v1', v), data); await p.reload(); await p.waitForTimeout(400);
    await p.tap('#tContinue'); await p.waitForTimeout(1500);
    const close = async () => { for (let i = 0; i < 8; i++) { if (await p.isHidden('#sheet')) return; await p.tap('#shClose').catch(() => {}); await p.waitForTimeout(150); } };
    await close(); await p.waitForTimeout(1500); await close();
    await p.tap('#bJournal'); await p.waitForTimeout(300);
    const vt = await p.$('[data-act="jtab"][data-id="village"]'); if (vt) { await vt.tap(); await p.waitForTimeout(300); }
    const h = await p.innerHTML('#shBody');
    ok(dev + ': Hew card at the top of the village list', /Hew the Almighty/.test(h) && /Sluggard|curse/i.test(h) && h.indexOf('Hew the Almighty') < h.indexOf('class="vrow"') && !/undefined|NaN/.test(h));
    if (dev === 'iPhone 13') await p.screenshot({ path: 'hewcard.png' });
    await p.tap('button[data-act="hewseek"]');
    let opened = false; for (let i = 0; i < 40 && !opened; i++) { await p.waitForTimeout(300); opened = (await p.isVisible('#sheet')) && (await p.textContent('#shTitle')) === "Hew's tower"; }
    ok(dev + ': "Go to his tower" walks through the gate and opens his tower', opened);
    if (dev === 'iPhone 13') await p.screenshot({ path: 'hewtower.png' });
    await ctx.close();
  }
  ok('no page errors', !errs.length); if (errs.length) console.log(errs.join('\n'));
  console.log(`${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0);
})();
