// Headless checks for the deep Hollow, Part 1: traits, Wardens, springs, lift, saves, the floor-15 story step.
// Run from tests/ after `python3 extract.py` (needs b.js).
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", "globalThis.__t={get S(){return S},get HV(){return HV},startGame,update,draw,hollowTap,enterHollow,hollowFloor,closeSheet,openSheet,get sheet(){return sheetOpen},get ox(){return ox},get oy(){return oy},get T(){return T},witch,MOBS,WARDENS,BANDS,liftStops,mobLit,addMob,hitMob,killMob,useSpring,migrate,buildStatic,dayKey,QUESTS,qState};\n})();");
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem:k => store[k] ?? null, setItem:(k, v) => store[k] = String(v), removeItem:k => delete store[k] };
eval(src); const t = __t; t.startGame(false); const S = t.S; while (t.sheet) t.closeSheet();
let pass = 0, bad = 0; const ok = (c, m) => { if (c) pass++; else { bad++; console.log('FAIL', m); } };
const tapMob = m => t.hollowTap(t.ox + (m.x + .5) * t.T, t.oy + (m.y + .5 - .2 * (t.MOBS[m.k].size || 1)) * t.T);
const step = (s, dt = 1 / 30) => { for (let i = 0; i < s / dt; i++) { t.update(dt); if (!t.HV) break; } };
const body = () => document.getElementById('shBody').innerHTML;
S.spells = ['firebolt', 'frost']; S.manaMax = 60; S.mana = 60; S.energy = 999; S.maxEnergy = 999; S.hollowMax = 30;
const fresh = () => { S.hollow = t.migrate({ v:2 }).hollow; S.hollow.seen = Object.fromEntries(Object.keys(t.MOBS).map(k => [k, true])); };
fresh();
const only = (f, kinds) => { S.scene = 'wood'; t.enterHollow(f); while (t.sheet) t.closeSheet(); t.HV.mobs = []; t.HV.warden = null; return kinds.map((k, i) => t.addMob(k, 1 + i * 2.5, 2, { asleep:k === 'puffcap' ? true : undefined })); };

// numbers level off
ok(t.BANDS.length === 10 && t.liftStops().join() === '1,5,10,15,20,25,30', 'ten bands, lift every fifth floor');
// draw every creature on its band's floor without errors
for (const k of Object.keys(t.MOBS)) { const f = { mossback:10, puffball:20, queen:30, whiskers:40, briar:50, emberback:60, owl:70 }[k] || Math.max(0, t.BANDS.findIndex(B => B.mix && B.mix[k])) * 10 + 2; only(f, [k]); try { t.buildStatic(); t.draw(); ok(true); } catch (e) { ok(false, 'draw ' + k + ': ' + e.message); } }

// sleepy: a Puffcap doesn't move until she's close or it's hit
let [pc] = only(12, ['puffcap']); const x0 = pc.x, y0 = pc.y; step(2);
ok(pc.asleep && Math.hypot(pc.x - x0, pc.y - y0) < .3, 'a sleeping Puffcap stays put');
S.mana = 60; tapMob(pc); step(1.5); ok(!t.HV.mobs.includes(pc), 'one Firebolt beats a Puffcap');

// hides: tapping a dark Glowworm spends no mana
let [gw] = only(12, ['glowworm']); gw.ph = 2.5; ok(!t.mobLit(gw), 'glowworm dark at ph 2.5');
S.mana = 60; tapMob(gw); ok(S.mana === 60 && !t.HV.bolts.length, 'tapping a dark Glowworm costs nothing');
gw.ph = .2; tapMob(gw); ok(S.mana === 58, 'tapping a glowing Glowworm throws a bolt');

// splits: a Spore Slime becomes two little Slimes that give no loot
let [ss] = only(12, ['sporeslime']); const inv0 = JSON.stringify(S.inv);
t.hitMob(ss, 1); t.hitMob(ss, 1);
const kids = t.HV.mobs.filter(m => m.k === 'slime'); ok(kids.length === 2 && kids.every(m => m.small), 'Spore Slime splits into two little Slimes');
const c0 = S.coins, cr0 = S.inv.crystal || 0, j0 = S.inv.jelly || 0; for (const m of kids) t.hitMob(m, 1);
ok(S.coins === c0 && (S.inv.crystal || 0) === cr0 && (S.inv.jelly || 0) === j0, 'little Slimes drop nothing');

// shielded: the first bolt cracks the shell
let [sc] = only(25, ['shardcrab']); t.hitMob(sc, 1); ok(!sc.shield && sc.hp === 2, 'first hit cracks the Shard Crab shell');
t.hitMob(sc, 1); t.hitMob(sc, 1); ok(!t.HV.mobs.includes(sc), 'then two more beat it');
// firebolt counts the shell when spreading bolts
[sc] = only(25, ['shardcrab']); S.mana = 60; for (let i = 0; i < 4; i++) tapMob(sc); ok(t.HV.bolts.length === 3, 'no wasted bolts on a shelled crab: ' + t.HV.bolts.length);

// blinks: a Prism Sprite moves, and a bolt still finds it
let [sp] = only(25, ['sprite']); sp.bt = .01; const sx = sp.x, sy = sp.y; step(.1); ok(Math.hypot(sp.x - sx, sp.y - sy) > .01, 'Prism Sprite blinks');
S.mana = 60; tapMob(sp); sp.bt = .05; step(2); ok(!t.HV.mobs.includes(sp), 'a Firebolt follows a blinking sprite');

// geode: always a crystal
let [ge] = only(25, ['geode']); const crg = S.inv.crystal || 0; for (let i = 0; i < 3; i++) t.hitMob(ge, 1); ok((S.inv.crystal || 0) >= crg + 1, 'Geode Beetle drops a crystal');

// Wardens: full health first, half the next try, sore for the rest of the day
fresh(); S.scene = 'wood'; t.enterHollow(10); while (t.sheet) t.closeSheet();
let w = t.HV.warden; ok(w && w.k === 'mossback' && w.hp === 12, 'Old Mossback on floor 10 at full health');
t.hitMob(w, 1); t.hitMob(w, 1); t.hitMob(w, 1); ok(S.hollow.wh[10].hp === 9, 'wounds are remembered');
S.scene = 'wood'; t.enterHollow(10); while (t.sheet) t.closeSheet(); w = t.HV.warden; ok(w.hp === 6, 'second try: half health (6)');
t.hitMob(w, 1); t.hitMob(w, 1); t.hitMob(w, 1); S.scene = 'wood'; t.enterHollow(10); while (t.sheet) t.closeSheet(); ok(t.HV.warden.hp === 3, 'same day: still sore (3)');
S.day = S.day % 28 + 1; S.scene = 'wood'; t.enterHollow(10); while (t.sheet) t.closeSheet(); ok(t.HV.warden.hp === 6, 'next day: tired, half health');
// lunge telegraph: glow, then lunge
w = t.HV.warden; t.HV.mobs = [w]; w.st = 'walk'; w.stt = .01; step(.05); ok(w.st === 'glow', 'Warden glows before lunging');
step(1.05); ok(w.st === 'lunge', 'then lunges');
// beating it
const coins0 = S.coins; while (t.HV.mobs.includes(w)) t.hitMob(w, 1);
ok(S.hollow.wardens[10] && S.hollow.pages[10] && S.coins >= coins0 + 300 && t.sheet === 'gift' && /journal/.test(body()), 'beating Mossback: reward, page and a gift sheet');
t.closeSheet(); ok(t.HV.stairs, 'stairs appear after the Warden');
S.scene = 'wood'; t.enterHollow(10); while (t.sheet) t.closeSheet(); ok(!t.HV.warden && t.HV.mobs.length >= 3, 'floor 10 is an ordinary floor once Mossback is beaten');
// Puffball puffs out Puffcaps, at most 3
S.scene = 'wood'; t.enterHollow(20); while (t.sheet) t.closeSheet(); const pb = t.HV.warden; t.HV.mobs = [pb]; pb.pt = .01; step(.1); step(5.1); step(5.1); step(5.1); step(5.1);
ok(pb.k === 'puffball' && t.HV.mobs.filter(m => m.k === 'puffcap').length === 3, 'the Great Puffball puffs out up to 3 Puffcaps');
// Queen: shell grows back
S.scene = 'wood'; t.enterHollow(30); while (t.sheet) t.closeSheet(); const q = t.HV.warden; t.HV.mobs = [q]; q.st = 'walk'; q.stt = 99; t.hitMob(q, 1); ok(!q.shield, 'Queen shell cracked');
step(8.2); ok(q.shield, 'Queen shell grows back after 8 seconds');

// spring: a quarter of max mana, once a dive
S.scene = 'wood'; S.mana = 10; t.enterHollow(15); while (t.sheet) t.closeSheet();
ok(t.HV.spring, 'spring on floor 15'); t.useSpring(); ok(S.mana === 18 && !t.HV.spring, 'spring gives a quarter of her mana without Crystal Focus (8 of 30)');
t.hollowFloor(15); ok(!t.HV.spring, 'no second sip in the same dive');
S.scene = 'wood'; t.enterHollow(15); while (t.sheet) t.closeSheet(); ok(t.HV.spring, 'a new dive, a fresh spring');
S.scene = 'wood'; t.enterHollow(16); ok(!t.HV.spring, 'no spring on floor 16');

// since Part 3 floor 70 has stairs on to the Guild Ruins
S.hollow.wardens[70] = true; S.scene = 'wood'; t.enterHollow(70); while (t.sheet) t.closeSheet(); for (const m of t.HV.mobs.slice()) t.killMob(m);
ok(!!t.HV.stairs, 'stairs below floor 70 now');

// lift sheet
S.scene = 'wood'; S.hollowMax = 23; t.openSheet('cave');
ok(/Floor 20/.test(body()) && /Floor 23/.test(body()) && !/Floor 25/.test(body()) && /Crystal Caves/.test(body()) && /Glowcap Grotto/.test(body()), 'lift grid by band');
ok(/Creatures you've met/.test(body()) && !/undefined|NaN/.test(body()), 'bestiary on the lift sheet');
t.closeSheet();

// old saves
const old = { v:2, hollowMax:15, spells:['firebolt', 'frost'] }; const m1 = t.migrate(old);
ok(m1.hollow.wardens[10] && m1.hollow.pages[10] && m1.hollow.seen.beetle && !m1.hollow.seen.puffcap, 'a floor-15 save keeps going: Mossback counted as passed');
const m2 = t.migrate({ v:2, hollowMax:7 }); ok(!m2.hollow.wardens[10] && m2.hollow.seen.slime, 'a floor-7 save still meets Mossback');
ok(!t.migrate({ v:2 }).hollow.seen.slime, 'a new save meets everything fresh');

// the Juno story step still points at floor 15
ok(t.QUESTS.deep.steps[1].floor === 15 && /floor 15/.test(t.QUESTS.deep.steps[1].hint), 'Juno\'s story step is floor 15');

console.log(`hollowtest: ${pass} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
