// Festival overhaul (PLAN-festivals.md): the day, where everyone stands, booths, tickets, ribbons, prizes, every game
// played by bots (scores, medals, no errors), old saves and sheets. Run from a folder with b.js and shot-save.json.
// Usage: node festtest.js [runs per bot]
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", "globalThis.__t={get S(){return S},set S(x){S=x},startGame,endDay,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},get queue(){return queue},VILLAGERS,VIDS,where,villageFolk,enterVillage,leaveVillage,festOn,festBooths,festSpots,festBoothAt,festState,festPlayed,festAct,festMingle,hostBest,gameTier,boothHosts,boothRender,prizeStock,prizeBuy,FGAMES,fgStep,FEST,FEST_BOOTHS,FB_SPOT,VB,VSPOTS,DISHES,ITEMS,migrate,addFr,heartsOf,visit,update,draw,zaraAtCart,cartHere,openGame,fgStart,fgClose,get FG(){return FG},TIER_TICKETS,FEST_TICKET_PLAYS,FEST_MAIN_TICKETS,FEST_WEAR,KEEPSAKES,prizeOwned,festCard,ribbonYears,buildStatic,VISIT_SPOT,VISIT_STAND,witchSVG,wearingK:k=>wearing(k),witchSVGbare:n=>{const L=S.look;S.look=Object.assign({},L||{},{wear:[]});const r=witchSVG(n).length;S.look=L;return r},festDecor:()=>drawFestGrounds()};\n})();");
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = v, removeItem: k => delete store[k] };
eval(src); const t = __t; t.startGame(true); let S = t.S;
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; if (bad < 40) console.log('BAD', m); } };
const body = () => document.getElementById('shBody').innerHTML, clean = h => !/undefined|NaN|\[object/.test(h);
const close = () => { if (t.sheet && t.sheet !== 'fgame') t.closeSheet(); };
const RUNS = +process.argv[2] || 40;
close();
const setDay = (y, s, d, time) => { S.year = y; S.season = s; S.day = d; S.time = time; S.rain = false; S.visits = []; S.evToday = null; };

// --- the day: where everyone is, by the hour ---
setDay(2, 0, 14, 540); ok(!t.festOn(), 'on at 9am');
ok(t.VIDS.every(v => t.where(v) !== 'fest'), 'fest before 10');
S.time = 600; ok(t.festOn(), 'off at 10am');
ok(t.VIDS.every(v => t.where(v) === 'fest'), 'not everyone at the festival at 10am y2');
S.time = 1319; ok(t.festOn(), 'off at 9:59pm');
S.time = 1320; ok(!t.festOn(), 'on at 10pm'); ok(t.VIDS.every(v => t.where(v) !== 'fest'), 'fest after 10pm');
setDay(2, 0, 13, 700); ok(!t.festOn() && t.VIDS.every(v => t.where(v) !== 'fest'), 'fest on day 13');
// spring y1: only those who've arrived
setDay(1, 0, 14, 700); ok(t.where('zara') === 'away' && t.where('wren') === 'away' && t.where('silas') === 'away', 'late arrivals at the spring y1 festival');
ok(t.where('mara') === 'fest', 'mara not at spring y1 festival');

// --- spots and booths, every season and year ---
for (const y of [1, 2]) for (let s = 0; s < 4; s++) {
  setDay(y, s, 14, 700);
  const booths = t.festBooths(), spots = t.festSpots(), tiles = new Map(), key = (c, r) => c + ',' + r;
  ok(booths.some(b => b.id === 'prizes') && booths.some(b => b.main), `booths y${y}s${s}`);
  for (const b of booths) {
    for (let i = 0; i < (b.w || 1); i++) { const k = key(b.c + i, b.r); ok(!tiles.has(k), `booth overlap ${k} y${y}s${s}`); tiles.set(k, b.id); }
    ok(b.stand && b.stand[0] >= 0 && b.stand[0] < 9 && b.stand[1] >= 0 && b.stand[1] < 13, 'stand out of map ' + b.id);
    if (b.id !== 'prizes' && !b.main) { const G = t.FGAMES[b.id]; ok(G.fest === s, `${b.id} in season ${s}`); for (const v of G.host) ok(t.VILLAGERS[v].arrive <= s || y > 1, `${b.id} host ${v} not arrived y${y}s${s}`); }
  }
  const here = t.VIDS.filter(v => t.where(v) === 'fest');
  for (const v of here) {
    const q = spots[v]; ok(!!q, `${v} has no spot y${y}s${s}`); if (!q) continue;
    const k = key(q[0], q[1]); ok(!tiles.has(k), `${v} stands on ${tiles.get(k)} y${y}s${s}`); tiles.set(k, v);
    ok(q[0] >= 0 && q[0] < 9 && q[1] >= 0 && q[1] < 13, `${v} spot off the map`);
    ok(!booths.some(b => b.r === q[3] && q[2] >= b.c && q[2] < b.c + (b.w || 1)), `${v}'s stand tile is a booth`);
  }
  // hosts stand at their booth
  for (const b of booths) for (const v of t.boothHosts(b.id).filter(x => here.includes(x))) { const q = spots[v]; ok(q && Math.abs(q[0] - b.c) + Math.abs(q[1] - b.r) <= 2, `${v} far from ${b.id}`); }
  // villageFolk agrees, and draws/taps don't throw
  t.enterVillage(); const folk = t.villageFolk(); ok(folk.length === here.length && folk.every(f => !f.inside), `folk ${folk.length}/${here.length} y${y}s${s}`);
  try { t.buildStatic(); t.draw(); } catch (e) { ok(false, 'draw threw ' + e.message); }
  for (const b of booths) ok(t.festBoothAt(b.c, b.r) && t.festBoothAt(b.c, b.r).id === b.id, 'booth tap lookup ' + b.id);
  // every booth sheet renders
  for (const b of booths) { t.openSheet('booth', { p:b.id }); const h = body(); ok(clean(h), `booth ${b.id} sheet y${y}s${s}`); ok(b.id === 'prizes' || b.main || /data-act="fplay"/.test(h), 'no play button ' + b.id); close(); }
  t.openSheet('board'); ok(/Go to the festival/.test(body()), 'board festival card'); close();
  S.scene = 'farm';
}

// --- walking to a booth opens it, tapping a villager says hello (+30 once) ---
setDay(2, 2, 14, 700); S.fest = {}; t.enterVillage();
{ const b = t.festBooths().find(x => x.id === 'ringtoss'); t.visit('fbooth', { id:'ringtoss' }); ok(t.sheet === 'booth' && /Ring toss|Rowan/.test(body()), 'ring toss booth opens'); close(); }
{ const fr0 = S.fr.mara || 0; t.visit('vperson', { v:'mara' }); ok(t.sheet === 'villager' && (S.fr.mara || 0) - fr0 === 30, 'mingle +30'); ok(body().includes(t.FEST[2].lines.mara.slice(0, 20)), 'festival line shown'); close();
  t.visit('vperson', { v:'mara' }); ok((S.fr.mara || 0) - fr0 === 30, 'mingle twice'); close(); }
// before 10am: booths are decor only
S.time = 560; ok(!t.festBoothAt(7, 5), 'booth tappable before 10'); S.time = 700;

// --- the main events still work, and pay tickets ---
for (let s = 0; s < 4; s++) {
  setDay(3, s, 14, 700); S.fest = {}; S.tickets = 0; S.inv = { gourd:3, melon:2, mint:4 };
  const id = ['dance', 'wish', 'judging', 'swap'][s], act = ['dance', 'wish', 'fairenter', 'feastgive'][s], arg = ['rowan', 'fortune', 'melon', 'mint'][s];
  const c0 = S.coins; t.festAct(act, arg); const f = t.festState();
  ok(f.main && S.tickets === t.FEST_MAIN_TICKETS, `main event ${id} tickets ${S.tickets}`);
  t.festAct(act, arg); ok(S.tickets === t.FEST_MAIN_TICKETS, 'main event twice');
  t.openSheet('booth', { p:id }); ok(clean(body()) && body().includes('bubble'), 'main sheet after ' + id); close();
}
// the main event is closed outside the hours
setDay(3, 1, 14, 1330); S.fest = {}; t.festAct('wish', 'fortune'); ok(!t.festState().main, 'wish after 10pm');

// --- tickets, best scores and ribbons ---
setDay(1, 2, 14, 700); S.fest = {}; S.tickets = 0; S.ribbons = {};
{ const G = t.FGAMES.ringtoss, time0 = S.time;
  let r = t.festPlayed('ringtoss', G.tiers[2]); ok(r.tier === 3 && r.tk === 6 && S.tickets === 6, 'gold pays 6');
  ok(S.time - time0 === 30, 'a play takes 30 minutes');
  r = t.festPlayed('ringtoss', G.tiers[1]); ok(r.tk === 4, 'silver pays 4');
  r = t.festPlayed('ringtoss', 0); ok(r.tk === 1 && r.tier === 0, 'any play pays 1');
  r = t.festPlayed('ringtoss', G.tiers[2]); ok(r.tk === 0 && S.tickets === 11, 'fourth play paid');
  const fr0 = S.fr.rowan || 0, hb = t.hostBest('ringtoss');
  r = t.festPlayed('ringtoss', hb); ok(!r.ribbon, 'ribbon for matching the host');
  r = t.festPlayed('ringtoss', hb + 1); ok(r.ribbon && r.first && t.ribbonYears('ringtoss').includes(1) && (S.fr.rowan || 0) - fr0 === 80, 'ribbon for beating the host');
  r = t.festPlayed('ringtoss', hb + 2); ok(!r.ribbon && (S.fr.rowan || 0) - fr0 === 80, 'second ribbon same year');
  S.year = 2; S.fest = {}; ok(t.hostBest('ringtoss') === hb + G.step, 'host gets better each year');
  r = t.festPlayed('ringtoss', t.hostBest('ringtoss') + 1); ok(r.ribbon && !r.first && t.ribbonYears('ringtoss').join() === '1,2', 'ribbon year 2');
  S.year = 40; ok(t.hostBest('ringtoss') === G.max - 1, 'host best capped below max');
}
for (const [id, G] of Object.entries(t.FGAMES)) {
  ok(G.tiers[0] < G.tiers[1] && G.tiers[1] < G.tiers[2] && G.tiers[2] < G.best && G.best < G.max, id + ' tiers/best/max order');
  ok(typeof G.name === 'string' && G.how && G.unit && G.look && G.look.length === 2, id + ' fields');
}

// --- every game, played by bots ---
// Bots play like people: a reaction time before they can tap a new thing, a pause after each tap, and timing taps
// that land a little early or late (gaussian jitter). 'keen' is someone trying hard, 'casual' someone relaxed.
const W = 380, H = 560, DT = 1 / 60;
const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const LV = { keen:{ react:.36, rsd:.07, gap:.42, jit:.06, slip:.04 }, casual:{ react:.5, rsd:.12, gap:.7, jit:.1, slip:.1 } };
const busy = (st, lv) => (st._busy || 0) > st.t;
const tapped = (st, lv) => { st._busy = st.t + lv.gap * (0.8 + Math.random() * .4); };
const reacts = (st, key, lv) => { st._r = st._r || {}; if (st._r[key] === undefined) st._r[key] = st.t + Math.max(.18, lv.react + gauss() * lv.rsd); return st.t >= st._r[key]; };
// A timing tap: the bot knows how the marker moves (next(st) = seconds until it reaches the target) and taps then, a
// little early or late.
function timed(st, lv, next) {
  if (st._at === undefined) { const w = next(st); if (w === null) return false; st._at = st.t + Math.max(.05, w + gauss() * lv.jit); }
  if (st.t >= st._at) { st._at = undefined; return true; }
  return false;
}
// Seconds until f(x0 + s) crosses target, scanning ahead (s from minLead to 3 s); null if it doesn't.
function ahead(f, x0, target, minLead) { let prev = f(x0 + minLead) - target; for (let s = minLead + .01; s < 3; s += .01) { const c = f(x0 + s) - target; if ((c >= 0) !== (prev >= 0)) return s; prev = c; } return null; }
const BOTS = {
  dance:(st, g, lv) => { if (st.lit >= 0 && st.win > 0 && !st.hit && !busy(st, lv) && reacts(st, 'b' + st.k, lv)) { if (Math.random() > lv.slip) g.tap(st, (st.lit + .5) * W / 3, H * .7, W, H); tapped(st, lv); } },
  nightfish:(st, g, lv) => {
    if (st.ph === 'bite' && reacts(st, 'bite' + st.cast + st.bites, lv)) g.tap(st, W / 2, H / 2, W, H);
    if (st.ph !== 'reel') { st._at = undefined; return; }
    if (timed(st, lv, s => ahead(x => g.mark(x), s.rt, s.zc, .5))) g.tap(st, W / 2, H / 2, W, H);
  },
  ringtoss:(st, g, lv) => { if (st.ph !== 'aim') { st._at = undefined; st._tg = null; return; } st._tg = st._tg || (lv === LV.keen ? (Math.random() < .5 ? .5 : .31) : .12); if (timed(st, lv, s => ahead(x => g.mark(x), s.sw, s._tg, .5))) g.tap(st, 0, 0, W, H); },
  crowns:(st, g, lv) => {
    if (st._cards !== st.cards) { st._cards = st.cards; st._mem = {}; }
    for (let i = 0; i < st.cards.length; i++) if (st.cards[i].up) st._mem[i] = st.cards[i].f;
    if (busy(st, lv) || st.hold > 0 || st.redeal > 0) return;
    if (Math.random() < (lv === LV.keen ? .02 : .06)) for (const k of Object.keys(st._mem)) if (Math.random() < .5) delete st._mem[k]; // forgetting
    const down = [...Array(st.cards.length).keys()].filter(i => !st.cards[i].up && !st.cards[i].done), known = i => st._mem[i] !== undefined;
    let pick;
    if (st.open.length === 1) { const o = st.cards.indexOf(st.open[0]); pick = down.find(i => i !== o && known(i) && st._mem[i] === st.open[0].f); }
    else { for (const i of down.filter(known)) { const j = down.find(z => z !== i && known(z) && st._mem[z] === st._mem[i]); if (j !== undefined) { pick = i; break; } } }
    if (pick === undefined) { const unk = down.filter(i => !known(i)); pick = (unk.length ? unk : down)[(Math.random() * (unk.length || down.length)) | 0]; }
    if (pick === undefined) return; const r = g.rect(pick, W, H); g.tap(st, r.x + r.w / 2, r.y + r.h / 2, W, H); st._busy = st.t + lv.gap * 2.2 * (.8 + Math.random() * .4); // looking and remembering takes longer than tapping
  },
  petals:(st, g, lv) => { if (busy(st, lv)) return; for (const q of st.ps) if (reacts(st, q.id, lv)) { if (Math.random() > lv.slip) g.tap(st, q.x, q.y, W, H); tapped(st, lv); break; } },
  fireflies:(st, g, lv) => { if (busy(st, lv)) return; for (const q of st.ff) if (reacts(st, q.id, lv)) { const jx = gauss() * (lv === LV.keen ? 8 : 14), jy = gauss() * (lv === LV.keen ? 8 : 14); g.tap(st, q.x + jx, q.y + jy, W, H); tapped(st, lv); break; } },
  ducks:(st, g, lv) => { if (busy(st, lv)) return; for (const d of st.dk) if (d.x > 10 && d.x < W - 10 && reacts(st, d.id, lv) && (d.star || Math.random() < lv.slip * .3)) { g.tap(st, d.x, g.lanes[d.lane] * H, W, H); tapped(st, lv); break; } },
  turnip:(st, g, lv) => { if (st.ph !== 'eat') { st._e = null; return; } if (busy(st, lv)) return; if (reacts(st, 'e' + st.n, lv)) { if (Math.random() > lv.slip) g.tap(st, st.x * W, H * .66, W, H); tapped(st, lv); } },
  gourd:(st, g, lv) => { if (st.ph !== 'pick' || !reacts(st, 'r' + st.r, lv === LV.keen ? { react:1.2, rsd:.3 } : { react:1, rsd:.3 })) return;
    const left = [0, 1, 2].filter(i => i !== st.ruled), pick = lv === LV.keen ? (st.g[left[0]].s >= st.g[left[1]].s ? left[0] : left[1]) : (Math.random() < .5 ? left[0] : left[1]);
    const p = g.pos(pick, W, H); g.tap(st, p.x, p.y, W, H); },
  starmap:(st, g, lv) => { if (busy(st, lv) || st.wait > 0 || !st.stars.length) return; const q = st.stars.find(z => z.i === st.next); if (!q || !reacts(st, 's' + st.made + '-' + st.next, lv)) return; g.tap(st, q.x + gauss() * 6, q.y + gauss() * 6, W, H); tapped(st, lv); },
  cookies:(st, g, lv) => { if (st.ph !== 'copy' || busy(st, lv)) return; const L = st.seq.length, p = lv === LV.keen ? 1 - .012 * L : 1 - .035 * L; const d = Math.random() < p ? st.seq[st.k] : (st.seq[st.k] + 1) % 9; const q = g.dot(d, W, H); g.tap(st, q.x, q.y, W, H); tapped(st, lv); },
  snowball:(st, g, lv) => { if (busy(st, lv)) return; for (const q of st.tg) { q._id = q._id || Math.random(); if (reacts(st, q._id, lv)) { const c = g.cell(q.i, W, H); if (Math.random() > lv.slip) g.tap(st, c.x, c.y, W, H); tapped(st, lv); break; } } },
};
const report = [], TK = {};
for (const [id, G] of Object.entries(t.FGAMES)) {
  const bot = BOTS[id]; if (!bot) { ok(false, 'no bot for ' + id); continue; }
  const res = {};
  for (const [lvName, lv] of Object.entries(LV)) {
    const sc = [];
    for (let i = 0; i < RUNS; i++) {
      const st = G.init(W, H); st.t = 0; st.score = st.score || 0; let steps = 0, end = false;
      try { while (!end && steps < 60 * 300) { bot(st, G, lv); end = t.fgStep(st, id, DT, W, H); steps++; } } catch (e) { ok(false, `${id} threw ${e.message}`); break; }
      ok(end, `${id} never ended`); ok(Number.isFinite(st.score) && st.score >= 0, `${id} bad score ${st.score}`); sc.push(st.score);
      if (i === 0) { const g = document.getElementById('fgC').getContext('2d'); try { G.draw(g, st, W, H); } catch (e) { ok(false, `${id} draw threw ${e.message}`); } }
      res.secs = Math.round(steps * DT);
    }
    sc.sort((a, b) => a - b); res[lvName] = { med:sc[sc.length >> 1], lo:sc[Math.floor(sc.length * .1)], hi:sc[Math.floor(sc.length * .9)], tiers:[0, 1, 2, 3].map(k => sc.filter(x => t.gameTier(id, x) === k).length) };
  }
  ok(res.keen.med >= G.tiers[1], `${id}: a keen player should reach silver (median ${res.keen.med})`);
  ok(res.casual.med >= G.tiers[0], `${id}: a casual player should reach bronze (median ${res.casual.med})`);
  ok(!G.secs || res.keen.hi < G.max, `${id}: max reachable too easily`); // timed games have no natural cap; round-based ones can be played perfectly
  ok(res.keen.med <= G.best, `${id}: a keen player usually beats the host (median ${res.keen.med}, host ${G.best})`);
  TK[id] = { keen:res.keen.tiers.reduce((a, c, k) => a + c * t.TIER_TICKETS[k], 0) / RUNS * t.FEST_TICKET_PLAYS, casual:res.casual.tiers.reduce((a, c, k) => a + c * t.TIER_TICKETS[k], 0) / RUNS * t.FEST_TICKET_PLAYS };
  report.push(`${id.padEnd(10)} ${String(res.secs).padStart(3)}s  keen med ${res.keen.med} (${res.keen.lo}-${res.keen.hi}) medals ${res.keen.tiers.join('/')}  casual med ${res.casual.med} (${res.casual.lo}-${res.casual.hi}) medals ${res.casual.tiers.join('/')}  tiers ${G.tiers.join('/')} host ${G.best}`);
}

// --- the overlay opens, plays and closes ---
setDay(2, 3, 14, 700); S.fest = {}; S.tickets = 0; t.enterVillage();
t.openGame('snowball'); ok(t.sheet === 'fgame' && t.FG && t.FG.phase === 'intro', 'overlay intro');
ok(/data-gact="go"/.test(document.getElementById('fgCard').innerHTML), 'play button in card');
t.fgStart(); ok(t.FG.phase === 'play', 'overlay play'); t.closeSheet(); ok(t.sheet === 'fgame', 'closeSheet closed the game');
t.FG.st.score = 30; t.FG.st.t = 41; t.fgStep(t.FG.st, 'snowball', .01, W, H);
// finish by hand the way the loop does
{ const before = S.tickets; const r = t.festPlayed('snowball', 30); ok(S.tickets > before, 'tickets from overlay play'); }
t.fgClose(); ok(t.sheet === 'booth', 'back to the booth after a game'); close();
ok(!t.FG, 'FG cleared');
// the clock doesn't move while playing
{ S.time = 700; t.openGame('snowball'); const t0 = S.time; t.update(2); ok(S.time === t0, 'clock moved during a game'); t.fgClose(); close(); }
S.time = 1310; t.openGame('snowball'); ok(t.FG, 'game opens at 9:50pm'); t.fgClose(); close();
S.time = 1330; t.openGame('snowball'); ok(!t.FG, 'game opened after close');

// --- the prize stall ---
for (const y of [1, 2]) for (let s = 0; s < 4; s++) {
  setDay(y, s, 14, 700); S.fest = {}; S.tickets = 200; S.recipes = { minnowfry:true }; S.prizes = {};
  const st = t.prizeStock(); ok(st.length >= 3, `stock y${y}s${s}`); ok(st.some(w => w.id.startsWith('r:')), 'recipe in stock s' + s);
  const ss = S.inv.starshard || 0; ok(t.prizeBuy('starshard') && S.inv.starshard === ss + 1, 'starshard'); ok(!t.prizeBuy('starshard'), 'two starshards');
  const sd = st.find(w => w.id === 'seeds'); if (sd) { ok(t.prizeBuy('seeds') && t.prizeBuy('seeds') && !t.prizeBuy('seeds'), 'seeds limit 2'); }
  const r = st.find(w => w.id.startsWith('r:')); ok(t.prizeBuy(r.id) && S.recipes[r.id.slice(2)], 'recipe learned'); ok(!t.prizeBuy(r.id), 'recipe twice');
  ok(t.DISHES[r.id.slice(2)].fest === s, 'recipe for the right festival');
  t.openSheet('booth', { p:'prizes' }); ok(clean(body()) && /Got it/.test(body()), 'prize sheet'); close();
  S.tickets = 3; ok(!t.prizeBuy('seeds'), 'bought without tickets');
  S.time = 1330; S.tickets = 100; S.fest = {}; ok(!t.prizeBuy('starshard'), 'bought after close');
}
// Zara sells her wares at the stall too
setDay(2, 1, 14, 700); S.fest = {}; t.enterVillage(); ok(t.zaraAtCart(), 'zara at the prize stall'); t.openSheet('booth', { p:'prizes' }); ok(/Zara's wares/.test(body()), 'wares at the prize stall'); close();
setDay(1, 0, 14, 700); S.fest = {}; t.enterVillage(); ok(t.boothHosts('prizes')[0] === 'aldous' && !t.cartHere(), 'aldous runs spring y1'); t.openSheet('booth', { p:'prizes' }); ok(/Aldous/.test(body()) && clean(body()), 'aldous prize table'); close();

// --- festival wardrobe: bought with tickets, worn from the mirror, drawn in the mirror and the world ---
for (let s = 0; s < 4; s++) {
  setDay(2, s, 14, 700); S.fest = {}; S.tickets = 500; S.prizes = {}; S.look = null;
  const wear = Object.keys(t.FEST_WEAR).filter(k => t.FEST_WEAR[k].fest === s); ok(wear.length === 2, 'two wardrobe pieces s' + s);
  for (const k of wear) { ok(t.prizeStock().some(w => w.id === 'w:' + k), k + ' in stock'); ok(t.prizeBuy('w:' + k) && t.prizeOwned(k), k + ' bought'); ok(!t.prizeBuy('w:' + k), k + ' twice'); }
  t.openSheet('wardrobe'); let h = body(); ok(wear.every(k => h.includes(t.FEST_WEAR[k].name)) && /Festival finery/.test(h), 'mirror lists finery s' + s); close();
  for (const k of wear) { const L = Object.assign({}, S.look || {}); S.look = Object.assign(L, { wear:[k] }); ok(t.wearingK(k), k + ' worn'); const svg = t.witchSVG(100); ok(svg.length > t.witchSVGbare(100) && clean(svg), k + ' drawn in the mirror'); try { t.draw(); } catch (e) { ok(false, k + ' world draw ' + e.message); } }
}
{ S.prizes = {}; S.look = { wear:['crown'] }; ok(!t.wearingK('crown'), 'wearing a crown she does not own'); }
// --- garden keepsakes: one per festival, drawn on the farm ---
for (let s = 0; s < 4; s++) {
  setDay(2, s, 14, 700); S.fest = {}; S.tickets = 100; S.prizes = {};
  const ks = Object.keys(t.KEEPSAKES).filter(k => t.KEEPSAKES[k].fest === s); ok(ks.length === 1, 'one keepsake s' + s);
  ok(t.prizeBuy('k:' + ks[0]) && t.prizeOwned(ks[0]) && !t.prizeBuy('k:' + ks[0]), 'keepsake bought once s' + s);
}
{ S.prizes = { maypole:1, lanternpost:1, scarecrow:1, starlantern:1 }; S.scene = 'farm'; S.time = 1300; try { t.buildStatic(); t.draw(); ok(true, 'keepsakes draw'); } catch (e) { ok(false, 'keepsake draw ' + e.message); }
  const tiles = Object.values(t.KEEPSAKES).map(k => k.at.join(',')); ok(new Set(tiles).size === 4, 'keepsake tiles unique');
  for (const k of Object.values(t.KEEPSAKES)) { const [c, r] = k.at; ok(!(c >= 1 && c <= 7 && r >= 3 && r <= 10), k.name + ' in the field'); ok(!Object.values(t.VISIT_SPOT).some(v => v[0] === c && v[1] === r) && !Object.values(t.VISIT_STAND).some(v => v[0] === c && v[1] === r), k.name + ' on a visitor spot'); }
  S.prizes = {}; }

// --- the Festivals page ---
S.fbest = { ringtoss:14 }; S.ribbons = { ringtoss:[1, 2], crowns:[2] }; S.tickets = 9;
t.openSheet('journal'); ok(true, 'journal'); t.renderSheet('festbook'); { const h = body(); ok(clean(h) && /Ring toss/.test(h) && /yours 14/.test(h) && /year 1, year 2/.test(h) && /Ribbons won: 3/.test(h), 'festbook'); } close();
setDay(2, 2, 14, 700); S.fest = {}; t.festPlayed('ringtoss', 20); ok(S.fbest.ringtoss === 20, 'best ever updates'); t.festPlayed('ringtoss', 5); ok(S.fbest.ringtoss === 20, 'best ever kept');

// --- festival dishes: cookable, sell below their makings, not on the recipe-card shelf ---
for (const k of Object.keys(t.DISHES).filter(k => t.DISHES[k].from === 'fest')) {
  const d = t.DISHES[k]; ok(Object.keys(d.need).every(i => t.ITEMS[i]), k + ' ingredients');
  ok(t.ITEMS[k].sell < Object.entries(d.need).reduce((a, [i, n]) => a + t.ITEMS[i].sell * n, 0), k + ' sells for more than its makings');
}

// --- rain never falls on festival day ---
{ let wet = 0; setDay(2, 0, 10, 600);
  for (let i = 0; i < 400; i++) { S.day = 13; S.season = i % 4; S.nextRain = true; t.endDay(); close(); if (S.rain) wet++; ok(S.day === 14, 'endDay day'); }
  ok(wet === 0, 'rain on festival day ' + wet); }

// --- saves: old festival entries, a save made on festival day, round trip ---
{ const old = JSON.parse(fs.readFileSync('shot-save.json', 'utf8')); old.fest = { y1s0:{ m:{ mara:true }, main:'rowan', txt:'x', home:true } }; delete old.tickets; delete old.ribbons; delete old.prizes;
  const m = t.migrate(old); ok(m && m.tickets === 0 && m.ribbons && m.prizes, 'migrate defaults'); t.S = m; S = m;
  setDay(1, 0, 14, 700); ok(t.festState().main === 'rowan' && t.festState().plays, 'old festival entry'); t.openSheet('booth', { p:'dance' }); ok(clean(body()), 'old entry renders'); close();
  S.tickets = 17; S.ribbons = { ringtoss:[1] }; S.prizes = { x:true };
  const back = t.migrate(JSON.parse(JSON.stringify(S))); ok(back.tickets === 17 && back.ribbons.ringtoss[0] === 1 && back.prizes.x, 'round trip'); }

console.log(report.join('\n'));
// Tickets a festival pays: three plays of each game there plus the main event. And what the prize stall costs.
for (let s = 0; s < 4; s++) {
  setDay(2, s, 14, 700); S.fest = {}; S.prizes = {}; S.recipes = {};
  const games = t.FEST_BOOTHS[s].map(b => b.id).filter(id => t.FGAMES[id]);
  const per = lv => Math.round(games.reduce((a, id) => a + TK[id][lv], 0) + t.FEST_MAIN_TICKETS);
  const once = t.prizeStock().filter(w => w.id.includes(':')).reduce((a, w) => a + w.cost, 0);
  console.log(`${t.FEST[s].name.padEnd(13)} games ${games.length}: keen about ${per('keen')} tickets, casual about ${per('casual')}. One-off prizes here cost ${once}; Starshard 25, seeds 10 each.`);
}
console.log(`${n - bad}/${n} festival checks passed`);
process.exit(bad ? 1 : 0);
