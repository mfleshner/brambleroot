// Cottage phone checks, Part 3 (the attic ladder and sheet, Bramble's things, the nook, Hew's portrait, sharing a picture). Was: Cottage phone checks, Part 2 (Isolde's linens, tea, the cosy line, a full room). Was: Cottage phone checks (PLAN-cottage.md Part 1), iPhone 13 and Pixel 7, all by tapping:
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
const base = { season:1, day:15, time:600, rain:false, coins:9000, visits:[], visitKey:'', evToday:null, homeSeen:true };
const room = { own:{ btable:1, chair:2, braidrug:1, lantern:1, p_plum:1, f_oak:1, b_plain:1, q_none:1, c_none:1, rocker:1, kettle:1, q_bramble:1, starchart:1, bclock:1, lectern:1, bportrait:1, barmchair:1, hewpic:1 },
  at:[{ id:'braidrug', c:1, r:5 }, { id:'btable', c:2, r:5 }, { id:'chair', c:1, r:5 }, { id:'chair', c:3, r:5, f:1 }, { id:'kettle', c:2, r:5 }, { id:'lantern', c:7, r:4 }, { id:'rocker', c:1, r:3 }, { id:'barmchair', c:3, r:3 }, { id:'lectern', c:0, r:8 }, { id:'starchart', c:0, r:0 }, { id:'bclock', c:2, r:0 }, { id:'bportrait', c:6, r:0 }, { id:'hewpic', c:7, r:0 }],
  paper:'p_plum', floor:'f_oak', bed:'b_plain', quilt:'q_bramble', curtain:'c_none', nook:true };
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const dn of ['iPhone 13', 'Pixel 7']) {
    const ctx = await b.newContext({ ...devices[dn], acceptDownloads:true }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(dn + ': ' + e.message));
    const tag = dn.replace(' ', '');
    await start(p, s => Object.assign({}, base, { home:room, quests:Object.assign({}, s.quests, { attic:{ s:10, at:1, done:true } }), hew:Object.assign({}, s.hew || {}, { met:true }) }));
    await tapTile(p, 1, 0, 3000); await tapAct(p, 'gohome'); await wait(p, 1500);
    await p.screenshot({ path:`${OUT}/home3-room-${tag}.png` });
    await tapTile(p, 8, 1, 3500); ok(dn + ' the ladder opens the attic', /The attic/.test(await title(p)) && (await body(p)).split('atticmem').length - 1 === 8);
    await tapAct(p, 'atticmem', '2'); ok(dn + ' a story of one of her things', /third rock/.test(await body(p)));
    await closeSheets(p);
    await p.tap('#bDeco'); await wait(p, 400); await tapTile(p, 1, 12, 800); ok(dn + ' the nook is floor', (await title(p)) === 'Decorate');
    await tapAct(p, 'decoroom'); ok(dn + ' room sheet: share', /Share a picture/.test(await body(p)));
    const dl = p.waitForEvent('download', { timeout:5000 }).catch(() => null);
    await tapAct(p, 'homesnap'); const d = await dl; ok(dn + ' a picture of the room', !!d);
    if (d && dn === 'iPhone 13') await d.saveAs(`${OUT}/home3-snap.png`);
    await ctx.close();
  }
  ok('no page errors', !errs.length); if (errs.length) console.log(errs.join('\n'));
  console.log(`home3phone: ${pass} passed, ${fail} failed`); await b.close();
})();
