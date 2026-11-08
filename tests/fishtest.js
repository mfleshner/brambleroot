const { chromium, devices } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'] });
  await ctx.route('**/firestore.googleapis.com/**', r => r.fulfill({ status:200, body:'{}' }));
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/fishtest.html'); await p.evaluate(s => localStorage.setItem('brambleroot-save-v1', s), fs.readFileSync('shot-save.json','utf8')); await p.reload(); await p.waitForTimeout(300);
  await p.tap('#tContinue'); await p.waitForTimeout(300); for (let i=0;i<10 && await p.isVisible('#sheet');i++){ await p.tap('#shClose'); await p.waitForTimeout(80); }
  await p.evaluate(() => __pond()); await p.waitForTimeout(200);
  const before = await p.evaluate(() => __st());
  await p.tap('[data-act="fishcast"]'); await p.waitForTimeout(150);
  console.log('after Cast:', (await p.textContent('#shBody')).slice(0, 60), '| title:', await p.textContent('#shTitle'));
  let caught = 0;
  for (let k = 0; k < 4; k++) {
    await p.waitForSelector('#fishMark', { timeout: 5000 });
    // reel when marker is inside the zone
    for (let i = 0; i < 300; i++) { const inZone = await p.evaluate(() => { const m = document.getElementById('fishMark'), z = document.querySelector('.zone'); if (!m || !z) return null; const l = parseFloat(m.style.left), zl = parseFloat(z.style.left), zw = parseFloat(z.style.width); return l > zl + 1 && l < zl + zw - 1; }); if (inZone) break; await p.waitForTimeout(10); }
    await p.tap('.reel'); await p.waitForTimeout(250);
    const t = await p.textContent('#shBody'); if (!/got away|slipped/i.test(t)) caught++;
    console.log(' cast', k + 1, '->', t.match(/[^.!]*[.!]/)?.[0]);
    if (k < 3) await p.tap('[data-act="fishcast"]');
  }
  const after = await p.evaluate(() => __st());
  console.log('energy', before.energy, '->', after.energy, '| fish in bag', before.fish, '->', after.fish, '| mana unchanged', before.mana === after.mana);
  console.log('errors:', errs.length ? errs : 'none'); await b.close();
})();
