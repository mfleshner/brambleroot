// Village update checks on phone sizes, starting from a pre-update save.
const { chromium, devices } = require('playwright'); const fs = require('fs');
const KEY = 'brambleroot-save-v1', URL0 = 'file://' + process.cwd() + '/local.html';
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
async function closeSheets(p) { for (let i = 0; i < 6; i++) { if (await p.isHidden('#sheet')) return; await p.tap('#shClose').catch(() => {}); await p.waitForTimeout(150); } }
async function start(p, patch) {
  await p.goto(URL0); await p.waitForTimeout(300);
  const s = JSON.parse(fs.readFileSync('shot-save.json', 'utf8')); Object.assign(s, patch);
  await p.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(s)]);
  await p.reload(); await p.waitForTimeout(300); await p.tap('#tContinue'); await p.waitForTimeout(400); await closeSheets(p);
}
async function village(p) { await p.tap('#bJournal'); await p.waitForTimeout(250); await p.tap('button[data-act="jtab"][data-id="village"]'); await p.waitForTimeout(250); }
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    const ctx = await b.newContext(devices[dev]);
    await ctx.route('**/firestore.googleapis.com/**', r => r.fulfill({ status: 200, body: '{}' }));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(dev + ': ' + e.message));
    // a pre-update save, on a day the cart is away
    await start(p, { day: 13, time: 600 });
    ok(dev + ': pre-update save loads into play', (await p.textContent('#dayLbl')).includes('13'));
    await village(p);
    const txt = await p.textContent('#shBody');
    ok(dev + ': village list is grouped by place', ['The square', 'The Kettle & Crow', 'Smithy and apothecary', 'The mill and the school', 'Down by the river', 'Up the lanes'].every(x => txt.includes(x)));
    ok(dev + ': new villagers are listed', ['Rowan', 'Theo', 'Isolde', 'Juno', 'Granny Hettie', 'Mayor Aldous', 'Bertram', 'Tilly', 'Zara'].every(x => txt.includes(x)));
    ok(dev + ': Silas is here in year 2', txt.includes('Silas'));
    ok(dev + ': Zara is on the road today', txt.includes('On the road. Back day 19'));
    ok(dev + ': no undefined on the village list', !/undefined|NaN/.test(await p.innerHTML('#shBody')));
    if (dev === 'iPhone 13') { await p.setViewportSize({ width: 390, height: 2600 }); await p.waitForTimeout(200); await p.screenshot({ path: 'village-list.png' }); await p.setViewportSize(devices[dev].viewport); }
    // a villager page: chat works
    await p.tap('button[data-act="vopen"][data-id="rowan"]'); await p.waitForTimeout(250);
    await p.tap('button[data-act="talk"][data-id="rowan"]'); await p.waitForTimeout(300);
    ok(dev + ': chatting with Rowan works', (await p.textContent('#shBody')).includes('Chatted today') || (await p.textContent('#sheet')).includes('Rowan'));
    if (dev === 'iPhone 13') await p.screenshot({ path: 'rowan.png' });
    await closeSheets(p);
    // Zara's page on an away day has no chat button
    await village(p); await p.tap('button[data-act="vopen"][data-id="zara"]'); await p.waitForTimeout(250);
    ok(dev + ': Zara can\'t be chatted with while away', (await p.$$('button[data-act="talk"]')).length === 0 && (await p.textContent('#shBody')).includes('out on the road'));
    await closeSheets(p);
    // market day: Zara is here
    await start(p, { day: 12, time: 600 });
    await village(p); await p.tap('button[data-act="vopen"][data-id="zara"]'); await p.waitForTimeout(250);
    ok(dev + ': Zara can be chatted with on market day', (await p.$$('button[data-act="talk"][data-id="zara"]')).length === 1);
    if (dev === 'iPhone 13') await p.screenshot({ path: 'zara.png' });
    await closeSheets(p);
    await ctx.close();
  }
  await b.close();
  console.log(`\n${pass}/${pass + fail} passed; page errors: ${errs.length ? errs.join(' | ') : 'none'}`);
})();
