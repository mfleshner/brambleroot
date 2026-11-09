// Phone checks and screenshots for the deep Hollow, Part 3: the three new bands and the Endless Below, the Steward,
// the Moon Moth, calming the Heart by tapping it, the finale sheet, wardrobe treasures, the lift sheet past 100 and
// the Almanac record. iPhone 13 and Pixel 7; screenshots (iPhone) go to shots/. Needs local.html (build_site.py with fake keys).
const { chromium, devices } = require('playwright'); const fs = require('fs');
fs.mkdirSync('shots', { recursive:true });
fs.writeFileSync('hollowshot3.html', fs.readFileSync('local.html', 'utf8').replace("requestAnimationFrame(frame);\n})();", "window.__h={get S(){return S},get HV(){return HV},enterHollow,addMob,closeSheet,openSheet,updateHUD,get sheet(){return sheetOpen},MOBS,get ox(){return ox},get oy(){return oy},get T(){return T},set jt(v){journalTab=v},save};\nrequestAnimationFrame(frame);\n})();"));
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
(async () => {
  const b = await chromium.launch(), errs = [];
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    const ip = dev === 'iPhone 13';
    const ctx = await b.newContext(devices[dev]); await ctx.route('**/firestore.googleapis.com/**', r => r.fulfill({ status: 200, body: '{}' }));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(dev + ': ' + e.message));
    await p.goto('file://' + process.cwd() + '/hollowshot3.html'); await p.waitForTimeout(300);
    // a Part 2 save: every Warden to 70 beaten, deepest floor 70
    const s = JSON.parse(fs.readFileSync('shot-save.json', 'utf8')); Object.assign(s, { day:13, time:600, hollowMax:70, grove:true }); s.cloud = { name:'test-save-name-01', intro:true };
    s.spells = [...new Set([...(s.spells || []), 'firebolt', 'frost'])];
    s.hollow = { wardens:{ 10:true, 20:true, 30:true, 40:true, 50:true, 60:true, 70:true }, pages:{ 10:true, 20:true, 30:true, 40:true, 50:true, 60:true, 70:true } };
    await p.evaluate(v => localStorage.setItem('brambleroot-save-v1', v), JSON.stringify(s));
    await p.reload(); await p.waitForTimeout(300); await p.tap('#tContinue'); await p.waitForTimeout(500);
    const close = async () => { for (let i = 0; i < 6; i++) { if (await p.isHidden('#sheet')) return; await p.tap('#shClose').catch(() => {}); await p.waitForTimeout(150); } };
    await close(); await p.waitForTimeout(1800); await close();
    ok(dev + ': Part 2 save loads at floor 70 with seven relics', await p.evaluate(() => window.__h.S.hollowMax === 70 && Object.keys(window.__h.S.hollow.relics).length === 7));
    const go = async (f, kinds, name, setup) => {
      await p.evaluate(([f, kinds, setup]) => { const h = window.__h; h.S.scene = 'wood'; h.S.mana = 60; h.S.energy = 200; h.S.hollowMax = Math.max(h.S.hollowMax, f); h.enterHollow(f); while (h.sheet) h.closeSheet();
        if (kinds) { h.HV.mobs = []; h.HV.warden = null; kinds.forEach((k, i) => { const m = h.addMob(k, 1 + (i % 3) * 3, 1.5 + Math.floor(i / 3) * 3); if (k !== 'mimic' || i) m.asleep = false; m.ph = .5; }); }
        else if (setup === 'warden') { h.HV.mobs = h.HV.mobs.filter(m => h.MOBS[m.k].warden); h.HV.warden.ph = 1; } h.updateHUD(); }, [f, kinds, setup]);
      await p.waitForTimeout(900); await close(); if (ip) await p.screenshot({ path: 'shots/' + name + '.png' });
    };
    await go(73, ['mimic', 'ghost', 'stonegolem', 'mimic', 'ghost', 'stonegolem'], 'guildruins');
    ok(dev + ': Guild Ruins floor drawn', await p.evaluate(() => window.__h.HV && window.__h.HV.floor === 73));
    await go(83, ['starmoth', 'starmoth', 'starmoth', 'cometslime', 'voidbat', 'cometslime'], 'starfall');
    await go(93, ['hound', 'elderslime', 'heartwisp', 'hound', 'ghost', 'frog'], 'heartband');
    for (const [f, nm] of [[80, 'steward'], [90, 'moonmoth']]) { await go(f, null, nm, 'warden'); ok(`${dev}: warden on floor ${f}`, await p.evaluate(k => !!window.__h.HV && window.__h.HV.warden && window.__h.HV.warden.k === k, nm)); }
    // floor 100: tap the Heart (with real taps) until it calms
    await p.evaluate(() => { const h = window.__h; Object.assign(h.S.hollow.wardens, { 80:true, 90:true }); h.S.scene = 'wood'; h.S.mana = 60; h.S.energy = 300; h.S.hollowMax = 99; h.enterHollow(100); while (h.sheet) h.closeSheet(); h.HV.mobs = [h.HV.warden]; h.HV.warden.hp = 3; });
    await p.waitForTimeout(400); if (ip) await p.screenshot({ path: 'shots/heart.png' });
    for (let i = 0; i < 12 && await p.evaluate(() => !!(window.__h.HV && window.__h.HV.warden)); i++) {
      const [x, y] = await p.evaluate(() => { const h = window.__h, m = h.HV.warden; return [h.ox + (m.x + .5) * h.T, h.oy + (m.y + .5 - .2 * 2.6) * h.T]; });
      await p.touchscreen.tap(x, y); await p.waitForTimeout(450);
    }
    ok(dev + ': tapping the Heart calms it', await p.evaluate(() => window.__h.S.hollow.wardens[100] === true && window.__h.sheet === 'finale'));
    ok(dev + ': no toast over the finale', await p.isHidden('#toast'));
    const fin = await p.innerHTML('#shBody'); ok(dev + ': finale sheet', /last page/i.test(fin) && /With all my love/.test(fin) && !/undefined|NaN/.test(fin));
    if (ip) { await p.screenshot({ path: 'shots/finale.png' }); await p.setViewportSize({ width: 390, height: 2000 }); await p.waitForTimeout(200); await p.screenshot({ path: 'shots/finale-full.png' }); await p.setViewportSize(devices[dev].viewport); }
    await p.tap('button[data-act="close"]'); await p.waitForTimeout(1200); if (ip) await p.screenshot({ path: 'shots/bloom.png' });
    ok(dev + ': back in the Hollow, in flower', await p.evaluate(() => window.__h.S.scene === 'hollow' && window.__h.HV.bloom > 0 && !window.__h.sheet));
    await go(113, null, 'endless');
    ok(dev + ': Endless Below floor', await p.evaluate(() => window.__h.HV && window.__h.HV.floor === 113));
    // lift sheet past 100
    await p.evaluate(() => { const h = window.__h; h.S.scene = 'wood'; h.openSheet('cave'); }); await p.waitForTimeout(300);
    const lift = await p.innerHTML('#shBody'); ok(dev + ': lift grid has the Endless Below and the last page', /The Endless Below/.test(lift) && /The last page/.test(lift) && /Floor 110/.test(lift) && !/undefined|NaN/.test(lift));
    if (ip) { await p.setViewportSize({ width: 390, height: 3000 }); await p.waitForTimeout(200); await p.screenshot({ path: 'shots/lift113.png' }); await p.setViewportSize(devices[dev].viewport); }
    await close();
    // the mirror: wear the treasures with real taps
    await p.evaluate(() => { const h = window.__h; h.S.scene = 'farm'; h.updateHUD(); h.openSheet('wardrobe'); }); await p.waitForTimeout(300);
    const nBtn = await p.locator('button[data-act="wear"]').count(); ok(dev + ': mirror offers five treasures', nBtn === 5);
    for (const k of ['cloak', 'bloom', 'circlet']) { await p.tap(`button[data-act="wear"][data-id="${k}"]`); await p.waitForTimeout(150); }
    ok(dev + ': tapping a treasure wears it', await p.evaluate(() => ['cloak', 'bloom', 'circlet'].every(k => window.__h.S.look.wear.includes(k))) && (await p.getAttribute('button[data-act="wear"][data-id="cloak"]', 'aria-pressed')) === 'true');
    if (ip) await p.screenshot({ path: 'shots/mirror.png' });
    await p.tap('button[data-act="wear"][data-id="circlet"]'); await p.waitForTimeout(150); ok(dev + ': tap again to take it off', await p.evaluate(() => !window.__h.S.look.wear.includes('circlet')));
    await close(); if (ip) await p.screenshot({ path: 'shots/farm-dressed.png' });
    // Almanac record
    await p.evaluate(() => { const h = window.__h; h.jt = 'almanac'; h.openSheet('journal'); }); await p.waitForTimeout(250);
    ok(dev + ': Almanac shows the record', /Deepest floor of the Hollow: 113/.test(await p.innerHTML('#shBody'))); await close();
    // and the save keeps it all
    const saved = await p.evaluate(() => (window.__h.save(), 0) || JSON.parse(localStorage.getItem('brambleroot-save-v1') || '{}'));
    ok(dev + ': saved', saved.hollowMax === 113 && saved.hollow && saved.hollow.wardens[100] && saved.look && saved.look.wear.includes('cloak'));
    await ctx.close();
  }
  ok('no page errors', !errs.length); if (errs.length) console.log(errs.join('\n'));
  console.log(`${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0);
})();
