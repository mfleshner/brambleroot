// Cottage phone checks, Part 2 (Isolde's linens, tea, the cosy line, a full room). Was: Cottage phone checks (PLAN-cottage.md Part 1), iPhone 13 and Pixel 7, all by tapping:
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
const base = { season:1, day:15, time:600, rain:false, coins:9000, visits:[], visitKey:'', evToday:null };
const room = { own:{ btable:1, chair:2, braidrug:1, lantern:1, p_plum:1, f_oak:1, b_plain:1, q_none:1, c_none:1, armchair:1, starrug:1, telescope:1, globe:1, screen:1, seascape:1, bunting:1, relicab:1, kshelf:1, dressform:1, pot_glow:1, pot_moon:1, q_patch:1, c_lace:1, p_sage:1, f_pale:1, lstring:1, gourds:1, birdcage:1, rtable:1 },
  at:[{ id:'braidrug', c:1, r:5 }, { id:'btable', c:2, r:5 }, { id:'chair', c:1, r:5 }, { id:'chair', c:3, r:5, f:1 }, { id:'lantern', c:7, r:4 }, { id:'armchair', c:2, r:2 }, { id:'starrug', c:5, r:8 }, { id:'telescope', c:8, r:9 }, { id:'globe', c:7, r:9 }, { id:'screen', c:0, r:9 }, { id:'seascape', c:0, r:0 }, { id:'bunting', c:2, r:0 }, { id:'lstring', c:6, r:0 }, { id:'kshelf', c:8, r:0 }, { id:'relicab', c:8, r:4 }, { id:'dressform', c:0, r:3 }, { id:'pot_glow', c:4, r:7 }, { id:'pot_moon', c:6, r:4 }, { id:'gourds', c:3, r:11 }, { id:'rtable', c:6, r:7 }, { id:'birdcage', c:6, r:7 }],
  paper:'p_sage', floor:'f_pale', bed:'b_plain', quilt:'q_patch', curtain:'c_lace' };
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const dn of ['iPhone 13', 'Pixel 7']) {
    const ctx = await b.newContext({ ...devices[dn] }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(dn + ': ' + e.message));
    const tag = dn.replace(' ', '');
    // tea: a room with Wren coming at 4
    await start(p, s => Object.assign({}, base, { time:965, home:room, tea:{ v:'wren', k:`${s.year}.${base.season}.${base.day}`, from:960, to:1080, done:false }, fr:Object.assign({}, s.fr, { wren:300 }) }));
    await tapTile(p, 1, 0, 3000); ok(dn + ' sleep sheet says how cosy', /The cottage feels/.test(await body(p)));
    await tapAct(p, 'gohome'); await wait(p, 1200);
    await p.screenshot({ path:`${OUT}/home2-room-${tag}.png` });
    // the guest sits on a chair by Bramble's table (1,5) or (3,5)
    await tapTile(p, 1, 5, 900); let bd = await body(p);
    if (!/Tea together/.test(bd)) { await closeSheets(p); await tapTile(p, 3, 5, 900); bd = await body(p); }
    ok(dn + ' tea with the guest', /Tea together/.test(bd));
    if (dn === 'iPhone 13') await p.screenshot({ path:`${OUT}/home2-tea-${tag}.png` });
    await closeSheets(p);
    // decorate: the cosy dots and the pot row
    await p.tap('#bDeco'); await wait(p, 400); await tapTile(p, 4, 9, 800); ok(dn + ' deco sheet shows cosiness', /cosy/.test(await body(p)) && /The cottage feels/.test(await body(p)));
    await closeSheets(p); await p.tap('#bDeco'); await wait(p, 300);
    // night
    await start(p, () => Object.assign({}, base, { time:1300, home:room }));
    await tapTile(p, 1, 0, 3000); await tapAct(p, 'gohome'); await wait(p, 1500);
    await p.screenshot({ path:`${OUT}/home2-night-${tag}.png` }); ok(dn + ' night draws', true);
    await ctx.close();
  }
  ok('no page errors', !errs.length); if (errs.length) console.log(errs.join('\n'));
  console.log(`home2phone: ${pass} passed, ${fail} failed`); await b.close();
})();
