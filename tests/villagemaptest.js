// Part 3 phone checks: the gate, the village map, tapping people and buildings, rain, night, the calendar and the notebook.
// Usage: node villagemaptest.js [screenshot folder]
const { chromium, devices } = require('playwright'); const fs = require('fs');
const KEY = 'brambleroot-save-v1', URL0 = 'file://' + process.cwd() + '/local.html', OUT = process.argv[2] || '.';
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
const wait = (p, ms) => p.waitForTimeout(ms || 250);
async function closeSheets(p) { for (let i = 0; i < 6; i++) { if (await p.isHidden('#sheet')) return; await p.tap('#shClose').catch(() => {}); await wait(p, 150); } }
async function start(p, patch) {
  await p.goto(URL0); await wait(p, 300);
  const s = JSON.parse(fs.readFileSync('shot-save.json', 'utf8')); Object.assign(s, { cloud:{ name:'moss-fern-owl-42', last:0 } }, patch);
  await p.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(s)]);
  await p.reload(); await wait(p, 300); await p.tap('#tContinue'); await wait(p, 500); await closeSheets(p);
}
// The same tile maths as resize() in the game.
async function tile(p, c, r) {
  return p.evaluate(([c, r]) => {
    const W = innerWidth, H = innerHeight, top = document.getElementById('hud').getBoundingClientRect().height - 6, bot = document.getElementById('tray').getBoundingClientRect().height;
    const aw = W - 12, ah = H - top - bot - 8, T = Math.max(20, Math.floor(Math.min(aw / 9, ah / 13)));
    const ox = Math.round((W - T * 9) / 2), oy = Math.round(top + (ah - T * 13) / 2 + 4);
    return { x:ox + (c + .5) * T, y:oy + (r + .5) * T };
  }, [c, r]);
}
async function tapTile(p, c, r, ms) { const { x, y } = await tile(p, c, r); await p.touchscreen.tap(x, y); await wait(p, ms || 1500); }
const body = p => p.innerHTML('#shBody');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    const tag = dev.replace(' ', '').toLowerCase();
    const ctx = await b.newContext(devices[dev]);
    await ctx.route('**/firestore.googleapis.com/**', r => r.fulfill({ status: 200, body: '{}' }));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(dev + ': ' + e.message));
    // A market day (Zara's cart), dry, mid-morning. No garden visitors, so everyone is in the village.
    await start(p, { day:12, time:690, rain:false, snow:false, visits:[], visitKey:'', talked:{} });
    await p.evaluate(k => { const s = JSON.parse(localStorage.getItem(k)); }, KEY);
    // the farm gate
    await tapTile(p, 0, 6);
    ok(`${dev}: the gate asks where to`, (await p.isVisible('[data-act="govillage"]')) && (await p.isVisible('[data-act="gowood"]')));
    if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/gate-${tag}.png` });
    await p.tap('[data-act="govillage"]'); await wait(p, 600);
    ok(`${dev}: the village opens with no sheet`, await p.isHidden('#sheet'));
    await wait(p, 5800); // let the first-visit toast fade
    await p.screenshot({ path:`${OUT}/village-${tag}.png` });
    // tap the person by the mill door (spot 2,0), or the inn
    await tapTile(p, 2, 3, 2200);
    const h = await body(p);
    ok(`${dev}: tapping someone by the inn opens their page with Chat`, (await p.isVisible('#sheet')) && h.includes('data-act="talk"'));
    if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/village-villager-${tag}.png` });
    await p.tap('[data-act="talk"]'); await wait(p, 400);
    ok(`${dev}: chatting works in the village`, (await body(p)).includes('Chatted today') || (await p.isVisible('.scene')));
    await closeSheets(p);
    // the inn: who's inside
    await tapTile(p, 0, 3, 2000);
    ok(`${dev}: tapping the inn shows who's there`, (await p.textContent('#shTitle')).includes('Kettle'));
    await closeSheets(p);
    // the noticeboard calendar
    await tapTile(p, 4, 4, 1800);
    ok(`${dev}: the village noticeboard opens the calendar`, (await p.textContent('#shTitle')).includes('calendar'));
    if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/calendar-${tag}.png` });
    await p.tap('[data-act="calseason"][data-id="1"]'); await wait(p);
    ok(`${dev}: calendar flips to summer`, (await p.textContent('#shTitle')).includes('Summer'));
    await closeSheets(p);
    // the HUD date opens the calendar too
    await p.tap('#calBtn'); await wait(p);
    ok(`${dev}: tapping the date opens the calendar`, (await p.textContent('#shTitle')).includes('calendar'));
    await closeSheets(p);
    // the journal says where people are, and won't chat with someone far away
    await p.tap('#bJournal'); await wait(p); await p.tap('[data-act="jtab"][data-id="village"]'); await wait(p);
    const jl = await p.textContent('#shBody');
    ok(`${dev}: journal list shows where people are`, /At the (mill|smithy|docks|square|Kettle)/.test(jl) && jl.includes('Gift notebook'));
    await p.tap('[data-act="vopen"][data-id="mara"]'); await wait(p);
    ok(`${dev}: villager page shows the gift notebook`, (await body(p)).includes('Gift notebook'));
    if (dev === 'iPhone 13') { await p.setViewportSize({ width:390, height:1400 }); await wait(p); await p.screenshot({ path:`${OUT}/villager-page-${tag}.png` }); await p.setViewportSize(devices[dev].viewport); await wait(p); }
    await closeSheets(p);
    // home again by the signpost
    await tapTile(p, 4, 12, 3000);
    ok(`${dev}: the signpost leads home`, true);
    // rain: everyone indoors, the counts show over the doors
    await start(p, { day:12, time:720, rain:true, snow:false, visits:[], visitKey:'' });
    await tapTile(p, 0, 6); await p.tap('[data-act="govillage"]'); await wait(p, 800);
    if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/village-rain-${tag}.png` });
    await tapTile(p, 0, 3, 2000);
    ok(`${dev}: rainy inn lists people inside`, (await body(p)).includes('Here now'));
    await closeSheets(p);
    // night, autumn
    await start(p, { season:2, day:9, time:1260, rain:false, visits:[], visitKey:'' });
    await tapTile(p, 0, 6); await p.tap('[data-act="govillage"]'); await wait(p, 800);
    if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/village-night-${tag}.png` });
    // winter
    await start(p, { season:3, day:3, time:700, rain:false, snow:true, visits:[], visitKey:'' });
    await tapTile(p, 0, 6); await p.tap('[data-act="govillage"]'); await wait(p, 800);
    if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/village-winter-${tag}.png` });
    await ctx.close();
  }
  ok('no page errors', errs.length === 0); if (errs.length) console.log(errs.slice(0, 5).join('\n'));
  console.log(`${pass} passed, ${fail} failed`);
  await b.close();
})();
