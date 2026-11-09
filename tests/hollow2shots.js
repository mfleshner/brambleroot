// Phone checks and screenshots for the deep Hollow, Part 2: the four new bands, their Wardens, the pouch button,
// the lift sheet to floor 70 and the relic shelf. iPhone 13 and Pixel 7; screenshots (iPhone) go to shots/.
const { chromium, devices } = require('playwright'); const fs = require('fs');
fs.mkdirSync('shots', { recursive:true });
fs.writeFileSync('hollowshot.html', fs.readFileSync('local.html', 'utf8').replace("requestAnimationFrame(frame);\n})();", "window.__h={get S(){return S},get HV(){return HV},enterHollow,addMob,closeSheet,openSheet,updateHUD,get sheet(){return sheetOpen},MOBS};\nrequestAnimationFrame(frame);\n})();"));
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
(async () => {
  const b = await chromium.launch(), errs = [];
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    const ip = dev === 'iPhone 13';
    const ctx = await b.newContext(devices[dev]); await ctx.route('**/firestore.googleapis.com/**', r => r.fulfill({ status: 200, body: '{}' }));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(dev + ': ' + e.message));
    await p.goto('file://' + process.cwd() + '/hollowshot.html'); await p.waitForTimeout(300);
    const s = JSON.parse(fs.readFileSync('shot-save.json', 'utf8')); Object.assign(s, { day:13, time:600, hollowMax:30, grove:true }); s.cloud = { name:'test-save-name-01', intro:true };
    s.spells = [...new Set([...(s.spells || []), 'firebolt', 'frost'])]; s.hollow = { wardens:{ 10:true, 20:true, 30:true }, pages:{ 10:true, 20:true, 30:true } };
    s.inv = Object.assign(s.inv || {}, { manadraught:4 });
    await p.evaluate(v => localStorage.setItem('brambleroot-save-v1', v), JSON.stringify(s));
    await p.reload(); await p.waitForTimeout(300); await p.tap('#tContinue'); await p.waitForTimeout(500);
    const close = async () => { for (let i = 0; i < 6; i++) { if (await p.isHidden('#sheet')) return; await p.tap('#shClose').catch(() => {}); await p.waitForTimeout(150); } };
    await close(); await p.waitForTimeout(1800); await close();
    ok(dev + ': old save gets relics for its three Wardens', await p.evaluate(() => { const r = window.__h.S.hollow.relics; return r.lantern && r.jar && r.crown; }));
    const go = async (f, kinds, name, setup) => {
      await p.evaluate(([f, kinds, setup]) => { const h = window.__h; h.S.scene = 'wood'; h.S.mana = 30; h.S.energy = 200; h.S.hollowMax = Math.max(h.S.hollowMax, f); h.enterHollow(f); while (h.sheet) h.closeSheet();
        if (kinds) { h.HV.mobs = []; h.HV.warden = null; kinds.forEach((k, i) => { const m = h.addMob(k, 1 + (i % 3) * 3, 1.5 + Math.floor(i / 3) * 3); m.asleep = false; m.ph = .5; }); }
        else if (setup === 'warden') { h.HV.mobs = h.HV.mobs.filter(m => h.MOBS[m.k].warden); h.HV.warden.ph = 1; } h.updateHUD(); }, [f, kinds, setup]);
      await p.waitForTimeout(700); await close(); if (ip) await p.screenshot({ path: 'shots/' + name + '.png' });
    };
    await go(33, ['frog', 'eel', 'snail', 'frog', 'shardcrab', 'eel'], 'underriver');
    ok(dev + ': pouch shows in the Hollow, board hidden', (await p.isVisible('#bPouch')) && (await p.isHidden('#bBoard')) && (await p.textContent('#pouchBadge')) === '3');
    const m0 = await p.evaluate(() => window.__h.S.mana); await p.tap('#bPouch'); await p.waitForTimeout(300);
    ok(dev + ': tapping the pouch drinks a draught', (await p.evaluate(() => window.__h.S.mana)) === m0 + 15 && (await p.textContent('#pouchBadge')) === '2');
    await go(43, ['thornling', 'rootworm', 'sapwisp', 'thornling', 'rootworm', 'puffcap'], 'roots');
    await go(53, ['salamander', 'cindermoth', 'cindermoth', 'cindermoth', 'magmaslime', 'salamander'], 'ember');
    await go(63, ['icewisp', 'golem', 'hare', 'icewisp', 'golem', 'sprite'], 'frozen');
    for (const [f, nm] of [[40, 'whiskers'], [50, 'briar'], [60, 'emberback'], [70, 'owl']]) { await go(f, null, nm, 'warden'); ok(`${dev}: warden on floor ${f}`, await p.evaluate(k => !!window.__h.HV && window.__h.HV.warden && window.__h.HV.warden.k === k, nm)); }
    // back out: board returns
    await p.evaluate(() => { const h = window.__h; h.S.scene = 'farm'; h.updateHUD(); });
    await p.evaluate(() => { window.__h.S.hollowMax = 70; Object.assign(window.__h.S.hollow.wardens, { 40:true, 50:true }); window.__h.S.hollow.pages[40] = true; window.__h.S.hollow.relics.bell = true; window.__h.S.scene = 'wood'; window.__h.openSheet('cave'); });
    await p.waitForTimeout(300); const lift = await p.innerHTML('#shBody');
    ok(dev + ': lift grid reaches floor 70', /Floor 70/.test(lift) && /Frozen Reach/.test(lift) && !/undefined|NaN/.test(lift));
    if (ip) { await p.setViewportSize({ width: 390, height: 2400 }); await p.waitForTimeout(200); await p.screenshot({ path: 'shots/lift70.png' }); await p.setViewportSize(devices[dev].viewport); }
    await close();
    await p.evaluate(() => { const h = window.__h; h.S.scene = 'farm'; h.openSheet('sleep'); }); await p.waitForTimeout(250);
    ok(dev + ': sleep sheet has the relic shelf', await p.isVisible('button[data-act="relics"]'));
    await p.tap('button[data-act="relics"]'); await p.waitForTimeout(300);
    const shelf = await p.innerHTML('#shBody'); ok(dev + ': relic shelf lists finds and empty spots', /Pearl Bell/.test(shelf) && /An empty spot/.test(shelf) && !/undefined|NaN/.test(shelf));
    if (ip) await p.screenshot({ path: 'shots/relics.png' });
    await close(); ok(dev + ': board back on the farm', await p.isVisible('#bBoard'));
    await ctx.close();
  }
  ok('no page errors', !errs.length); if (errs.length) console.log(errs.join('\n'));
  console.log(`${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0);
})();
