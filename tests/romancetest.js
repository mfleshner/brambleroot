// Phone checks for villager plan part 2: padlocked hearts, the bouquet, the ring, the wedding and the first married morning.
// Needs local.html (build with fake keys). Screenshots go to the folder in argv[2] (default: ./shots).
const { chromium, devices } = require('playwright'); const fs = require('fs');
const KEY = 'brambleroot-save-v1', URL0 = 'file://' + process.cwd() + '/local.html', OUT = process.argv[2] || 'shots';
fs.mkdirSync(OUT, { recursive:true });
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
const wait = (p, ms) => p.waitForTimeout(ms || 220);
async function closeSheets(p) { for (let i = 0; i < 8; i++) { if (await p.isHidden('#sheet')) return; await p.tap('#shClose').catch(() => {}); await wait(p, 150); } }
async function start(b, dev, patch) {
  const ctx = await b.newContext({ ...devices[dev] }); await ctx.route('**/firestore.googleapis.com/**', r => r.fulfill({ status:200, body:'{}' }));
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.goto(URL0); await wait(p, 300);
  const s = JSON.parse(fs.readFileSync('shot-save.json', 'utf8')); Object.assign(s, { day:10, time:600 }); patch(s); // Part 3: chat and gifts need them nearby, so they spend the day in her garden.
  s.visitKey = `${s.year}.${s.season}.${s.day}`; s.visits = [{ v:'rowan', c:8, r:4, from:360, to:1440, seen:true }, { v:'fen', c:2, r:11, from:360, to:1440, seen:true }, { v:'zara', c:6, r:12, from:360, to:1440, seen:true }]; s.cloud = s.cloud || { name:'moss-fern-owl-42', last:0 };
  await p.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(s)]); await p.reload(); await wait(p, 300);
  await p.tap('#tContinue'); await wait(p, 300); await closeSheets(p); return p;
}
async function openVillager(p, v) { await p.tap('#bJournal'); await wait(p); await p.tap('[data-act="jtab"][data-id="village"]'); await wait(p); await p.tap(`[data-act="vopen"][data-id="${v}"]`); await wait(p); }
async function sleepNight(p) { await closeSheets(p); await p.tap('#bSleep'); await wait(p); await p.tap('[data-act="sleep"]'); await wait(p, 300); }
(async () => {
  const b = await chromium.launch();
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    const tag = dev.replace(' ', '').toLowerCase();
    // 1. asking someone out
    let p = await start(b, dev, s => { s.fr = Object.assign(s.fr, { rowan:850, fen:850 }); s.inv = Object.assign(s.inv, { bouquet:1, crystal:1, starshard:1 }); s.scenes = Object.assign(s.scenes, { rowan2:true, rowan4:true, rowan6:true, rowan8:true }); });
    await openVillager(p, 'rowan');
    ok(`${dev}: two padlocks on Rowan's hearts`, (await p.locator('#shBody .vhead .lock').count()) === 2);
    ok(`${dev}: "Give the bouquet" offered at 8 hearts`, await p.isVisible('[data-act="bouquet"]'));
    await p.screenshot({ path:`${OUT}/${tag}-1-rowan-8hearts.png` });
    await p.tap('[data-act="jback"]'); await wait(p); await p.tap('[data-act="vopen"][data-id="fen"]'); await wait(p);
    ok(`${dev}: Old Fen shows 8 hearts and no bouquet button`, (await p.locator('#shBody .vhead .lock').count()) === 0 && !(await p.isVisible('[data-act="bouquet"]')));
    await p.tap('[data-act="jback"]'); await wait(p); await p.tap('[data-act="vopen"][data-id="rowan"]'); await wait(p);
    await p.tap('[data-act="bouquet"]'); await wait(p, 300);
    ok(`${dev}: dating scene`, (await p.textContent('#shTitle')).includes('dating'));
    await p.screenshot({ path:`${OUT}/${tag}-2-dating-scene.png` });
    await closeSheets(p);
    await openVillager(p, 'rowan');
    ok(`${dev}: hearts 9 and 10 unlocked`, (await p.locator('#shBody .vhead .lock').count()) === 0 && (await p.locator('#shBody .vhead .hearts i').count()) === 10);
    ok(`${dev}: kind word button`, await p.isVisible('[data-act="goodbye"]'));
    await closeSheets(p);
    await p.tap('#bPot'); await wait(p);
    ok(`${dev}: ring at the cauldron`, await p.isEnabled('[data-act="brewring"]'));
    await p.screenshot({ path:`${OUT}/${tag}-3-cauldron-ring.png` });
    await p.tap('[data-act="brewring"]'); await wait(p);
    await sleepNight(p);
    ok(`${dev}: morning says the ring is ready`, (await p.textContent('#shBody')).includes("Witch's Ring"));
    await closeSheets(p);
    await p.tap('#bMarket'); await wait(p); await p.tap('[data-act="tab"][data-id="buy"]'); await wait(p);
    ok(`${dev}: bouquet sold at the Market`, await p.isVisible('[data-act="bouq"]'));
    await closeSheets(p);
    ok(`${dev}: no page errors (dating)`, p.errs.length === 0); if (p.errs.length) console.log(p.errs);
    await p.context().close();

    // 2. proposal, wedding, first married morning
    p = await start(b, dev, s => { s.dating = 'rowan'; s.fr = Object.assign(s.fr, { rowan:1050 }); s.inv = Object.assign(s.inv, { ring:1 }); for (const l of [2, 4, 6, 8, 9, 10]) s.scenes['rowan' + l] = true; });
    await openVillager(p, 'rowan');
    await p.screenshot({ path:`${OUT}/${tag}-4-rowan-10hearts.png` });
    await p.tap('[data-act="propose"]'); await wait(p, 300);
    const eng = await p.textContent('#shBody');
    ok(`${dev}: engaged, wedding on summer 13`, eng.includes('Summer 13'));
    await p.screenshot({ path:`${OUT}/${tag}-5-engaged.png` });
    for (let i = 0; i < 3; i++) { await sleepNight(p); if (i < 2) await closeSheets(p); }
    ok(`${dev}: wedding-day morning line`, (await p.textContent('#shBody')).includes('wedding day'));
    await p.tap('#shClose'); await wait(p, 400);
    ok(`${dev}: wedding overlay shows`, await p.isVisible('#wed'));
    await p.screenshot({ path:`${OUT}/${tag}-6-wedding.png` });
    await p.screenshot({ path:`${OUT}/${tag}-6b-wedding-full.png`, fullPage:false });
    await p.locator('[data-wact="ido"]').scrollIntoViewIfNeeded(); await wait(p);
    await p.screenshot({ path:`${OUT}/${tag}-7-wedding-vows.png` });
    await p.tap('[data-wact="ido"]'); await wait(p, 300);
    await p.screenshot({ path:`${OUT}/${tag}-8-married.png` });
    await p.tap('[data-wact="wedhome"]'); await wait(p, 300);
    ok(`${dev}: overlay closed after the wedding`, await p.isHidden('#wed'));
    const st = await p.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
    ok(`${dev}: save says married to Rowan`, st.spouse === 'rowan' && !st.dating && !st.wedding);
    await sleepNight(p);
    ok(`${dev}: Rowan greets you in the morning`, (await p.innerHTML('#shBody')).includes('aria-label="Rowan"'));
    await p.screenshot({ path:`${OUT}/${tag}-9-married-morning.png` });
    await closeSheets(p);
    await p.reload(); await wait(p, 300); await p.tap('#tContinue'); await wait(p, 300);
    const st2 = await p.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
    ok(`${dev}: still married after a reload`, st2.spouse === 'rowan');
    ok(`${dev}: no page errors (wedding)`, p.errs.length === 0); if (p.errs.length) console.log(p.errs);
    await p.context().close();
  }
  await b.close();
  console.log(`\n${pass}/${pass + fail} passed`); process.exit(fail ? 1 : 0);
})();
