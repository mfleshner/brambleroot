// Fishing on a phone (iPhone 13, Pixel 7): cast, tap Reel by touch the moment the marker reaches the green zone, check
// catches land in the bag and the fish journal, a late-night cast, then the journal from the almanac (+ screenshots).
// Needs fishtest.html (a keyless build with __pond/__st/__set hooks) and shot-save.json. Usage: node fishphone.js [shots]
const { chromium, devices } = require('playwright'); const fs = require('fs'); const OUT = process.argv[2] || '.';
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
(async () => {
  const b = await chromium.launch();
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    const ctx = await b.newContext({ ...devices[dev] }); await ctx.route('**/firestore.googleapis.com/**', r => r.fulfill({ status:200, body:'{}' }));
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + process.cwd() + '/fishtest.html'); await p.evaluate(s => localStorage.setItem('brambleroot-save-v1', s), fs.readFileSync('shot-save.json', 'utf8')); await p.reload(); await p.waitForTimeout(300);
    await p.tap('#tContinue'); await p.waitForTimeout(400); for (let i = 0; i < 10 && await p.isVisible('#sheet'); i++) { await p.tap('#shClose'); await p.waitForTimeout(80); }
    await p.evaluate(() => __set({ time:700, rain:false })); await p.evaluate(() => __pond()); await p.waitForTimeout(200);
    ok(`${dev}: pond text mentions the journal`, /kinds in your fish journal/.test(await p.textContent('#shBody')));
    const before = await p.evaluate(() => __st()); let caught = 0;
    for (let k = 0; k < 8; k++) {
      await p.tap('[data-act="fishcast"]'); await p.waitForSelector('#fishMark', { timeout:5000 });
      if (k === 0 && dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/fish-reel.png` });
      for (let i = 0; i < 400; i++) { const inZ = await p.evaluate(() => { const m = document.getElementById('fishMark'), z = document.querySelector('.zone'); if (!m || !z) return null; const l = parseFloat(m.style.left), zl = parseFloat(z.style.left), zw = parseFloat(z.style.width); return l > zl + 2 && l < zl + zw - 2; }); if (inZ) break; await p.waitForTimeout(8); }
      await p.tap('.reel'); await p.waitForTimeout(200);
      if (/Caught/.test(await p.textContent('#shBody'))) caught++;
    }
    if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/fish-caught.png` });
    const after = await p.evaluate(() => __st());
    ok(`${dev}: caught most fish by touch (${caught} of 8)`, caught >= 6);
    ok(`${dev}: catches in the bag and journal`, after.fish - before.fish === caught && Object.values(after.log).reduce((a, c) => a + c, 0) === caught && after.caught - before.caught === caught);
    ok(`${dev}: 3 energy a cast`, before.energy - after.energy === 24);
    // A slow hand: wait 7 s (longer than the old 6 s) before reeling; the fish should still be on.
    await p.tap('[data-act="fishcast"]'); await p.waitForSelector('#fishMark', { timeout:5000 }); await p.waitForTimeout(7000);
    ok(`${dev}: the fish is still on after 7 seconds`, await p.isVisible('.reel'));
    await p.tap('.reel'); await p.waitForTimeout(200);
    await p.tap('[data-act="close"]'); await p.waitForTimeout(200);
    // The journal from the almanac.
    await p.evaluate(() => { __set({ fishLog:Object.assign({ bramble:1, fireeel:2, koi:1 }, __st().log) }); }); await p.evaluate(() => { journalTab = 'almanac'; }).catch(() => {});
    await p.tap('#bJournal').catch(() => {}); await p.waitForTimeout(300);
    const alm = await p.$('[data-tab="almanac"],[data-act="jtab"][data-id="almanac"]'); if (alm) { await alm.tap(); await p.waitForTimeout(250); }
    const fl = await p.$('[data-act="fishlog"]'); ok(`${dev}: almanac has the fish journal`, !!fl);
    if (fl) { await fl.tap(); await p.waitForTimeout(300); const t = await p.textContent('#shBody'); ok(`${dev}: journal lists caught and unknown fish`, /Old Bramblejaw/.test(t) && /Firefly Eel/.test(t) && /\?\?\?/.test(t)); if (dev === 'iPhone 13') { await p.screenshot({ path:`${OUT}/fish-journal.png` }); await p.evaluate(() => document.getElementById('shBody').scrollTop = 99999); await p.waitForTimeout(150); await p.screenshot({ path:`${OUT}/fish-journal-end.png` }); }
      await p.tap('[data-act="fbback"]'); await p.waitForTimeout(250); ok(`${dev}: back to the almanac`, !!(await p.$('[data-act="fishlog"]'))); }
    ok(`${dev}: no page errors`, !errs.length); if (errs.length) console.log(errs);
    await ctx.close();
  }
  await b.close(); console.log(`fishphone: ${pass} passed, ${fail} failed`);
})();
