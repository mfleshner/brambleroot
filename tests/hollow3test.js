// Headless checks for the deep Hollow, Part 3: floors 71-100, nine creatures, three Wardens (the Heart is calmed),
// the finale, wardrobe treasures, letters at 75 and 100, the Endless Below (101+), and old saves.
// Run from tests/ after `python3 extract.py` (needs b.js).
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", "globalThis.__t={get S(){return S},get HV(){return HV},startGame,update,draw,hollowTap,enterHollow,hollowFloor,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},get ox(){return ox},get oy(){return oy},get T(){return T},witch,MOBS,WARDENS,BANDS,RELICS,POTIONS,ITEMS,liftStops,mobLit,addMob,hitMob,killMob,migrate,buildStatic,mailMorning,talkTo,itemsTxt,HOLLOW_BOTTOM,BEAT_R,ENDLESS_ORDER,bandIdx,bandName,wardenAt,touchDmg,coinFind,TREASURES,treasuresOwned,wearing,witchSVG,set jt(v){journalTab=v},VILLAGERS,effHp};\n})();");
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem:k => store[k] ?? null, setItem:(k, v) => store[k] = String(v), removeItem:k => delete store[k] };
eval(src); const t = __t; t.startGame(false); const S = t.S; while (t.sheet) t.closeSheet();
let pass = 0, bad = 0; const ok = (c, m) => { if (c) pass++; else { bad++; console.log('FAIL', m); } };
const step = (s, dt = 1 / 30) => { for (let i = 0; i < s / dt; i++) { t.update(dt); if (!t.HV) break; } };
const body = () => document.getElementById('shBody').innerHTML, clean = h => !/undefined|NaN|\[object/.test(h);
const close = () => { while (t.sheet) t.closeSheet(); };
S.spells = ['firebolt', 'frost']; S.manaMax = 60; S.mana = 60; S.energy = 999; S.maxEnergy = 999; S.hollowMax = 100;
const fresh = () => { S.hollow = t.migrate({ v:2 }).hollow; S.hollow.seen = Object.fromEntries(Object.keys(t.MOBS).map(k => [k, true])); };
fresh();
const only = (f, kinds) => { S.scene = 'wood'; t.enterHollow(f); close(); t.HV.mobs = []; t.HV.warden = null; return kinds.map((k, i) => t.addMob(k, 1 + i * 2.5, 2)); };
const drawOk = label => { try { t.buildStatic(); t.draw(); ok(true); } catch (e) { ok(false, label + ': ' + e.message); } };

// 1. data
ok(t.BANDS.length === 10 && t.HOLLOW_BOTTOM === 100, 'ten bands, finale at 100');
const mobs = Object.keys(t.MOBS), plain = mobs.filter(k => !t.MOBS[k].warden);
ok(plain.length === 30 && mobs.length === 40, 'thirty creatures and ten Wardens: ' + mobs.length);
for (const k of plain) ok(t.MOBS[k].hp <= 3 && t.MOBS[k].tip && t.ITEMS[t.MOBS[k].drop], 'creature rule ' + k);
for (const B of t.BANDS.slice(7)) for (const k in B.mix) ok(t.MOBS[k] && !t.MOBS[k].warden, 'mix has ' + k);
ok(Object.keys(t.BANDS[9].mix).length >= 20, 'the Heart band mixes every band in');
for (const f of [80, 90, 100]) { const W = t.WARDENS[f]; ok(W && t.MOBS[W.k] && t.MOBS[W.k].warden && W.page && W.beat && W.note, 'warden ' + f); }
for (const k of ['gildtonic', 'dustel', 'heartcord']) ok(t.POTIONS[k] && t.POTIONS[k].wild && t.POTIONS[k].sell > 2 * t.ITEMS[Object.keys(t.POTIONS[k].need)[0]].sell, 'potion ' + k);
ok(Object.keys(t.RELICS).length === 20, '20 relics');
for (const bi of [7, 8, 9]) { const ks = Object.keys(t.RELICS).filter(k => t.RELICS[k].band === bi); ok(ks.length === 2 && ks.some(k => t.RELICS[k].warden), 'two relics in band ' + bi); }
ok(t.itemsTxt({ stardust:3, oldcoin:2, heartstone:2 }) === '3 Stardust and 2 Old Guild Coins and 2 Heartstones', 'plurals: ' + t.itemsTxt({ stardust:3, oldcoin:2, heartstone:2 }));
ok(['aldous', 'odile', 'fen'].every(v => t.VILLAGERS[v].likes.length && !t.VILLAGERS[v].hates.some(h => ['oldcoin', 'stardust', 'heartstone'].includes(h))), 'villagers like the new drops');

// 2. drawing: every new band, every creature, asleep and awake, every Warden, Endless floors
for (let bi = 7; bi < 10; bi++) { only(bi * 10 + 3, Object.keys(t.BANDS[bi].mix).slice(0, 8)); step(.5); drawOk('band ' + bi); }
{ const ms = only(73, ['mimic', 'ghost', 'stonegolem']); ok(ms[0].asleep, 'mimic dozes'); drawOk('asleep mimic'); ms[0].asleep = false; ms[1].ph = 0; drawOk('awake mimic'); ms[1].ph = 2.5; drawOk('dark ghost'); }
for (const f of [80, 90, 100]) { fresh(); S.scene = 'wood'; t.enterHollow(f); close(); ok(t.HV.warden && t.HV.warden.k === t.WARDENS[f].k, 'warden on ' + f); step(1.5); drawOk('warden ' + f); }
for (const f of [101, 115, 137, 160]) { fresh(); S.scene = 'wood'; t.enterHollow(f); close(); step(.5); drawOk('endless ' + f); }

// 3. traits
// mimic: dozes, wakes when she's close, spills coins
{ const [m] = only(74, ['mimic']); m.x = t.witch.x; m.y = t.witch.y - 2; step(.1); ok(!m.asleep, 'mimic wakes when close'); const c0 = S.coins; m.hp = 1; t.hitMob(m, 1); ok(S.coins > c0, 'mimic spills coins'); }
// stone golem: cracks first, says so
{ const [g] = only(75, ['stonegolem']); ok(g.shield && t.effHp(g) === 4, 'stone golem has a crust'); t.hitMob(g, 1); ok(!g.shield && g.hp === 3, 'stone first'); }
// lantern ghost hides
{ const [g] = only(76, ['ghost']); g.ph = 2.5; ok(!t.mobLit(g), 'ghost in the dark'); const m0 = S.mana; t.hollowTap(t.ox + (g.x + .5) * t.T, t.oy + (g.y + .3) * t.T); ok(S.mana === m0, 'no bolt at a dark ghost'); }
// star moths come in threes
{ let good = 0; for (let i = 0; i < 30; i++) { fresh(); S.scene = 'wood'; t.enterHollow(86); close(); if (t.HV.mobs.filter(m => m.k === 'starmoth').length % 3 === 0) good++; } ok(good === 30, 'star moths in threes'); }
// Moon Moth calls Star Moths (no loot), at most 3
{ fresh(); S.scene = 'wood'; t.enterHollow(90); close(); t.HV.mobs = t.HV.mobs.filter(m => m === t.HV.warden); t.witch.x = 4; t.witch.y = 11; step(20); const sm = t.HV.mobs.filter(m => m.k === 'starmoth'); ok(sm.length >= 1 && sm.length <= 3 && sm.every(m => m.small), 'moon moth swarms: ' + sm.length); }
// The Heart never moves; its beat hurts only close by
{ fresh(); S.scene = 'wood'; t.enterHollow(100); close(); const w = t.HV.warden; t.HV.mobs = [w]; const x0 = w.x, y0 = w.y;
  t.witch.x = 4; t.witch.y = 11; const e0 = S.energy; step(12); ok(w.x === x0 && w.y === y0, 'the Heart stays put'); ok(S.energy === e0, 'its beat does not reach the ladder');
  t.hitMob(w, 1); ok(w.x === x0 && w.y === y0, 'no knockback for the Heart');
  t.witch.x = w.x; t.witch.y = w.y + 2; w.st = 'glow'; w.stt = .05; const e1 = S.energy; step(.2); ok(S.energy < e1 && t.HV.rings.some(r => r.R === t.BEAT_R), 'its beat pushes out close by'); }

// 4. Wardens 80 and 90, then the finale at 100
fresh(); S.coins = 0; S.scene = 'wood'; t.enterHollow(80); close(); let w = t.HV.warden; w.hp = 1; w.st = 'walk'; t.hitMob(w, 1);
ok(S.hollow.wardens[80] && S.hollow.pages[80] && S.hollow.relics.key && S.coins >= 2000, 'Steward rewards'); ok(/Guild Brooch/.test(body()) && /Brass Key/.test(body()) && clean(body()), 'reward sheet names the relic and the brooch'); close();
S.scene = 'wood'; t.enterHollow(90); close(); w = t.HV.warden; w.hp = 1; t.hitMob(w, 1); ok(S.hollow.wardens[90] && S.hollow.relics.scale && /Star Cloak/.test(body()), 'Moon Moth rewards'); close();
S.scene = 'wood'; t.enterHollow(100); close(); w = t.HV.warden; const c100 = S.coins; w.hp = 1; t.hitMob(w, 1);
ok(t.sheet === 'finale' && S.hollow.wardens[100] && S.hollow.pages[100] && S.hollow.relics.heartseed && S.coins >= c100 + 5000, 'the Heart is calmed: finale');
let h = body(); ok(/last page/i.test(h) && /With all my love/.test(h) && /Heartbloom/.test(h) && /Heartseed/.test(h) && (h.match(/class="scene"/g) || []).length >= 3 && clean(h), 'finale sheet: scene, rewards, last page');
ok(t.HV.bloom > 0, 'the roots flower'); close(); step(1); drawOk('bloom');
for (const m of t.HV.mobs.slice()) t.killMob(m); ok(!!t.HV.stairs, 'stairs below the Heart');
const deep0 = S.hollowMax; S.hollowMax = 100; t.hollowFloor(101); ok(t.sheet === 'gift' && /Endless Below/.test(body()), 'Endless Below intro at 101'); close();
S.scene = 'wood'; t.enterHollow(100); close(); ok(!t.HV.warden && t.HV.bloom === 1, 'floor 100 stays in flower');

// 5. the Endless Below
ok(t.bandIdx(101) === t.ENDLESS_ORDER[0] && t.bandIdx(110) === t.ENDLESS_ORDER[0] && t.bandIdx(111) === t.ENDLESS_ORDER[1], 'ten floors a band');
{ const seen = new Set(); for (let f = 101; f <= 300; f++) seen.add(t.bandIdx(f)); ok(seen.size === 9 && !seen.has(9), 'every band but the Heart\'s comes back'); }
ok(!t.wardenAt(105) && t.wardenAt(110).rematch && t.wardenAt(110).k === t.WARDENS[(t.bandIdx(110) + 1) * 10].k, 'rematch Warden every tenth floor');
ok(t.touchDmg(150) === 30 && t.touchDmg(150) >= t.touchDmg(100) && t.coinFind(200) === t.coinFind(150), 'a little tougher, then level');
ok(/^Endless Below · /.test(t.bandName(120)), 'band name: ' + t.bandName(120));
{ let lo = 99, hi = 0; for (let i = 0; i < 60; i++) { fresh(); S.scene = 'wood'; t.enterHollow(101 + (i % 9)); close(); const n = new Set(t.HV.mobs.map(m => m)).size; lo = Math.min(lo, n); hi = Math.max(hi, n); } ok(lo >= 3 && hi <= 21, `creatures per Endless floor ${lo}-${hi}`); }
fresh(); S.coins = 0; S.scene = 'wood'; t.enterHollow(120); close(); w = t.HV.warden; ok(w && t.HV.mobs.includes(w), 'rematch on 120'); w.hp = 1; w.shield = false; t.hitMob(w, 1);
ok(S.hollow.wardens[120] && !S.hollow.pages[120] && S.coins >= 800 && /remembers you/.test(body()), 'rematch rewards, no page'); close();
S.scene = 'wood'; t.enterHollow(120); close(); ok(!t.HV.warden, 'rematch beaten for good');

// 6. lift, journal pages, almanac
fresh(); S.hollow.wardens[100] = true; S.hollow.pages[100] = true; S.hollowMax = 123;
ok(t.liftStops().join() === '1,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100,105,110,115,120,123', 'lift stops past 100: ' + t.liftStops().join());
t.openSheet('cave'); h = body(); ok(['Guild Ruins', 'Starfall', 'Heart of the Bramble', 'The Endless Below', 'record: floor 123', 'The last page', 'calmed the Heart'].every(x => h.includes(x)) && clean(h), 'lift sheet: new bands, Endless group, last page'); close();
t.openSheet('hpage', { f:100 }); h = body(); ok((h.match(/class="scene"/g) || []).length === 3, 'the last page has paragraphs'); close();
t.jt = 'almanac'; t.openSheet('journal'); h = body(); ok(/Deepest floor of the Hollow: 123 \(the Endless Below\)/.test(h) && /Heart is calm/.test(h), 'almanac shows the record'); close(); t.jt = 'charters';
S.hollow.relics = { key:true, heartseed:true }; t.openSheet('relics'); h = body(); ok(/2 of 20/.test(h) && /Guild Ruins/.test(h) && /Heartseed/.test(h) && clean(h), 'relic shelf'); close();

// 7. wardrobe treasures
fresh(); S.hollow.wardens = { 10:true, 20:true, 30:true, 40:true, 50:true, 60:true, 70:true }; ok(t.treasuresOwned().join() === 'circlet,plume', 'Part 2 save owns circlet and plume');
S.look = { wear:['circlet', 'cloak'] }; ok(t.wearing('circlet') && !t.wearing('cloak'), 'can only wear what she owns');
S.hollow.wardens[80] = S.hollow.wardens[90] = S.hollow.wardens[100] = true; S.look.wear = Object.keys(t.TREASURES);
const svg = t.witchSVG(110); ok(/#1c2350/.test(svg) && /#9ff0ff/.test(svg) && /#e8f6ff/.test(svg) && /#e8c66a/.test(svg) && /#ff9ab8/.test(svg), 'mirror draws all five');
S.scene = 'farm'; drawOk('witch wearing everything');
t.openSheet('wardrobe'); h = body(); ok(Object.values(t.TREASURES).every(x => h.includes(x.name)) && /data-act="wear"/.test(h) && clean(h), 'mirror lists treasures'); close();
S.hollow.wardens = { 10:true }; t.openSheet('wardrobe'); ok(!/Treasures from the Hollow/.test(body()), 'no treasure row before any'); close();

// 8. letters and chat
S.sent = {}; S.mail = []; S.hollowMax = 76; S.hollow.wardens = {}; const cl = S.coins; t.mailMorning([]); ok(S.mail.some(m => m.from === 'aldous' && m.gift && m.gift.n === 500), 'Aldous writes at 75');
ok(!S.mail.some(m => m.from === 'hettie' && /flowering/.test(m.title)), 'no Hettie letter before the Heart');
S.hollowMax = 100; S.hollow.wardens[100] = true; t.mailMorning([]); ok(S.mail.some(m => m.from === 'hettie' && /flowering/.test(m.title)), 'Hettie writes after the Heart');
const n0 = S.mail.length; t.mailMorning([]); ok(S.mail.length === n0, 'letters once');
let lines = 0; for (let i = 0; i < 60; i++) { S.talked = {}; S.hollowMax = 85; t.talkTo('juno'); if (/Stars, underground/.test(body())) lines++; close(); } ok(lines > 5, 'Juno on Starfall: ' + lines);
lines = 0; for (let i = 0; i < 80; i++) { S.talked = {}; t.talkTo('aldous'); if (/Keeper of the Heart/.test(body())) lines++; close(); } ok(lines > 3, 'Aldous after the Heart: ' + lines);

// 9. old saves
{ const m = t.migrate({ v:2, hollowMax:70, hollow:{ wardens:{ 10:true, 20:true, 30:true, 40:true, 50:true, 60:true, 70:true }, pages:{ 70:true } } });
  ok(m.hollowMax === 70 && Object.keys(m.hollow.relics).length === 7 && !m.hollow.wardens[80], 'Part 2 save loads as it was'); }
fresh(); S.hollowMax = 70; S.hollow.wardens[70] = true; S.scene = 'wood'; t.enterHollow(70); close(); for (const m of t.HV.mobs.slice()) t.killMob(m); ok(!!t.HV.stairs, 'floor 70 now leads on');
S.hollowMax = 70; t.hollowFloor(71); ok(t.sheet === 'gift' && /Guild Ruins/.test(body()), 'Guild Ruins intro at 71'); close();
const back = t.migrate(JSON.parse(JSON.stringify(Object.assign({}, S, { look:{ wear:['bloom'] } })))); ok(back.look.wear[0] === 'bloom' && back.hollowMax === 71, 'save round trip');
console.log(`hollow3test: ${pass} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
