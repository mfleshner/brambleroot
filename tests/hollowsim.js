// The deep Hollow (PLAN-hollow.md Part 1): a bot dives from floor 1 to the bottom, a dive a day, starting each dive
// at the deepest lift stop. It taps the nearest creature it can hit, uses springs, waits for Glowworms to glow and
// steps aside when a Warden glows. Reports dives needed, faints, Warden tries, and value per dive by band.
// Run from tests/ after `python3 extract.py` (needs b.js). Optional args: mana max, energy, number of runs.
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", "globalThis.__t={get S(){return S},get HV(){return HV},startGame,update,hollowTap,enterHollow,closeSheet,get sheet(){return sheetOpen},get ox(){return ox},get oy(){return oy},get T(){return T},witch,MOBS,WARDENS,BANDS,ITEMS,liftStops,HOLLOW_BOTTOM,mobLit,effHp,migrate,renderSheet,openSheet};\n})();");
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem:k => store[k] ?? null, setItem:(k, v) => store[k] = String(v), removeItem:k => delete store[k] };
eval(src); const t = __t;
const MANA = +(process.argv[2] || 45), ENERGY = +(process.argv[3] || 110), RUNS = +(process.argv[4] || 40);
const worth = S => S.coins + Object.entries(S.inv).reduce((a, [k, n]) => a + (t.ITEMS[k] && t.ITEMS[k].sell ? t.ITEMS[k].sell * n : 0), 0);
const tapAt = (x, y) => t.hollowTap(t.ox + (x + .5) * t.T, t.oy + (y + .5) * t.T);
let pass = 0, bad = 0; const ok = (c, m) => { if (c) pass++; else { bad++; console.log('FAIL', m); } };

function newGame() {
  const save = JSON.parse(fs.readFileSync('shot-save.json', 'utf8')); save.grove = true; save.time = 600; save.day = 10; save.hollowMax = 0; delete save.hollow;
  for (const k of ['firebolt', 'frost']) if (!save.spells.includes(k)) save.spells.push(k);
  localStorage.setItem('brambleroot-save-v1', JSON.stringify(save)); t.startGame(false); while (t.sheet) t.closeSheet();
  const S = t.S; S.hollowMax = 0; S.hollow = t.migrate(save).hollow; S.inv = {}; S.spells = save.spells.slice(); // startGame keeps the game in memory, so reset the Hollow by hand
  return S;
}
function dive(S, start) {
  S.manaMax = MANA; S.mana = MANA; S.energy = ENERGY; S.maxEnergy = ENERGY; S.scene = 'wood'; S.fainted = false;
  const stops = S.hollowMax ? t.liftStops() : [1], f0 = start || stops[stops.length - 1];
  const v0 = worth(S); t.enterHollow(f0); let g = 0, fainted = false, floors = 0, at = 0;
  while (g++ < 60000) {
    while (t.sheet) t.closeSheet();
    const H = t.HV; if (!H || S.scene !== 'hollow') { fainted = !!S.fainted; break; }
    if (H.floor !== at) { at = H.floor; } if (!H.mobs.length && H.counted !== true) { H.counted = true; floors++; }
    if (H.spring && S.mana < S.manaMax * .8 && !H.mobs.some(m => Math.hypot(m.x - 1, m.y - 11) < 2.5)) { tapAt(1, 11); for (let i = 0; i < 200 && t.HV === H && H.spring; i++) t.update(1 / 30); continue; }
    if (H.mobs.length) {
      const w = H.warden && H.mobs.includes(H.warden) ? H.warden : null;
      if (w && w.st === 'glow' && !t.witch.dodged) { t.witch.dodged = true; const nx = t.witch.x < 4 ? Math.min(8, t.witch.x + 3) : Math.max(0, t.witch.x - 3); tapAt(nx, t.witch.y); }
      else if (!w || w.st !== 'glow') t.witch.dodged = false;
      const lit = H.mobs.filter(t.mobLit).sort((a, b) => Math.hypot(a.x - t.witch.x, a.y - t.witch.y) - Math.hypot(b.x - t.witch.x, b.y - t.witch.y));
      const pend = m => H.bolts.filter(b => b.m === m).length, m = lit.find(x => pend(x) < t.effHp(x));
      if (S.mana < 2 && !H.bolts.length) break;
      if (m && S.mana >= 2) { const sc = t.MOBS[m.k].size || 1; t.hollowTap(t.ox + (m.x + .5) * t.T, t.oy + (m.y + .5 - .2 * sc) * t.T); }
    } else if (H.stairs) {
      if (S.mana < 6) break;
      tapAt(H.stairs[0], H.stairs[1]); for (let i = 0; i < 300 && t.HV === H; i++) t.update(1 / 30); continue;
    } else break; // the bottom
    for (let i = 0; i < 6; i++) { t.update(1 / 30); if (!t.HV) break; }
  }
  if (S.scene === 'hollow') { S.scene = 'wood'; } // climb the ladder
  return { f0, deep:S.hollowMax, value:worth(S) - v0, fainted, floors };
}
const band = f => Math.min(2, Math.floor((f - 1) / 10));
const stats = { dives:[], faints:0, tries:{ 10:0, 20:0, 30:0 }, val:[[], [], []], reach:[[], [], []], again:[[], [], []] };
for (let run = 0; run < RUNS; run++) {
  const S = newGame(); let n = 0, last = 0;
  while (S.hollowMax < t.HOLLOW_BOTTOM || !S.hollow.wardens[30]) {
    if (n++ > 200) break;
    S.day = S.day % 28 + 1;
    const r = dive(S); if (r.fainted) stats.faints++;
    stats.reach[band(r.f0)].push(r.floors);
    last = r.deep;
  }
  for (const [i, f0] of [[0, 1], [1, 10], [2, 20]]) for (let k = 0; k < 8; k++) { S.day = S.day % 28 + 1; const r = dive(S, f0); stats.val[i].push(r.value); stats.again[i].push(r.floors); }
  stats.dives.push(n); for (const f of [10, 20, 30]) stats.tries[f] += S.hollow.tries[f] || 0;
  if (run === 0) {
    ok(S.hollowMax === 30 && S.hollow.wardens[10] && S.hollow.wardens[20] && S.hollow.wardens[30], 'the bot beats all three Wardens');
    ok(Object.keys(S.hollow.pages).length === 3, 'three journal pages found');
    ok(['puffcap', 'glowworm', 'sporeslime', 'shardcrab', 'sprite', 'geode'].every(k => S.hollow.met[k] > 0), 'all six new creatures beaten: ' + JSON.stringify(S.hollow.met));
    ok(t.liftStops().join() === '1,5,10,15,20,25,30', 'lift stops every fifth floor: ' + t.liftStops().join());
    t.openSheet('cave'); const body = document.getElementById('shBody').innerHTML;
    ok(/Glowcap Grotto/.test(body) && /Crystal Caves/.test(body) && /Aunt Bramble's journal/.test(body) && !/undefined|NaN/.test(body), 'lift sheet: bands, creatures and pages');
    t.closeSheet();
    const m = t.migrate(JSON.parse(JSON.stringify(S))); ok(m.hollow.wardens[30] && m.hollow.met.geode > 0, 'deep Hollow progress survives a save round trip');
  }
}
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
console.log(`mana ${MANA}, energy ${ENERGY}, ${RUNS} runs`);
console.log(`dives from a new Hollow to beating the Crystal Queen: average ${avg(stats.dives).toFixed(1)}, range ${Math.min(...stats.dives)} to ${Math.max(...stats.dives)}`);
console.log(`faints: ${(stats.faints / RUNS).toFixed(1)} per run · Warden tries per run: floor 10 ${(stats.tries[10] / RUNS).toFixed(1)}, floor 20 ${(stats.tries[20] / RUNS).toFixed(1)}, floor 30 ${(stats.tries[30] / RUNS).toFixed(1)}`);
console.log('floors cleared per dive, first time down / later dives from the band\'s top stop · value of a later dive (coins + drops at sell price, no one-off rewards):');
['Mossy Hollow (1-10)', 'Glowcap Grotto (11-20)', 'Crystal Caves (21-30)'].forEach((nm, i) => console.log(`  ${nm.padEnd(24)} ${avg(stats.reach[i]).toFixed(1)} / ${avg(stats.again[i]).toFixed(1)} floors · ${Math.round(avg(stats.val[i]))} coins`));
console.log(`checks: ${pass} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
