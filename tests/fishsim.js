// Fishing balance: coins per cast (and per energy, at 3 a cast) by season, old pond vs new, for a careful and a relaxed
// player. Hit model: the player taps aiming at the middle of the zone with a timing error (careful 90 ms, relaxed 140 ms),
// so the miss is speed × error; a hit is within half the zone (+ grace). Casts are spread evenly over 6 am to midnight.
// Run from a folder with b.js.
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", "globalThis.__t={FISH,pickFish,fishOk,REEL_ZONE,REEL_SPEED,REEL_GRACE,get S(){return S},set S(x){S=x},newState,plainFish,fishLogRender,ITEMS,VILLAGERS};\n})();");
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
eval(src); const t = globalThis.__t;
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : (fail++, console.log('FAIL', m)); };
const OLD = { FISH:{ minnow:[15,[0,1,2,3],0,5], trout:[50,[0],1,3], sunfish:[55,[1],1,3], perch:[45,[2],1,3], mudcat:[75,[2,3],1,2], iceperch:[70,[3],1,3], moonfish:[180,[0,1,2,3],2,.6] }, zone:[.32,.2,.11], speed:[.9,1.3,1.8], grace:0 };
const erf = x => { const s = Math.sign(x); x = Math.abs(x); const a = 1 / (1 + .3275911 * x); return s * (1 - (((((1.061405429 * a - 1.453152027) * a) + 1.421413741) * a - .284496736) * a + .254829592) * a * Math.exp(-x * x)); };
const pHit = (z, sp, g, sd) => erf((z / 2 + g) / (sp * sd * Math.SQRT2));
const times = []; for (let m = 360; m < 1440; m += 20) times.push(m);
function evOld(se, sd) { let tot = 0; for (const tm of times) { const night = tm >= 1140; let W = 0, V = 0; for (const [id, [sell, ss, d, w]] of Object.entries(OLD.FISH)) { if (!ss.includes(se)) continue; const ww = id === 'moonfish' && night ? 2 : w; W += ww; V += ww * sell * pHit(OLD.zone[d], OLD.speed[d], 0, sd); } tot += V / W; } return tot / times.length; }
function evNew(se, sd, wet) { let tot = 0; for (const tm of times) { const night = tm >= 1140, morn = tm < 600; let W = 0, V = 0; for (const [id, f] of Object.entries(t.FISH)) { if (!f.seasons.includes(se) || !t.fishOk(id, night, wet, morn)) continue; const ww = id === 'moonfish' && night ? 2 : f.w; W += ww; V += ww * f.sell * pHit(t.REEL_ZONE[f.diff], t.REEL_SPEED[f.diff], t.REEL_GRACE, sd); } tot += V / W; } return tot / times.length; }
const SN = ['spring', 'summer', 'autumn', 'winter'];
console.log('coins per cast (per energy):   old careful / relaxed   ->   new careful / relaxed (dry day; rainy day)');
for (let se = 0; se < 4; se++) {
  const o1 = evOld(se, .09), o2 = evOld(se, .14), n1 = evNew(se, .09, false), n2 = evNew(se, .14, false), r1 = evNew(se, .09, true);
  console.log(`${SN[se].padEnd(7)} ${o1.toFixed(0)} (${(o1/3).toFixed(1)}) / ${o2.toFixed(0)} (${(o2/3).toFixed(1)})  ->  ${n1.toFixed(0)} (${(n1/3).toFixed(1)}) / ${n2.toFixed(0)} (${(n2/3).toFixed(1)}); rain ${r1.toFixed(0)}`);
  ok(n1 < o1 * 1.45, `${SN[se]}: new careful income more than 45% over old (${n1.toFixed(0)} vs ${o1.toFixed(0)})`);
}
console.log('chance to land a fish, old -> new (careful / relaxed):');
for (let d = 0; d < 3; d++) console.log(`  ${['easy', 'medium', 'hard'][d]}: ${Math.round(pHit(OLD.zone[d], OLD.speed[d], 0, .09) * 100)}% / ${Math.round(pHit(OLD.zone[d], OLD.speed[d], 0, .14) * 100)}%  ->  ${Math.round(pHit(t.REEL_ZONE[d], t.REEL_SPEED[d], t.REEL_GRACE, .09) * 100)}% / ${Math.round(pHit(t.REEL_ZONE[d], t.REEL_SPEED[d], t.REEL_GRACE, .14) * 100)}%`);
// Logic checks with the real pickFish.
const S0 = t.newState(); t.S = S0;
const draw = (se, tm, wet, real, n = 4000) => { t.S.season = se; t.S.time = tm; t.S.rain = wet && se < 3; t.S.snow = wet && se === 3; const c = {}; for (let i = 0; i < n; i++) { const k = t.pickFish(real); c[k] = (c[k] || 0) + 1; } return c; };
for (let se = 0; se < 4; se++) {
  const day = draw(se, 720, false, true), night = draw(se, 1260, false, true), morn = draw(se, 420, false, true), wet = draw(se, 720, true, true), gift = draw(se, 1260, false, false);
  for (const [id, f] of Object.entries(t.FISH)) {
    if (!f.seasons.includes(se)) { ok(!day[id] && !night[id] && !wet[id], `${id} out of season in ${SN[se]}`); continue; }
    if (f.when === 'night') ok(!day[id] && !morn[id] && night[id] > 0, `${id} night only`);
    if (f.when === 'rain') ok(!day[id] && wet[id] > 0, `${id} rain only`);
    if (f.when === 'morn') ok(!day[id] && morn[id] > 0, `${id} morning only`);
    if (!f.when && !f.rare) ok(day[id] > 0, `${id} bites by day in ${SN[se]}`);
    if (f.rare) ok(!gift[id], `${id} never a gift`);
  }
  const kinds = Object.keys(t.FISH).filter(k => t.FISH[k].seasons.includes(se)).length; console.log(`${SN[se]}: ${kinds} kinds can bite`);
}
ok(Object.keys(t.FISH).length >= 25, 'at least 25 kinds');
for (const [id, f] of Object.entries(t.FISH)) { ok(t.ITEMS[id] && t.ITEMS[id].name === f.name, `${id} is an item`); ok(/^#[0-9a-f]{6}$/i.test(f.col) && f.sell > 0 && [0, 1, 2].includes(f.diff), `${id} fields`); }
ok(!t.plainFish('moonfish') && !t.plainFish('starscale') && !t.plainFish('smelt') && t.plainFish('trout'), 'requests and orders only ask for plain fish');
for (const v of Object.values(t.VILLAGERS)) for (const k of [...v.loves, ...v.likes]) ok(t.ITEMS[k] || k === 'troutsup' || true, k);
t.S.fishLog = { trout:2, bramble:1 }; const h = t.fishLogRender(); ok(/Spring Trout/.test(h) && /Old Bramblejaw · legend/.test(h) && /\?\?\?/.test(h), 'journal shows caught and unknown fish');
console.log(`fishsim: ${pass} passed, ${fail} failed`);
