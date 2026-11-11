// Heart quests on a phone: the new-story morning line, a step done by tapping from the villager page, the Stories tab
// (active first, waiting heart stories folded into one row), and keepsakes on the shelf. Needs local.html.
const { chromium, devices } = require('playwright'); const fs = require('fs');
const KEY = 'brambleroot-save-v1', URL0 = 'file://' + process.cwd() + '/local.html', OUT = process.argv[2] || 'shots';
fs.mkdirSync(OUT, { recursive:true });
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
const wait = (p, ms) => p.waitForTimeout(ms || 220);
async function closeSheets(p) { for (let i = 0; i < 8; i++) { if (await p.isHidden('#sheet')) return; await p.tap('#shClose').catch(() => {}); await wait(p, 150); } }
const save = p => p.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
(async () => {
  const b = await chromium.launch();
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    const shot = n => dev === 'iPhone 13' ? null : null;
    const ctx = await b.newContext({ ...devices[dev] }); await ctx.route('**/firestore.googleapis.com/**', r => r.fulfill({ status:200, body:'{}' }));
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL0); await wait(p, 300);
    const s = JSON.parse(fs.readFileSync('shot-save.json', 'utf8')); Object.assign(s, { day:10, time:600, mementos:{ wren:true, fen:true } });
    s.fr = Object.assign(s.fr, { mara:850, rowan:850 }); s.quests = Object.assign(s.quests || {}, { h_mara:{ s:0, at:1 }, h_fen:{ s:4, at:1, done:true }, h_wren:{ s:4, at:1, done:true } });
    s.visitKey = `${s.year}.${s.season}.${s.day}`; s.visits = [{ v:'mara', c:8, r:4, from:360, to:1440, seen:true }]; s.cloud = { name:'moss-fern-owl-42', last:0 };
    await p.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(s)]); await p.reload(); await wait(p, 300);
    await p.tap('#tContinue'); await wait(p, 300); await closeSheets(p);
    await p.tap('#bJournal'); await wait(p); await p.tap('[data-act="jtab"][data-id="stories"]'); await wait(p);
    const st = await p.innerHTML('#shBody');
    ok(`${dev}: Mara's story is listed first`, st.indexOf('The mill song') >= 0 && st.indexOf('The mill song') < st.indexOf('Finished'));
    ok(`${dev}: waiting heart stories folded into one row`, (st.match(/own stor/g) || []).length === 1);
    if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/hq-stories.png` });
    await p.tap('[data-act="jtab"][data-id="village"]'); await wait(p); await p.tap('[data-act="vopen"][data-id="mara"]'); await wait(p);
    ok(`${dev}: story card on Mara's page`, await p.isVisible('[data-act="qdo"][data-id="h_mara"]'));
    await p.tap('[data-act="qdo"][data-id="h_mara"]'); await wait(p, 400);
    ok(`${dev}: step scene`, /Silas knows every song/.test(await p.innerHTML('#shBody')));
    if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/hq-step.png` });
    const sv = await save(p); ok(`${dev}: step saved`, sv.quests.h_mara.s === 1);
    await closeSheets(p);
    await p.tap('#bSleep'); await wait(p); await p.tap('[data-act="relics"]'); await wait(p, 300);
    const sh = await p.innerHTML('#shBody');
    ok(`${dev}: keepsakes on the shelf`, /Keepsakes from friends/.test(sh) && /river map/.test(sh) && /straw skep/.test(sh));
    if (dev === 'iPhone 13') { await p.evaluate(() => { const b = document.getElementById('shBody'); b.scrollTop = b.scrollHeight; }); await wait(p); await p.screenshot({ path:`${OUT}/hq-shelf.png` }); }
    ok(`${dev}: no page errors ${errs.join(' | ')}`, errs.length === 0);
    await ctx.close();
  }
  console.log(`hqphone: ${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0);
})();
