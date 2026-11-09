// Part 3 phone checks for story quests and group events: the Stories tab, finding someone for a story step,
// a story scene, a place step at the inn in the evening, a story ending, the bonfire (calendar, walk, join),
// the lit lighthouse at night, and the morning notices. Usage: node questtest.js [screenshot folder]
const { chromium, devices } = require('playwright'); const fs = require('fs');
const KEY = 'brambleroot-save-v1', URL0 = 'file://' + process.cwd() + '/local.html', OUT = process.argv[2] || '.';
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
const wait = (p, ms) => p.waitForTimeout(ms || 250);
async function closeSheets(p) { for (let i = 0; i < 6; i++) { if (await p.isHidden('#sheet')) return; await p.tap('#shClose').catch(() => {}); await wait(p, 150); } }
const base = JSON.parse(fs.readFileSync('shot-save.json', 'utf8'));
async function start(p, patch) {
  await p.goto(URL0); await wait(p, 300);
  const s = JSON.parse(JSON.stringify(base)); Object.assign(s, { cloud:{ name:'moss-fern-owl-42', last:0 }, visits:[], visitKey:'', talked:{}, rain:false, snow:false }, patch);
  await p.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(s)]);
  await p.reload(); await wait(p, 300); await p.tap('#tContinue'); await wait(p, 500); await closeSheets(p);
}
const body = p => p.innerHTML('#shBody');
const clean = h => !/undefined|NaN|\[object/.test(h);
const fr = Object.assign({}, base.fr, { hettie:450, aldous:420, isolde:400, theo:400, bertram:450, juno:420, tilly:300, rowan:300 });
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    const tag = dev.replace(' ', '').toLowerCase(), shot = async name => { if (dev === 'iPhone 13') await p.screenshot({ path:`${OUT}/${name}-${tag}.png` }); };
    const ctx = await b.newContext(devices[dev]);
    await ctx.route('**/firestore.googleapis.com/**', r => r.fulfill({ status: 200, body: '{}' }));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(dev + ': ' + e.message));
    const vw = devices[dev].viewport.width;

    // 1. the Stories tab, then "Go to" Hettie and do the first step of her story
    await start(p, { season:0, day:12, time:700, fr, quests:{ secret:{ s:0, at:1 }, brews:{ s:3, at:1 }, goat:{ s:1, at:1 }, lamp:{ s:4, at:1, done:true } } });
    await p.tap('#bJournal'); await wait(p); await p.tap('[data-act="jtab"][data-id="stories"]'); await wait(p);
    const tabBox = await p.locator('[data-act="jtab"][data-id="almanac"]').boundingBox();
    ok(`${dev}: five journal tabs fit the screen`, tabBox && tabBox.x + tabBox.width <= vw);
    const jb = await body(p);
    ok(`${dev}: Stories tab lists open, finished and future stories`, jb.includes("The aunt's secret") && jb.includes('Finished') && jb.includes('A story yet to come') && clean(jb));
    await p.setViewportSize({ width:vw, height:1500 }); await wait(p); await shot('stories-tab'); await p.setViewportSize(devices[dev].viewport); await wait(p);
    await p.tap('[data-act="seek"][data-id="hettie"]'); await wait(p, 9000);
    let h = await body(p);
    ok(`${dev}: "Go to" walks to Hettie and opens her page with the story step`, (await p.isVisible('#sheet')) && h.includes('data-act="qdo"'));
    await shot('story-card');
    await p.tap('[data-act="qdo"]'); await wait(p, 500);
    h = await body(p);
    ok(`${dev}: the story scene shows`, h.includes('trunk of letters') && h.includes('Next:') && clean(h));
    await shot('story-scene');
    await closeSheets(p);

    // 2. a place step: the taste-off at the inn after 7 pm, which ends Rival brews
    await start(p, { season:0, day:12, time:1150, fr, quests:{ brews:{ s:3, at:1 } } });
    const coins0 = await p.evaluate(k => JSON.parse(localStorage.getItem(k)).coins, KEY);
    await p.tap('#bJournal'); await wait(p); await p.tap('[data-act="jtab"][data-id="stories"]'); await wait(p);
    await p.tap('[data-act="goplace"][data-id="inn"]'); await wait(p, 9000);
    h = await body(p);
    ok(`${dev}: "Go to the inn" walks there and the place sheet offers the taste-off`, (await p.textContent('#shTitle')).includes('Kettle') && h.includes('Start the taste-off'));
    await p.tap('[data-act="qdo"]'); await wait(p, 500);
    h = await body(p);
    ok(`${dev}: the story ends with its reward`, h.includes('The Kettle &amp; Theo') && h.includes('350 coins') && (await p.textContent('.cta-row .btn')).includes('The end'));
    await shot('story-end');
    await closeSheets(p);
    const coins1 = await p.evaluate(() => 0);
    ok(`${dev}: the save has the story finished`, await p.evaluate(k => { const s = JSON.parse(localStorage.getItem(k)); return s.quests.brews.done === true; }, KEY));

    // 3. bonfire night (summer 21): calendar, walk to the docks, join in
    const who = ['mara', 'fen', 'pip', 'odile', 'wren', 'rowan', 'theo', 'isolde', 'juno', 'hettie', 'aldous', 'bertram', 'tilly'];
    await start(p, { season:1, day:21, time:1150, fr, evToday:{ id:'bonfire', key:`${base.year}.1.21`, who }, quests:{ lamp:{ s:4, at:1, done:true } } });
    await p.tap('#calBtn'); await wait(p);
    h = await body(p);
    ok(`${dev}: the calendar shows the bonfire today`, h.includes('Today: Bonfire night') && h.includes('Bonfire'));
    await shot('calendar-event');
    await p.tap('[data-act="goplace"]'); await wait(p, 9000);
    h = await body(p);
    ok(`${dev}: the docks offer to join in`, h.includes('data-act="evjoin"'));
    await p.tap('[data-act="evjoin"]'); await wait(p, 500);
    h = await body(p);
    ok(`${dev}: the bonfire scene lists everyone there with a line each`, (await p.textContent('#shTitle')).includes('Bonfire') && (h.match(/class="vrow"/g) || []).length >= 10 && h.includes('+60 friendship') && clean(h));
    await p.setViewportSize({ width:vw, height:2200 }); await wait(p); await shot('event-sheet'); await p.setViewportSize(devices[dev].viewport); await wait(p);
    await closeSheets(p);
    await wait(p, 400); await shot('village-bonfire-night');
    ok(`${dev}: the event happens once`, await p.evaluate(k => JSON.parse(localStorage.getItem(k)).events[`bonfirey${JSON.parse(localStorage.getItem(k)).year}`] === true, KEY));

    // 4. the morning: a new story and an event notice, then the gift sheet order is fine
    await start(p, { season:3, day:20, time:1300, fr, quests:{} });
    await p.tap('#bSleep'); await wait(p); await p.tap('[data-act="sleep"]'); await wait(p, 600);
    h = await body(p);
    ok(`${dev}: morning says a new story opened and the lantern supper is today`, h.includes('A new story') && h.includes('lantern supper'));
    await p.setViewportSize({ width:vw, height:1600 }); await wait(p); await shot('morning-notices'); await p.setViewportSize(devices[dev].viewport); await wait(p);
    await closeSheets(p);
    // the spellbook shows the charm page as a hint
    await p.tap('#bSpells'); await wait(p);
    ok(`${dev}: the spellbook hints at Bramble's Charm`, (await body(p)).includes('Granny Hettie knows a secret'));
    await closeSheets(p);
    await ctx.close();
  }
  ok('no page errors', errs.length === 0); if (errs.length) console.log(errs.slice(0, 5).join('\n'));
  console.log(`${pass} passed, ${fail} failed`);
  await b.close();
})();
