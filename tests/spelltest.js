const { chromium, devices } = require('playwright'); const fs=require('fs');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'] }); await ctx.route('**/firestore.googleapis.com/**', r => r.fulfill({ status:200, body:'{}' }));
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/fishtest.html'); await p.evaluate(s => localStorage.setItem('brambleroot-save-v1', s), fs.readFileSync('shot-save.json','utf8')); await p.reload(); await p.waitForTimeout(300);
  await p.tap('#tContinue'); await p.waitForTimeout(300); for (let i=0;i<10 && await p.isVisible('#sheet');i++){ await p.tap('#shClose'); await p.waitForTimeout(80); }
  await p.evaluate(() => __spells()); await p.waitForTimeout(200); await p.tap('[data-act="cast"][data-id="hearth"]'); await p.waitForTimeout(200);
  const st = await p.evaluate(() => __st()); console.log('Hearth cast from spellbook: energy 10 ->', st.energy, ', mana 25 ->', st.mana); console.log('errors:', errs.length ? errs : 'none'); await b.close(); })();
