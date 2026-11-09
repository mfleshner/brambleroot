// The deep Hollow (PLAN-hollow.md Parts 1-3): a bot dives from floor 1 to the Heart (floor 100), a dive a day, starting each dive
// at the deepest lift stop. It taps the nearest creature it can hit, uses springs, waits for Glowworms to glow and
// steps aside when a Warden glows. Reports dives needed, faints, Warden tries, and value per dive by band.
// Part 2: it buys Crystal Focus as soon as it has the materials (coins assumed), and carries DRAUGHTS Mana Draughts a dive,
// drinking one when it runs low. Run from tests/ after `python3 extract.py` (needs b.js).
// Optional args: base mana max, energy, number of runs, draughts per dive (0-3), focus on/off (1/0).
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", "globalThis.__t={get S(){return S},get HV(){return HV},startGame,update,hollowTap,enterHollow,closeSheet,get sheet(){return sheetOpen},get ox(){return ox},get oy(){return oy},get T(){return T},witch,drinkDraught,pouchLeft,UPGRADES,FOCUS,MOBS,WARDENS,BANDS,ITEMS,liftStops,HOLLOW_BOTTOM,mobLit,effHp,migrate,renderSheet,openSheet};\n})();");
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem:k => store[k] ?? null, setItem:(k, v) => store[k] = String(v), removeItem:k => delete store[k] };
eval(src); const t = __t;
const MANA = +(process.argv[2] || 45), ENERGY = +(process.argv[3] || 110), RUNS = +(process.argv[4] || 40), DRAUGHTS = +(process.argv[5] ?? 3), FOCUS_ON = (process.argv[6] ?? '1') === '1';
const NB = 11, WF = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]; // band 10 here = the Endless Below
const worth = S => S.coins + Object.entries(S.inv).reduce((a, [k, n]) => a + (t.ITEMS[k] && t.ITEMS[k].sell ? t.ITEMS[k].sell * n : 0), 0);
const tapAt = (x, y) => t.hollowTap(t.ox + (x + .5) * t.T, t.oy + (y + .5) * t.T);
let pass = 0, bad = 0; const ok = (c, m) => { if (c) pass++; else { bad++; console.log('FAIL', m); } };

function newGame() {
  const save = JSON.parse(fs.readFileSync('shot-save.json', 'utf8')); save.grove = true; save.time = 600; save.day = 10; save.hollowMax = 0; delete save.hollow;
  for (const k of ['firebolt', 'frost']) if (!save.spells.includes(k)) save.spells.push(k);
  localStorage.setItem('brambleroot-save-v1', JSON.stringify(save)); t.startGame(false); while (t.sheet) t.closeSheet();
  const S = t.S; S.hollowMax = 0; S.hollow = t.migrate(save).hollow; S.inv = {}; S.spells = save.spells.slice(); S.up = Object.assign({}, save.up || {}); delete S.at30; delete S.at70; S.focusAt = {}; // startGame keeps the game in memory, so reset the Hollow by hand
  return S;
}
function dive(S, start, into) {
  if (FOCUS_ON) for (const k of t.FOCUS) { const U = t.UPGRADES[k]; if (!S.up[k] && (!U.needs || S.up[U.needs]) && Object.entries(U.items).every(([i, n]) => (S.inv[i] || 0) >= n)) { S.up[k] = true; for (const [i, n] of Object.entries(U.items)) S.inv[i] -= n; S.focusAt = S.focusAt || {}; S.focusAt[k] = S.hollowMax; } }
  const fl = t.FOCUS.filter(k => S.up[k]).length; S.manaMax = MANA + 10 * fl; S.mana = S.manaMax; S.inv.manadraught = DRAUGHTS; S.energy = ENERGY; S.maxEnergy = ENERGY; S.scene = 'wood'; S.fainted = false;
  const stops = S.hollowMax ? t.liftStops() : [1], f0 = start || stops[stops.length - 1];
  S.time = 600; const v0 = worth(S); t.enterHollow(f0); let g = 0, fainted = false, floors = 0, at = 0;
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
      if (S.mana < 4 && t.pouchLeft() > 0) t.drinkDraught();
      if (S.mana < 2 && !H.bolts.length) break;
      if (m && S.mana >= 2) { const sc = t.MOBS[m.k].size || 1; t.hollowTap(t.ox + (m.x + .5) * t.T, t.oy + (m.y + .5 - .2 * sc) * t.T); }
    } else if (H.stairs && H.floor >= t.HOLLOW_BOTTOM && !into) break; // first trips stop at the Heart
    else if (H.stairs) {
      if (S.mana < 6 && t.pouchLeft() > 0) t.drinkDraught();
      if (S.mana < 6) break;
      tapAt(H.stairs[0], H.stairs[1]); for (let i = 0; i < 300 && t.HV === H; i++) t.update(1 / 30); continue;
    } else break; // the bottom
    for (let i = 0; i < 6; i++) { t.update(1 / 30); if (!t.HV) break; }
  }
  if (S.scene === 'hollow') { S.scene = 'wood'; } // climb the ladder
  const left = S.inv.manadraught || 0; S.inv.manadraught = 0; // draughts aren't part of a dive's value
  stats.mins.push(S.time - 600); return { f0, deep:S.hollowMax, value:worth(S) - v0 - left * 40 + DRAUGHTS * 40, fainted, floors, drank:DRAUGHTS - left };
}
const band = f => Math.min(NB - 1, Math.floor((f - 1) / 10));
const stats = { mins:[], dives:[], to30:[], to70:[], faints:0, tries:Object.fromEntries(WF.map(f => [f, 0])), val:[...Array(NB)].map(() => []), reach:[...Array(NB)].map(() => []), again:[...Array(NB)].map(() => []), drank:[], focus:{} };
for (let run = 0; run < RUNS; run++) {
  const S = newGame(); let n = 0, last = 0;
  while (S.hollowMax < t.HOLLOW_BOTTOM || !S.hollow.wardens[100]) {
    if (n++ > 300) break;
    if (S.hollow.wardens[30] && !S.at30) S.at30 = n; if (S.hollow.wardens[70] && !S.at70) S.at70 = n;
    S.day = S.day % 28 + 1;
    const r = dive(S); if (r.fainted) stats.faints++; stats.drank.push(r.drank);
    stats.reach[band(r.f0)].push(r.floors);
    last = r.deep;
  }
  for (const [i, f0] of [[0, 1], [1, 10], [2, 20], [3, 30], [4, 40], [5, 50], [6, 60], [7, 70], [8, 80], [9, 90], [10, 100]]) for (let k = 0; k < 6; k++) { S.day = S.day % 28 + 1; const r = dive(S, f0, f0 >= 100); stats.val[i].push(r.value); stats.again[i].push(r.floors); }
  stats.dives.push(n); stats.to30.push(S.at30 || n); stats.to70.push(S.at70 || n); for (const f of WF) stats.tries[f] += S.hollow.tries[f] || 0; for (const k in S.focusAt || {}) (stats.focus[k] = stats.focus[k] || []).push(S.focusAt[k]);
  if (run === 0) {
    ok(S.hollowMax >= 100 && WF.every(f => S.hollow.wardens[f]), 'the bot calms the Heart, past all ten Wardens');
    ok(Object.keys(S.hollow.pages).length === 10 && Object.keys(S.hollow.relics).length >= 10, 'ten pages and ten relics');
    ok(['ghost', 'stonegolem', 'mimic', 'starmoth', 'cometslime', 'voidbat', 'heartwisp', 'hound', 'elderslime'].every(k => S.hollow.met[k] > 0), 'all nine Part 3 creatures beaten: ' + JSON.stringify(S.hollow.met));
    ok(['puffcap', 'glowworm', 'sporeslime', 'shardcrab', 'sprite', 'geode'].every(k => S.hollow.met[k] > 0), 'all six Part 1 creatures beaten');
    ok(['frog', 'eel', 'snail', 'thornling', 'sapwisp', 'rootworm', 'salamander', 'cindermoth', 'magmaslime', 'hare', 'icewisp', 'golem'].every(k => S.hollow.met[k] > 0), 'all twelve Part 2 creatures beaten: ' + JSON.stringify(S.hollow.met));
    ok(t.liftStops().slice(0, 21).join() === '1,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100', 'lift stops every fifth floor: ' + t.liftStops().join());
    t.openSheet('cave'); const body = document.getElementById('shBody').innerHTML;
    ok(/Glowcap Grotto/.test(body) && /Crystal Caves/.test(body) && /Aunt Bramble's journal/.test(body) && !/undefined|NaN/.test(body), 'lift sheet: bands, creatures and pages');
    t.closeSheet();
    const m = t.migrate(JSON.parse(JSON.stringify(S))); ok(m.hollow.wardens[100] && m.hollow.met.golem > 0, 'deep Hollow progress survives a save round trip');
  }
}
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
console.log(`base mana ${MANA}${FOCUS_ON ? ' + Crystal Focus when affordable' : ''}, ${DRAUGHTS} draughts a dive, energy ${ENERGY}, ${RUNS} runs`);
console.log(`dives from a new Hollow to beating the Crystal Queen (30): average ${avg(stats.to30).toFixed(1)}`);
console.log(`Crystal Focus bought at deepest floor (avg): ${Object.keys(stats.focus).sort().map(k => `${k} ${avg(stats.focus[k]).toFixed(0)} (${stats.focus[k].length}/${RUNS})`).join(', ') || 'none'} · draughts drunk per dive ${avg(stats.drank).toFixed(1)}`);
console.log(`dives from a new Hollow to beating the Rime Owl (70): average ${avg(stats.to70).toFixed(1)}`);
console.log(`dives from a new Hollow to calming the Heart (100): average ${avg(stats.dives).toFixed(1)}, range ${Math.min(...stats.dives)} to ${Math.max(...stats.dives)}`);
console.log(`faints: ${(stats.faints / RUNS).toFixed(1)} per run · Warden tries per run: ${WF.map(f => `${f}: ${(stats.tries[f] / RUNS).toFixed(1)}`).join(', ')}`);
console.log('floors cleared per dive, first time down / later dives from the band\'s top stop · value of a later dive (coins + drops at sell price, no one-off rewards):');
t.BANDS.map((B, i) => `${B.name} (${i * 10 + 1}-${i * 10 + 10})`).concat(['Endless Below (101+)']).forEach((nm, i) => console.log(`  ${nm.padEnd(24)} ${avg(stats.reach[i]).toFixed(1)} / ${avg(stats.again[i]).toFixed(1)} floors · ${Math.round(avg(stats.val[i]))} coins`));
console.log(`game time per dive (from 10 am): average ${Math.round(avg(stats.mins))} minutes, longest ${Math.round(Math.max(...stats.mins))} (midnight is 840)`);
console.log(`checks: ${pass} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
