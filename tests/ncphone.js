// Year-2 newcomers on a phone: the year-1 teaser, Rosa's hello letter on arrival, her page, a chat. Needs local.html.
const { chromium, devices } = require('playwright'); const fs = require('fs');
const KEY = 'brambleroot-save-v1', URL0 = 'file://' + process.cwd() + '/local.html', OUT = process.argv[2] || 'shots';
fs.mkdirSync(OUT, { recursive:true });
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
const wait = (p, ms) => p.waitForTimeout(ms || 220);
async function closeSheets(p) { for (let i = 0; i < 8; i++) { if (await p.isHidden('#sheet')) return; await p.tap('#shClose').catch(() => {}); await wait(p, 150); } }
async function openList(p) { await closeSheets(p); await p.tap('#bJournal'); await wait(p); await p.tap('[data-act="jtab"][data-id="village"]'); await wait(p); }
async function save(p) { return p.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY); }
async function load(p, s) { await p.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(s)]); await p.reload(); await wait(p, 300); await p.tap('#tContinue'); await wait(p, 400); await closeSheets(p); }
(async () => {
  const b = await chromium.launch();
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    const ctx = await b.newContext({ ...devices[dev] }); await ctx.route('**/firestore.googleapis.com/**', r => r.fulfill({ status:200, body:'{}' }));
    let p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL0); await wait(p, 300);
    const base = JSON.parse(fs.readFileSync('shot-save.json', 'utf8')); base.cloud = { name:'moss-fern-owl-42', last:0 };
    // year 1: three teasers
    await load(p, Object.assign(JSON.parse(JSON.stringify(base)), { year:1, season:2, day:10, time:600 }));
    await openList(p); const h1 = await p.innerHTML('#shBody');
    ok(`${dev}: year 1 list shows newcomers as "Someone new" (year 2)`, (h1.match(/of year 2/g) || []).length === 3 && !/Rosa|Corin|Marigold/.test(h1));
    if (dev === 'iPhone 13') { await p.locator('text=Someone new').first().scrollIntoViewIfNeeded(); await p.screenshot({ path:`${OUT}/nc-teaser.png` }); }
    // year 2 spring: Rosa's here and writes
    const s2 = Object.assign(JSON.parse(JSON.stringify(base)), { year:2, season:0, day:3, time:600, reqs:[] });
    s2.visitKey = `2.0.3`; s2.visits = [{ v:'rosa', c:0, r:6, from:360, to:1440, seen:true }];
    await p.close(); p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(URL0); await wait(p, 300);
    await load(p, s2);
    await openList(p); const h2 = await p.innerHTML('#shBody');
    ok(`${dev}: Rosa in the list, two still to come`, /Rosa/.test(h2) && (h2.match(/Someone new/g) || []).length === 2);
    if (!/Rosa/.test(h2)) console.log(h2.slice(0, 600)); await p.tap(`[data-act="vopen"][data-id="rosa"]`, { timeout:3000 }); await wait(p);
    ok(`${dev}: Rosa's page`, /Postmistress/.test(await p.innerHTML('#shBody')));
    if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/nc-rosa.png` });
    const fr0 = (await save(p)).fr.rosa || 0;
    await p.tap('[data-act="talk"]'); await wait(p, 400);
    const st = await save(p);
    ok(`${dev}: chatting with Rosa`, (st.fr.rosa || 0) > fr0);
    ok(`${dev}: Rosa's hello letter arrived`, st.sent.hirosa && st.mail.some(m => m.id === 'hirosa') && !st.sent.hicorin);
    if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/nc-chat.png` });
    ok(`${dev}: no page errors ${errs.join(' | ')}`, errs.length === 0);
    await ctx.close();
  }
  console.log(`ncphone: ${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0);
})();
