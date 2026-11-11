// Best friends on a phone: padlocks, the bracelet button, the thank-you scene, hearts 9 and 10, the "Best friend" chip,
// and a 9-heart scene after a chat. Needs local.html. Screenshots go to argv[2] (default ./shots).
const { chromium, devices } = require('playwright'); const fs = require('fs');
const KEY = 'brambleroot-save-v1', URL0 = 'file://' + process.cwd() + '/local.html', OUT = process.argv[2] || 'shots';
fs.mkdirSync(OUT, { recursive:true });
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
const wait = (p, ms) => p.waitForTimeout(ms || 220);
async function closeSheets(p) { for (let i = 0; i < 8; i++) { if (await p.isHidden('#sheet')) return; await p.tap('#shClose').catch(() => {}); await wait(p, 150); } }
async function openVillager(p, v) { await closeSheets(p); await p.tap('#bJournal'); await wait(p); await p.tap('[data-act="jtab"][data-id="village"]'); await wait(p); await p.tap(`[data-act="vopen"][data-id="${v}"]`); await wait(p); }
(async () => {
  const b = await chromium.launch();
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    const ctx = await b.newContext({ ...devices[dev] }); await ctx.route('**/firestore.googleapis.com/**', r => r.fulfill({ status:200, body:'{}' }));
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL0); await wait(p, 300);
    const s = JSON.parse(fs.readFileSync('shot-save.json', 'utf8')); Object.assign(s, { day:10, time:600, bff:{} });
    s.fr = Object.assign(s.fr, { fen:850, hettie:880, pip:700 }); s.inv = Object.assign(s.inv, { bracelet:2 });
    for (const v of ['fen', 'hettie', 'pip']) for (const l of [2, 4, 6, 8]) s.scenes[v + l] = true;
    s.visitKey = `${s.year}.${s.season}.${s.day}`; s.visits = [{ v:'fen', c:2, r:11, from:360, to:1440, seen:true }, { v:'hettie', c:8, r:4, from:360, to:1440, seen:true }, { v:'pip', c:6, r:12, from:360, to:1440, seen:true }]; s.cloud = { name:'moss-fern-owl-42', last:0 };
    await p.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(s)]); await p.reload(); await wait(p, 300);
    await p.tap('#tContinue'); await wait(p, 300); await closeSheets(p);
    await openVillager(p, 'fen');
    ok(`${dev}: Fen shows two padlocks`, (await p.locator('#shBody .vhead .lock').count()) === 2);
    ok(`${dev}: bracelet button at 8 hearts`, await p.isVisible('[data-act="bracelet"]'));
    if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/bff-page.png` });
    await p.tap('[data-act="bracelet"]'); await wait(p, 400);
    ok(`${dev}: thank-you scene`, /best friends/.test(await p.textContent('#shTitle')) && /sailor's knot/.test(await p.innerHTML('#shBody')));
    ok(`${dev}: padlocks gone`, (await p.locator('#shBody .vhead .lock').count()) === 0 && (await p.locator('#shBody .vhead .hearts i').count()) === 10);
    if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/bff-yes.png` });
    // Hettie is already past 850 in this save, so after the bracelet a chat brings the 9-heart scene
    await openVillager(p, 'hettie'); await p.tap('[data-act="bracelet"]'); await wait(p, 400); await closeSheets(p);
    await openVillager(p, 'hettie'); await p.tap('[data-act="talk"]'); await wait(p, 400);
    const st = await save(p);
    ok(`${dev}: hettie past 9 hearts after a chat (${st.fr.hettie})`, st.fr.hettie >= 890);
    const title = await p.textContent('#shTitle');
    ok(`${dev}: 9-heart scene after the chat (${title})`, /9 hearts/.test(title) && /herb/.test(await p.innerHTML('#shBody')));
    if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/bff-s9.png` });
    // no bracelet for Pip under 8 hearts; the list shows the chip
    await openVillager(p, 'pip'); ok(`${dev}: no bracelet under 8 hearts`, !(await p.isVisible('[data-act="bracelet"]')));
    await p.tap('[data-act="jback"]'); await wait(p);
    ok(`${dev}: Best friend chip in the list`, (await p.innerHTML('#shBody')).split('Best friend').length - 1 >= 2);
    if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/bff-list.png` });
    const sv = await save(p); ok(`${dev}: saved best friends`, sv.bff && sv.bff.fen && sv.bff.hettie && sv.inv.bracelet === 0);
    ok(`${dev}: no page errors ${errs.join(' | ')}`, errs.length === 0);
    await ctx.close();
  }
  console.log(`bffphone: ${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0);
})();
async function save(p) { return p.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY); }
