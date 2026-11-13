// Cottage phone checks (PLAN-cottage.md Part 1), iPhone 13 and Pixel 7, all by tapping:
// gate → village → the mill → Mara's Woodworks → buy a dresser → back home → the cottage → Go inside → Decorate → put it out
// → move it → put it away → the bed → Sleep sheet; plus a night screenshot. Usage: node homephone.js [screenshot folder]  (needs local.html)
const { chromium, devices } = require('playwright'); const fs = require('fs');
const KEY = 'brambleroot-save-v1', URL0 = 'file://' + process.cwd() + '/local.html', OUT = process.argv[2] || '.';
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
const wait = (p, ms) => p.waitForTimeout(ms || 250);
async function closeSheets(p) { for (let i = 0; i < 6; i++) { if (await p.isHidden('#sheet')) return; await p.tap('#shClose').catch(() => {}); await wait(p, 150); } }
async function start(p, patch) {
  await p.goto(URL0); await wait(p, 300);
  const s = JSON.parse(fs.readFileSync('shot-save.json', 'utf8')); Object.assign(s, { cloud:{ name:'moss-fern-owl-42', last:0 }, homeTip:true, clockTip:true }, patch(s));
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
const body = p => p.innerHTML('#shBody'), title = p => p.textContent('#shTitle');
const seen = async (p, sel, ms) => { for (let i = 0; i < (ms || 8000) / 250; i++) { if (!(await p.isHidden(sel))) return true; await wait(p, 250); } return false; };
const tapAct = async (p, act, id) => { await p.tap(`#shBody [data-act="${act}"]${id ? `[data-id="${id}"]` : ''}`); await wait(p, 400); };
const base = { season:1, day:15, time:600, rain:false, coins:5000, visits:[], visitKey:'', evToday:null };
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const dn of ['iPhone 13', 'Pixel 7']) {
    const ctx = await b.newContext({ ...devices[dn] }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(dn + ': ' + e.message));
    const tag = dn.replace(' ', '');
    await start(p, () => base);
    // to the mill
    await tapTile(p, 0, 6, 2600); ok(dn + ' gate sheet', (await title(p)) === 'The garden gate'); await tapAct(p, 'govillage'); await wait(p, 600); await closeSheets(p);
    await tapTile(p, 0, 0, 3200); ok(dn + ' mill sheet', /The mill/.test(await title(p)) && /Woodworks/.test(await body(p)));
    await tapAct(p, 'decoshop', 'mara'); ok(dn + ' Mara\'s catalogue', /Woodworks/.test(await title(p)) && /Kitchen dresser/.test(await body(p)));
    if (dn === 'iPhone 13') await p.screenshot({ path:`${OUT}/home-shop-${tag}.png` });
    await tapAct(p, 'decobuy', 'dresser'); ok(dn + ' bought the dresser', /You have 1/.test(await body(p)) && /lads/.test(await body(p)));
    await closeSheets(p);
    // home
    await tapTile(p, 4, 12, 4000); ok(dn + ' back on the farm', await p.evaluate(() => true));
    await tapTile(p, 1, 0, 3000); ok(dn + ' cottage opens the Sleep sheet', /End/.test(await title(p)) && /Go inside/.test(await body(p)));
    await tapAct(p, 'gohome'); await wait(p, 800); ok(dn + ' inside', !(await p.isHidden('#bDeco')));
    await p.screenshot({ path:`${OUT}/home-in-${tag}.png` });
    // decorate
    await p.tap('#bDeco'); await wait(p, 400); ok(dn + ' decorate on', (await p.textContent('#decoLbl')) === 'Done');
    await tapTile(p, 5, 7, 700); ok(dn + ' deco sheet', (await title(p)) === 'Decorate' && /Kitchen dresser/.test(await body(p)));
    if (dn === 'iPhone 13') await p.screenshot({ path:`${OUT}/home-deco-${tag}.png` });
    await tapAct(p, 'decoput', 'dresser'); await wait(p, 300); ok(dn + ' put out', await p.isHidden('#sheet'));
    await p.screenshot({ path:`${OUT}/home-placed-${tag}.png` });
    await tapTile(p, 6, 7, 700); ok(dn + ' tap it: card', /decomove/.test(await body(p)));
    await tapAct(p, 'decomove'); await tapTile(p, 2, 9, 700);
    ok(dn + ' moved', await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('brambleroot-save-v1')); return true; }));
    await tapTile(p, 2, 9, 700); ok(dn + ' card at new spot', /Kitchen dresser/.test(await body(p)) && /decoaway/.test(await body(p)));
    await tapAct(p, 'decoroom'); ok(dn + ' room sheet', /Walls, floor and bed/.test(await title(p)));
    await tapAct(p, 'decoback'); ok(dn + ' back to the tile', (await title(p)) === 'Decorate');
    await closeSheets(p);
    await p.tap('#bDeco'); await wait(p, 400); ok(dn + ' done', (await p.textContent('#decoLbl')) === 'Decor');
    await tapTile(p, 7, 1, 3500); ok(dn + ' bed → Sleep sheet', /End/.test(await title(p)) && !/Go inside/.test(await body(p)));
    await closeSheets(p);
    await tapTile(p, 4, 12, 4000); ok(dn + ' out of the door', await p.isHidden('#bDeco'));
    // night, with a fuller room
    await start(p, () => Object.assign({}, base, { time:1290, home:{ own:{ btable:1, chair:2, braidrug:1, lantern:1, p_plum:1, f_oak:1, b_plain:1, dresser:1, bookcase:1, stove:1, oillamp:1, wclock:1, catbed:1, pots:1, sampler:1, ragrug:1, rtable:1, p_rose:1, f_herring:1, b_carved:1, planter:1, candelabra:1 },
      at:[{ id:'braidrug', c:1, r:5 }, { id:'btable', c:2, r:5 }, { id:'chair', c:1, r:5 }, { id:'chair', c:3, r:5, f:1 }, { id:'lantern', c:7, r:4 }, { id:'dresser', c:0, r:2 }, { id:'bookcase', c:8, r:4 }, { id:'stove', c:6, r:4 }, { id:'rtable', c:6, r:9 }, { id:'oillamp', c:6, r:9 }, { id:'wclock', c:0, r:0 }, { id:'pots', c:2, r:0 }, { id:'sampler', c:8, r:0 }, { id:'catbed', c:1, r:9 }, { id:'ragrug', c:5, r:8 }, { id:'planter', c:1, r:11 }, { id:'candelabra', c:8, r:8 }], paper:'p_rose', floor:'f_herring', bed:'b_carved' } }));
    await tapTile(p, 1, 0, 3000); await tapAct(p, 'gohome'); await wait(p, 1500);
    await p.screenshot({ path:`${OUT}/home-night-${tag}.png` }); ok(dn + ' night room draws', true);
    await ctx.close();
  }
  ok('no page errors', !errs.length); if (errs.length) console.log(errs.join('\n'));
  console.log(`homephone: ${pass} passed, ${fail} failed`); await b.close();
})();
