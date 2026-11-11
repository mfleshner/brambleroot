// Matchmaking on a phone: a wedding day at the mill. The morning line, the couple at the mill, tapping the mill opens
// its sheet with "Join the wedding", the wedding scene, and the "Married to" chip afterwards. Needs local.html.
const { chromium, devices } = require('playwright'); const fs = require('fs');
const KEY = 'brambleroot-save-v1', URL0 = 'file://' + process.cwd() + '/local.html', OUT = process.argv[2] || 'shots';
fs.mkdirSync(OUT, { recursive:true });
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
const wait = (p, ms) => p.waitForTimeout(ms || 220);
async function closeSheets(p) { for (let i = 0; i < 8; i++) { if (await p.isHidden('#sheet')) return; await p.tap('#shClose').catch(() => {}); await wait(p, 150); } }
async function tile(p, c, r) {
  return p.evaluate(([c, r]) => {
    const W = innerWidth, H = innerHeight, top = document.getElementById('hud').getBoundingClientRect().height - 6, bot = document.getElementById('tray').getBoundingClientRect().height;
    const aw = W - 12, ah = H - top - bot - 8, T = Math.max(20, Math.floor(Math.min(aw / 9, ah / 13)));
    const ox = Math.round((W - T * 9) / 2), oy = Math.round(top + (ah - T * 13) / 2 + 4);
    return { x:ox + (c + .5) * T, y:oy + (r + .5) * T };
  }, [c, r]);
}
(async () => {
  const b = await chromium.launch();
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    const ctx = await b.newContext({ ...devices[dev] }); await ctx.route('**/firestore.googleapis.com/**', r => r.fulfill({ status:200, body:'{}' }));
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL0); await wait(p, 300);
    const s = JSON.parse(fs.readFileSync('shot-save.json', 'utf8'));
    Object.assign(s, { year:2, season:1, day:10, time:870, scene:'village', rain:false, visits:[], evToday:null, cloud:{ name:'moss-fern-owl-42', last:0 } });
    s.visitKey = `${s.year}.${s.season}.${s.day}`;
    const abs = (s.year - 1) * 112 + s.season * 28 + s.day;
    s.matched = { mara_aldous:{ wed:abs, went:false } };
    await p.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(s)]); await p.reload(); await wait(p, 300);
    await p.tap('#tContinue'); await wait(p, 500); await closeSheets(p); await wait(p, 600);
    await p.tap('#bJournal'); await wait(p); await p.tap('[data-act="jtab"][data-id="village"]'); await wait(p); await p.tap('[data-act="vopen"][data-id="mara"]'); await wait(p);
    ok(`${dev}: Mara's page says she's at the mill`, /mill/.test(await p.innerHTML('#shBody')));
    await p.tap('[data-act="seek"]'); await wait(p, 9000); await closeSheets(p); await wait(p, 600);
    if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/match-village.png` });
    const { x, y } = await tile(p, 0, 0); await p.touchscreen.tap(x, y); await wait(p, 3500);
    const h = await p.innerHTML('#shBody').catch(() => '');
    ok(`${dev}: the mill sheet has the wedding`, /Mara and Mayor Aldous's wedding/.test(h) && /data-act="mwed"/.test(h));
    ok(`${dev}: the couple is at the mill`, /Mara/.test(h) && /Aldous/.test(h));
    if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/match-card.png` });
    await p.tap('[data-act="mwed"]'); await wait(p, 400);
    ok(`${dev}: wedding scene`, /Turnip carries the rings/.test(await p.innerHTML('#shBody')));
    if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/match-wed.png` });
    await closeSheets(p);
    await p.tap('#bJournal'); await wait(p); await p.tap('[data-act="jtab"][data-id="village"]'); await wait(p);
    ok(`${dev}: Married to chip`, /Married to Mayor Aldous/.test(await p.innerHTML('#shBody')));
    const sv = await p.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY); ok(`${dev}: went saved`, sv.matched.mara_aldous.went === true);
    ok(`${dev}: no page errors ${errs.join(' | ')}`, errs.length === 0);
    await ctx.close();
  }
  console.log(`matchphone: ${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0);
})();
