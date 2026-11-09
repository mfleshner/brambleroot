// Headless checks for the deep Hollow, Part 2: floors 31-70, new traits, four Wardens, relics, the Mana Draught
// pouch, Crystal Focus, letters at 25 and 50, depth chat, and old saves.
// Run from tests/ after `python3 extract.py` (needs b.js).
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", "globalThis.__t={get S(){return S},get HV(){return HV},startGame,update,draw,hollowTap,enterHollow,hollowFloor,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},get ox(){return ox},get oy(){return oy},get T(){return T},witch,MOBS,WARDENS,BANDS,RELICS,UPGRADES,POTIONS,liftStops,mobLit,addMob,hitMob,killMob,migrate,buildStatic,drinkDraught,pouchLeft,manaMaxFor,focusLevel,mailMorning,talkTo,potionKnown,endDay,itemsTxt,HOLLOW_BOTTOM,updateHUD};\n})();");
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem:k => store[k] ?? null, setItem:(k, v) => store[k] = String(v), removeItem:k => delete store[k] };
eval(src); const t = __t; t.startGame(false); const S = t.S; while (t.sheet) t.closeSheet();
let pass = 0, bad = 0; const ok = (c, m) => { if (c) pass++; else { bad++; console.log('FAIL', m); } };
const step = (s, dt = 1 / 30) => { for (let i = 0; i < s / dt; i++) { t.update(dt); if (!t.HV) break; } };
const body = () => document.getElementById('shBody').innerHTML, clean = h => !/undefined|NaN|\[object/.test(h);
const close = () => { while (t.sheet) t.closeSheet(); };
S.spells = ['firebolt', 'frost']; S.manaMax = 60; S.mana = 60; S.energy = 999; S.maxEnergy = 999; S.hollowMax = 70;
const fresh = () => { S.hollow = t.migrate({ v:2 }).hollow; S.hollow.seen = Object.fromEntries(Object.keys(t.MOBS).map(k => [k, true])); };
fresh();
const only = (f, kinds) => { S.scene = 'wood'; t.enterHollow(f); close(); t.HV.mobs = []; t.HV.warden = null; return kinds.map((k, i) => t.addMob(k, 1 + i * 2.5, 2)); };

// 1. data: 7 bands, 21 creatures + 7 Wardens, bottom at 70, every drop and potion exists
ok(t.BANDS.length === 10 && t.HOLLOW_BOTTOM === 100, 'ten bands since Part 3, finale at 100');
const mobs = Object.keys(t.MOBS); ok(mobs.filter(k => !t.MOBS[k].warden).length === 30 && mobs.filter(k => t.MOBS[k].warden).length === 10, 'creature counts (Part 3 totals) ' + mobs.length);
for (const k of mobs) { const M = t.MOBS[k]; ok(!!S && M.drop && t.POTIONS && (globalThis.__t.MOBS[k].hp <= 3 || M.warden), 'hit rule ' + k); }
for (const B of t.BANDS.slice(3)) for (const k in B.mix) ok(!!t.MOBS[k], 'mix has ' + k);
for (const f of [40, 50, 60, 70]) { const W = t.WARDENS[f]; ok(W && t.MOBS[W.k] && W.page && W.beat && W.note, 'warden ' + f); }
for (const k of ['pearlbalm', 'roottonic', 'embercord', 'rimetea', 'manadraught']) ok(t.POTIONS[k] && t.POTIONS[k].wild, 'potion ' + k);
ok(t.POTIONS.manadraught.sell < 2 * 15 + 20, 'draught sells for less than its makings');
ok(t.itemsTxt({ emberglass:3, pearl:2 }) === '3 Ember Glass and 2 River Pearls', 'plural names: ' + t.itemsTxt({ emberglass:3, pearl:2 }));

// 2. every new band builds and every creature draws
for (let bi = 3; bi < 7; bi++) { only(bi * 10 + 3, Object.keys(t.BANDS[bi].mix)); try { t.buildStatic(); t.draw(); ok(true); } catch (e) { ok(false, 'band ' + bi + ': ' + e.message); } }
for (const f of [40, 50, 60, 70]) { fresh(); S.scene = 'wood'; t.enterHollow(f); close(); ok(t.HV.warden && t.HV.warden.k === t.WARDENS[f].k, 'warden on ' + f); step(1); try { t.buildStatic(); t.draw(); ok(true); } catch (e) { ok(false, 'warden draw ' + f + ': ' + e.message); } }

// 3. traits
// shy: runs away and never hurts her
{ const [m] = only(32, ['snail']); m.x = t.witch.x; m.y = t.witch.y - 1.5; const e0 = S.energy; step(2); ok(S.energy === e0, 'shy creature never hurts'); ok(Math.hypot(m.x - t.witch.x, m.y - t.witch.y) > 2, 'shy creature runs away');
  S.inv.pearl = 0; m.hp = 1; t.hitMob(m, 1); ok(S.inv.pearl === 2, 'shy creature drops double: ' + S.inv.pearl); }
// threes: Cinder Moths come as trios on Ember Deep floors
{ let trios = 0, all = 0; for (let i = 0; i < 40; i++) { fresh(); S.scene = 'wood'; t.enterHollow(55); close(); const n = t.HV.mobs.filter(m => m.k === 'cindermoth').length; all++; if (n % 3 === 0) trios++; } ok(trios === all, 'moths always in threes'); }
// leaps and dashes move in bursts
{ const [m] = only(33, ['frog']); m.x = 4; m.y = 6; m.ph = 1; const y0 = m.y; step(.3); const still = Math.abs(m.y - y0) < .05; m.ph = 1.79; step(.25); ok(still && m.y > y0 + .3, 'frog sits, then leaps'); }
{ const [m] = only(53, ['salamander']); m.x = 4; m.y = 2; m.ph = .5; const y0 = m.y; step(.5); const slow = m.y - y0; m.ph = 2.2; const y1 = m.y; step(.4); ok(m.y - y1 > slow * 2, 'salamander dashes'); }
// hides with its own message; dives (Whiskers, Owl) have unlit spells
{ const [m] = only(34, ['eel']); m.ph = 2.5; ok(!t.mobLit(m), 'eel under water'); const before = S.mana; t.hollowTap(t.ox + (m.x + .5) * t.T, t.oy + (m.y + .3) * t.T); ok(S.mana === before, 'no bolt at a hidden eel'); }
{ fresh(); S.scene = 'wood'; t.enterHollow(40); close(); const w = t.HV.warden; w.ph = 5; ok(!t.mobLit(w), 'Whiskers dives'); w.ph = 1; ok(t.mobLit(w), 'Whiskers surfaces'); }
// sprouts: the Briar Knot grows Thornlings (no loot), at most 3
{ fresh(); S.scene = 'wood'; t.enterHollow(50); close(); t.HV.mobs = t.HV.mobs.filter(m => m === t.HV.warden); S.energy = 999; step(20); const th = t.HV.mobs.filter(m => m.k === 'thornling'); ok(th.length >= 1 && th.length <= 3 && th.every(m => m.small), 'briar sprouts thornlings: ' + th.length); }
// Emberback's shell regrows; golem's ice cracks first
{ fresh(); S.scene = 'wood'; t.enterHollow(60); close(); const w = t.HV.warden; ok(w.shield, 'emberback shelled'); t.hitMob(w, 1); ok(!w.shield && w.hp === t.MOBS.emberback.hp, 'first hit cracks it'); w.rs = .1; step(.3); ok(!t.HV || w.shield, 'shell regrows'); }
{ const [g] = only(64, ['golem']); ok(g.shield, 'golem iced'); t.hitMob(g, 1); ok(!g.shield && g.hp === 3, 'ice first'); }

// 4. Wardens give coins, items, a page and a relic; old saves get relics for beaten Wardens
fresh(); S.scene = 'wood'; t.enterHollow(40); close(); const c0 = S.coins; const w40 = t.HV.warden; w40.hp = 1; w40.ph = 1; t.hitMob(w40, 1);
ok(S.hollow.wardens[40] && S.hollow.pages[40] && S.hollow.relics.bell && S.coins >= c0 + 1200, 'Whiskers rewards');
ok(/Pearl Bell/.test(body()) && clean(body()), 'reward sheet names the relic'); close();
{ const m = t.migrate({ v:2, hollowMax:35, hollow:{ wardens:{ 10:true, 20:true, 30:true }, pages:{ 10:true } } }); ok(m.hollow.relics.lantern && m.hollow.relics.jar && m.hollow.relics.crown && !m.hollow.relics.bell, 'old save relics: ' + JSON.stringify(m.hollow.relics)); }
{ const m = t.migrate({ v:2, hollowMax:12 }); ok(m.hollow.relics.lantern && m.hollow.wardens[10], 'pre-deep save: Mossback + lantern'); }
// rare relics only in their band, once
{ let found = 0; fresh(); for (let i = 0; i < 4000 && !found; i++) { const [m] = only(42, ['thornling']); m.hp = 1; t.hitMob(m, 1); close(); if (S.hollow.relics.trowel) found = i + 1; } ok(found > 0, 'rare relic turns up in The Roots after ' + found + ' kills'); ok(!S.hollow.relics.bottle, 'no relic from another band'); }

// 5. pouch
fresh(); S.manaMax = 60; S.inv.manadraught = 5; S.scene = 'wood'; t.enterHollow(31); close(); S.mana = 10;
ok(t.pouchLeft() === 3, 'pouch shows 3 of 5'); t.updateHUD(); ok(!document.getElementById('bPouch').hidden && document.getElementById('bBoard').hidden, 'pouch replaces board in the Hollow');
ok(t.drinkDraught() && S.mana === 25 && S.inv.manadraught === 4, 'a draught gives 15 mana');
S.mana = 55; ok(t.drinkDraught() && S.mana === 60, 'tops up to max'); S.mana = 0; ok(t.drinkDraught(), 'third'); S.mana = 0; ok(!t.drinkDraught() && S.inv.manadraught === 2, 'only 3 a dive');
S.scene = 'wood'; t.enterHollow(31); close(); S.mana = 0; ok(t.drinkDraught(), 'new dive, fresh pouch');
S.scene = 'wood'; t.updateHUD(); ok(document.getElementById('bPouch').hidden || !t.HV, 'pouch hidden outside');

// 6. Crystal Focus
S.up = {}; const m0 = t.manaMaxFor(); S.coins = 50000; Object.assign(S.inv, { crystal:20, prism:10, pearl:10, heartwood:10, emberglass:10, rime:10 }); S.scene = 'farm';
t.openSheet('market'); t.renderSheet('market');
for (const k of ['focus1', 'focus2', 'focus3', 'focus4']) { S.coins -= t.UPGRADES[k].cost; S.up[k] = true; for (const [i, n] of Object.entries(t.UPGRADES[k].items)) S.inv[i] -= n; }
ok(t.focusLevel() === 4 && t.manaMaxFor() === m0 + 40, `focus +40: ${m0} -> ${t.manaMaxFor()}`); close();

// 7. letters and chat
S.sent = {}; S.mail = []; S.hollowMax = 26; t.mailMorning([]); ok(S.mail.some(m => m.from === 'juno' && /twenty-five/i.test(m.title)), 'juno letter at 25');
S.hollowMax = 52; t.mailMorning([]); ok(S.mail.some(m => m.from === 'bertram'), 'bertram letter at 50'); const n0 = S.mail.length; t.mailMorning([]); ok(S.mail.length === n0, 'letters once');
let deepLines = 0; for (let i = 0; i < 60; i++) { S.talked = {}; S.hollowMax = 45; t.talkTo('juno'); if (/Floor 45/.test(body())) deepLines++; close(); } ok(deepLines > 5, 'juno talks about the depth: ' + deepLines);

// 8. sheets: lift grid to 70, relic shelf
S.hollowMax = 70; fresh(); S.hollow.relics = { lantern:true, bell:true, trowel:true }; t.openSheet('cave'); let h = body();
ok(['Underriver', 'The Roots', 'Ember Deep', 'Frozen Reach'].every(x => h.includes(x)) && /Floor 70/.test(h) && clean(h), 'lift sheet shows all bands to 70'); close();
ok(t.liftStops().join() === '1,5,10,15,20,25,30,35,40,45,50,55,60,65,70', 'lift stops to 70');
S.scene = 'farm'; t.openSheet('sleep'); ok(/The relic shelf \(3\)/.test(body()), 'relic shelf button'); close();
t.openSheet('relics'); h = body(); ok(/Pearl Bell/.test(h) && /An empty spot/.test(h) && /3 of 20/.test(h) && clean(h), 'relic shelf'); close();
S.hollowMax = 5; S.hollow.relics = { lantern:true }; t.openSheet('relics'); h = body(); ok(!/Underriver/.test(h) && /Mossy Hollow/.test(h), 'shelf hides bands not reached'); close();
// bottom
S.hollowMax = 70; fresh(); S.hollow.wardens[70] = true; S.scene = 'wood'; t.enterHollow(70); close(); for (const m of t.HV.mobs.slice()) t.killMob(m); ok(!!t.HV.stairs, 'floor 70 leads on since Part 3');
// save round trip
const back = t.migrate(JSON.parse(JSON.stringify(S))); ok(back.hollow.relics && back.up && back.inv.manadraught >= 0, 'save round trip');
console.log(`hollow2test: ${pass} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
