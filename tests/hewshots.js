// Phone checks for Hew: his letter in the mail, the tower in the Old Wood (walk there with a real tap), the tower
// sheet before and after the curse weakens, breaking it, a gift, the duel with real taps, and the ease setting.
// iPhone 13 and Pixel 7; screenshots (iPhone) go to shots/. Needs local.html (build_site.py with fake keys).
const { chromium, devices } = require('playwright'); const fs = require('fs');
fs.mkdirSync('shots', { recursive:true });
fs.writeFileSync('hewshot.html', fs.readFileSync('local.html', 'utf8').replace("requestAnimationFrame(frame);\n})();", "window.__h={get S(){return S},enterWood,closeSheet,openSheet,updateHUD,get sheet(){return sheetOpen},get ox(){return ox},get oy(){return oy},get T(){return T},set jt(v){journalTab=v},save,duelSpell,DUEL_SPELLS,HW};\nrequestAnimationFrame(frame);\n})();"));
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
(async () => {
  const b = await chromium.launch(), errs = [];
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    const ip = dev === 'iPhone 13';
    const ctx = await b.newContext(devices[dev]); await ctx.route('**/firestore.googleapis.com/**', r => r.fulfill({ status: 200, body: '{}' }));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(dev + ': ' + e.message));
    await p.goto('file://' + process.cwd() + '/hewshot.html'); await p.waitForTimeout(300);
    // an old save with no Hew at all, on the last evening of summer 12: he arrives the next morning
    const s = JSON.parse(fs.readFileSync('shot-save.json', 'utf8')); delete s.hew;
    Object.assign(s, { year:2, season:1, day:12, time:1300, energy:80, coins:3000, slots:3 }); s.cloud = { name:'test-save-name-01', intro:true };
    s.inv = Object.assign(s.inv || {}, { salve:1, cordial:1, jam:1, risotto:1 });
    await p.evaluate(v => localStorage.setItem('brambleroot-save-v1', v), JSON.stringify(s));
    await p.reload(); await p.waitForTimeout(300); await p.tap('#tContinue'); await p.waitForTimeout(500);
    const close = async () => { for (let i = 0; i < 6; i++) { if (await p.isHidden('#sheet')) return; await p.tap('#shClose').catch(() => {}); await p.waitForTimeout(150); } };
    await close(); await p.waitForTimeout(1500); await close();
    // sleep: the morning brings Hew's letters
    await p.tap('#bSleep'); await p.waitForTimeout(250); await p.tap('button[data-act="sleep"]'); await p.waitForTimeout(1500);
    ok(dev + ': Hew arrives with a letter and a curse', await p.evaluate(() => window.__h.S.mail.some(m => m.id === 'hewintro') && !!window.__h.HW().cur));
    await close(); await p.waitForTimeout(300);
    await p.evaluate(() => { window.__h.jt = 'mail'; window.__h.openSheet('journal'); }); await p.waitForTimeout(250);
    await p.tap('button[data-act="letter"][data-i="0"]'); await p.waitForTimeout(250);
    ok(dev + ': his curse letter opens', /Hew the Almighty/.test(await p.innerHTML('#shBody')));
    if (ip) await p.screenshot({ path: 'shots/hewletter.png' });
    await close();
    // walk to the tower with a real tap
    await p.evaluate(() => { window.__h.enterWood(); }); await p.waitForTimeout(800); await close();
    if (ip) await p.screenshot({ path: 'shots/hewwood.png' });
    const [tx, ty] = await p.evaluate(() => { const h = window.__h; return [h.ox + 8.5 * h.T, h.oy + 4.5 * h.T]; });
    await p.touchscreen.tap(tx, ty); for (let i = 0; i < 30 && await p.isHidden('#sheet'); i++) await p.waitForTimeout(200);
    ok(dev + ': tapping the tower walks there and opens it', await p.evaluate(() => window.__h.sheet === 'hew'));
    const t1 = await p.innerHTML('#shBody'); ok(dev + ': curse holds firm before it weakens', /holds firm/.test(t1) && !/undefined|NaN/.test(t1));
    if (ip) await p.screenshot({ path: 'shots/hewtower.png' });
    await p.tap('button[data-act="hewtalk"]'); await p.waitForTimeout(250); ok(dev + ': chat with Hew', /Chatted today/.test(await p.innerHTML('#shBody')));
    await close();
    // jump to the weak day and break it
    await p.evaluate(() => { const h = window.__h, H = h.HW(); h.S.day = H.cur.weak; h.S.inv[H.cur.counter] = 1; h.openSheet('hew'); }); await p.waitForTimeout(250);
    if (ip) await p.screenshot({ path: 'shots/hewweak.png' });
    const c0 = await p.evaluate(() => window.__h.S.coins);
    await p.tap('button[data-act="hewbreak"]'); await p.waitForTimeout(300);
    ok(dev + ': breaking the curse pays out', await p.evaluate(c => window.__h.HW().cur.broken && window.__h.S.coins === c + 400, c0));
    await close();
    // a gift he secretly loves
    await p.evaluate(() => window.__h.openSheet('hew')); await p.waitForTimeout(200); await p.tap('button[data-act="hewgive"]'); await p.waitForTimeout(200);
    await p.tap('button[data-act="hewgift"][data-id="risotto"]'); await p.waitForTimeout(250);
    const gh = await p.innerHTML('#shBody'); ok(dev + ': he loves the risotto', /best thing I've ever eaten/.test(gh));
    if (ip) await p.screenshot({ path: 'shots/hewgift.png' });
    await close();
    // the duel, with real taps on the right answers
    await p.evaluate(() => { const H = window.__h.HW(); H.fr = 1000; H.dating = true; H.broken = 4; window.__h.openSheet('hew'); }); await p.waitForTimeout(250);
    await p.tap('button[data-act="hewduel"]'); await p.waitForTimeout(250);
    if (ip) await p.screenshot({ path: 'shots/hewduel.png' });
    for (let i = 0; i < 5 && await p.locator('button[data-act="duel"]').count(); i++) {
      const el = await p.evaluate(() => { const h = window.__h, st = h.sheet === 'hewduel' && document.querySelector('.vhead .meta').textContent.match(/Round (\d)/); return h.DUEL_SPELLS[h.duelSpell(+st[1] - 1)].beat; });
      await p.tap(`button[data-act="duel"][data-id="${el}"]`); await p.waitForTimeout(250);
    }
    ok(dev + ': winning the duel with taps', await p.evaluate(() => window.__h.HW().duel === true) && /Bramble would have been proud/.test(await p.innerHTML('#shBody')));
    if (ip) await p.screenshot({ path: 'shots/hewduelwon.png' });
    await close();
    // ease setting in the sleep sheet
    await p.tap('#bSleep'); await p.waitForTimeout(250); await p.tap('button[data-act="hewease"]'); await p.waitForTimeout(250);
    ok(dev + ': ease setting toggles', await p.evaluate(() => window.__h.HW().ease === true) && /eased/.test(await p.innerHTML('#shBody')));
    await close();
    await p.evaluate(() => window.__h.save()); const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('brambleroot-save-v1') || '{}'));
    ok(dev + ': saved', saved.hew && saved.hew.broken === 4 && saved.hew.duel && saved.hew.ease);
    await ctx.close();
  }
  ok('no page errors', !errs.length); if (errs.length) console.log(errs.join('\n'));
  console.log(`${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0);
})();
