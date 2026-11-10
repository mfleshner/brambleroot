// Festival phone checks (iPhone 13 and Pixel 7): walk through the gate to the grounds, tap a stall, play its game by
// tapping the screen, come back to the stall, buy a prize, and screenshot every festival.
// Usage: node festphone.js [screenshot folder] [game ids, comma separated]
const { chromium, devices } = require('playwright'); const fs = require('fs');
const KEY = 'brambleroot-save-v1', URL0 = 'file://' + process.cwd() + '/local.html', OUT = process.argv[2] || '.';
const ONLY = process.argv[3] ? process.argv[3].split(',') : null;
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
const wait = (p, ms) => p.waitForTimeout(ms || 250);
async function closeSheets(p) { for (let i = 0; i < 6; i++) { if (await p.isHidden('#sheet')) return; await p.tap('#shClose').catch(() => {}); await wait(p, 150); } }
async function start(p, patch) {
  await p.goto(URL0); await wait(p, 300);
  const s = JSON.parse(fs.readFileSync('shot-save.json', 'utf8')); Object.assign(s, { cloud:{ name:'moss-fern-owl-42', last:0 }, visits:[], visitKey:'', evToday:null, rain:false, scene:'farm' }, patch);
  await p.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(s)]);
  await p.reload(); await wait(p, 300); await p.tap('#tContinue'); await wait(p, 500); await closeSheets(p);
}
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
const save = p => p.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
// Booth tiles, as in FB_SPOT / FEST_BOOTHS.
const GAMES = [
  { id:'dance', season:0, tile:[4, 7], stage:(w, h, i) => ({ x:(i % 3 + .5) * w / 3, y:h * .7 }), every:110 },
  { id:'nightfish', season:1, tile:[2, 10], stage:(w, h) => ({ x:w / 2, y:h / 2 }), every:150 },
  { id:'ringtoss', season:2, tile:[7, 5], stage:(w, h) => ({ x:w / 2, y:h / 2 }), every:700 },
  { id:'snowball', season:3, tile:[7, 5], stage:(w, h, i) => ({ x:(i % 3 + .5) * w / 3, y:h * .22 + ((Math.floor(i / 3) % 3) + .5) * h * .7 / 3 }), every:90 }
];
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    const ctx = await b.newContext(devices[dev]);
    await ctx.route('**/firestore.googleapis.com/**', r => r.fulfill({ status: 200, body: '{}' }));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(dev + ': ' + e.message));
    for (const g of GAMES) {
      if (ONLY && !ONLY.includes(g.id)) continue;
      const fest = {}; if (g.id === 'dance') fest.y2s0 = { m:{}, main:'rowan', txt:'Rowan dances.', home:false };
      await start(p, { year:2, season:g.season, day:14, time:600, tickets:0, fest, coins:500 });
      // the board card, then the gate
      await p.tap('#bBoard'); await wait(p, 400);
      ok(`${dev} ${g.id}: festival card on the board`, /Go to the festival/.test(await body(p)));
      await p.tap('button[data-act="gofest"]'); await wait(p, 3500); await closeSheets(p);
      if (!(await p.isHidden('#sheet'))) { await p.tap('button[data-act="govillage"]').catch(() => {}); await wait(p, 600); await closeSheets(p); }
      const st0 = await p.evaluate(() => 0);
      if (dev === 'iPhone 13') { await wait(p, 4500); await p.screenshot({ path:`${OUT}/fest-grounds-${g.season}.png` }); }
      // tap the stall
      await tapTile(p, g.tile[0], g.tile[1], 4200);
      const title = await p.textContent('#shTitle').catch(() => '');
      ok(`${dev} ${g.id}: tapping the stall opens it (${title})`, !(await p.isHidden('#sheet')) && /data-act="fplay"/.test(await body(p)));
      if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/fest-booth-${g.id}.png` });
      await p.tap('button[data-act="fplay"]'); await wait(p, 500);
      ok(`${dev} ${g.id}: the game opens full screen`, !(await p.isHidden('#fg')) && /data-gact="go"/.test(await p.innerHTML('#fgCard')));
      if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/fest-intro-${g.id}.png` });
      await p.tap('button[data-gact="go"]'); await wait(p, 300);
      const box = await p.locator('#fgC').boundingBox();
      // play by tapping until the result card appears (two minutes at most)
      let i = 0, shot = false; const t0 = Date.now();
      while (Date.now() - t0 < 120000) {
        if (!(await p.isHidden('#fgCard'))) break;
        const q = g.stage(box.width, box.height, i++); await p.touchscreen.tap(box.x + q.x, box.y + q.y); await wait(p, g.every);
        if (!shot && Date.now() - t0 > 6000 && dev === 'iPhone 13') { shot = true; await p.screenshot({ path:`${OUT}/fest-play-${g.id}.png` }); }
      }
      const card = await p.innerHTML('#fgCard');
      ok(`${dev} ${g.id}: the game ends with a score`, /fg-score/.test(card));
      ok(`${dev} ${g.id}: tickets won`, /\+\d+ tickets/.test(card));
      if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/fest-done-${g.id}.png` });
      const s1 = await save(p);
      ok(`${dev} ${g.id}: tickets saved (${s1.tickets})`, s1.tickets > 0);
      ok(`${dev} ${g.id}: half an hour passed`, s1.time >= 630);
      await p.tap('button[data-gact="back"]'); await wait(p, 500);
      ok(`${dev} ${g.id}: back at the stall`, (await p.isHidden('#fg')) && !(await p.isHidden('#sheet')) && /data-act="fplay"/.test(await body(p)));
      await closeSheets(p);
      // the prize stall: give her tickets, buy the Starshard, scroll stays put
      await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('brambleroot-save-v1')); return s; });
      await tapTile(p, 7, 6, 4200);
      ok(`${dev} ${g.id}: the prize stall opens`, /tbuy/.test(await body(p)));
      const tk = (await save(p)).tickets;
      const can = await p.isEnabled('button[data-act="tbuy"][data-id="starshard"]').catch(() => false);
      if (tk >= 25) { await p.tap('button[data-act="tbuy"][data-id="starshard"]'); await wait(p, 300); ok(`${dev} ${g.id}: bought a Starshard`, (await save(p)).tickets === tk - 25); }
      else ok(`${dev} ${g.id}: Starshard needs 25 tickets (has ${tk})`, !can);
      if (dev === 'iPhone 13' && g.season === 2) await p.screenshot({ path:`${OUT}/fest-prizes.png` });
      await closeSheets(p);
      // tap a villager: festival hello
      await p.evaluate(() => 0);
    }
    // night: the grounds lit up
    if (!ONLY) { await start(p, { year:2, season:1, day:14, time:1230, tickets:5 }); await p.tap('#bBoard'); await wait(p, 300); await p.tap('button[data-act="gofest"]'); await wait(p, 3500); await closeSheets(p); await wait(p, 3000); if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/fest-night-1.png` }); ok(`${dev}: grounds at night`, true); }
    await ctx.close();
  }
  ok('no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''), errs.length === 0);
  console.log(`festphone: ${pass} passed, ${fail} failed`);
  await b.close(); process.exit(fail ? 1 : 0);
})();
