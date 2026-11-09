// Screenshots of the deep Hollow (Part 1) on an iPhone 13: floors 12 and 25, the three Wardens, the lift sheet. Writes to shots/.
// Builds hollowshot.html from local.html with a window.__h hook, so it can drop straight onto a floor.
const { chromium, devices } = require('playwright'); const fs = require('fs');
fs.mkdirSync('shots', { recursive:true });
fs.writeFileSync('hollowshot.html', fs.readFileSync('local.html', 'utf8').replace("requestAnimationFrame(frame);\n})();", "window.__h={get S(){return S},get HV(){return HV},enterHollow,addMob,closeSheet,openSheet,get sheet(){return sheetOpen},MOBS};\nrequestAnimationFrame(frame);\n})();"));
(async () => {
  const b = await chromium.launch(), errs = [];
  const ctx = await b.newContext(devices['iPhone 13']); await ctx.route('**/firestore.googleapis.com/**', r => r.fulfill({ status: 200, body: '{}' }));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/hollowshot.html'); await p.waitForTimeout(300);
  const s = JSON.parse(fs.readFileSync('shot-save.json', 'utf8')); Object.assign(s, { day:13, time:600, hollowMax:30, grove:true }); s.cloud = { name:'test-save-name-01', intro:true };
  s.spells = [...new Set([...(s.spells || []), 'firebolt', 'frost'])];
  await p.evaluate(v => localStorage.setItem('brambleroot-save-v1', v), JSON.stringify(s));
  await p.reload(); await p.waitForTimeout(300); await p.tap('#tContinue'); await p.waitForTimeout(500);
  const close = async () => { for (let i = 0; i < 6; i++) { if (await p.isHidden('#sheet')) return; await p.tap('#shClose').catch(() => {}); await p.waitForTimeout(150); } };
  await close(); await p.waitForTimeout(1800); await close();
  const shot = async (f, kinds, name, setup) => {
    await p.evaluate(([f, kinds, setup]) => { const h = window.__h; h.S.scene = 'wood'; h.S.mana = 60; h.S.energy = 200; h.enterHollow(f); while (h.sheet) h.closeSheet();
      if (kinds) { h.HV.mobs = []; h.HV.warden = null; kinds.forEach((k, i) => { const m = h.addMob(k, 1 + (i % 3) * 3, 1.5 + Math.floor(i / 3) * 3); if (setup === 'awake') m.asleep = false; }); }
      else if (setup === 'warden') { h.HV.mobs = h.HV.mobs.filter(m => h.MOBS[m.k].warden); } }, [f, kinds, setup]);
    await p.waitForTimeout(700); await p.screenshot({ path: 'shots/' + name + '.png' });
  };
  await shot(12, ['puffcap', 'glowworm', 'sporeslime', 'puffcap', 'bat', 'slime'], 'grotto');
  await shot(25, ['shardcrab', 'sprite', 'geode', 'glowworm', 'beetle', 'shardcrab'], 'caves');
  await p.evaluate(() => { const H = window.__h.S.hollow; delete H.wardens[10]; delete H.wardens[20]; delete H.wardens[30]; H.tries = {}; H.wh = {}; });
  await shot(10, null, 'mossback', 'warden'); await shot(20, null, 'puffball', 'warden'); await shot(30, null, 'queen', 'warden');
  await p.evaluate(() => { const H = window.__h.S.hollow; H.wardens = { 10:true, 20:true }; H.pages = { 10:true, 20:true }; window.__h.S.scene = 'wood'; window.__h.openSheet('cave'); });
  await p.waitForTimeout(300); await p.setViewportSize({ width: 390, height: 2000 }); await p.waitForTimeout(200); await p.screenshot({ path: 'shots/lift.png' });
  console.log('errors:', errs.length ? errs.join(' | ') : 'none'); await b.close();
})();
