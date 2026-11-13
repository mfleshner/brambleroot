// Headless checks for the cottage, Part 2 (PLAN-cottage.md): Isolde's linens, Zara's pieces, festival pieces, pots,
// display pieces, cosiness and the morning bonus, villagers' lines, tea. Run from tests/ after `python3 extract.py`.
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", `globalThis.__t={get S(){return S},startGame,update,draw,buildStatic,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},enqueue,get queue(){return queue},witch,cat,visit,
  enterHome,leaveHome,homeState,homeFree,homePut,homeBuy,homeSet,homePot,homeOwn,homeCosy,cosyLevel,COSY_LEVELS,COSY_BONUS,homeTalk,HOME_TALK,DECO_LIKES,VIDS,VILLAGERS,teaWhy,teaInvite,teaGuest,teaServe,teaWhere,where,canMeet,meetBox,
  zaraDeco,prizeStock,prizeBuy,festState,HOME_ITEMS,HIDS,bgKeyNow,migrate,endDay,talkTo,heartsOf,addFr,dayKey,decoShopRow,homeDisplays,visitPresent:x=>visitPresent(x)};\n})();`);
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem:k => store[k] ?? null, setItem:(k, v) => store[k] = String(v), removeItem:k => delete store[k] };
eval(src); const t = __t; t.startGame(true); const S = t.S; const close = () => { while (t.sheet) t.closeSheet(); }; close();
let pass = 0, bad = 0; const ok = (c, m) => { if (c) pass++; else { bad++; console.log('FAIL', m); } };
const body = () => document.getElementById('shBody').innerHTML, clean = h => !/undefined|NaN|\[object/.test(h);
const run = sec => { for (let i = 0; i < sec * 20; i++) t.update(.05); };

S.year = 2; S.season = 1; S.day = 5; S.time = 600; S.coins = 50000; S.visits = []; S.visitKey = t.dayKey();
const H = t.homeState();
ok(H.quilt === 'q_none' && H.curtain === 'c_none', 'quilt and curtains default');
// Isolde
ok(/decoshop/.test(t.decoShopRow('inn')), "Isolde's row on the inn");
t.openSheet('decoshop', { shop:'isolde' }); ok(/Fat armchair/.test(body()) && /Quilts/.test(body()) && /Curtains/.test(body()) && clean(body()), "Isolde's sheet"); close();
ok(t.homeBuy('q_stars') && t.homeBuy('c_velvet') && t.homeSet('q_stars') && t.homeSet('c_velvet'), 'quilt and curtains');
ok(!t.homeBuy('q_stars'), 'a quilt is bought once');
t.openSheet('decoroom', {}); ok(/Starry quilt/.test(body()) && /Velvet curtains/.test(body()) && clean(body()), 'room sheet has quilts and curtains'); close();
t.enterHome(); close(); t.buildStatic(); t.draw(); ok(/q_stars/.test(t.bgKeyNow()), 'key has the quilt');
// Zara
const zd = t.zaraDeco(); ok(zd.length === 2 && zd.every(id => t.HOME_ITEMS[id].from === 'zara'), 'two of Zara\'s pieces a week');
S.day = 12; const zd2 = t.zaraDeco(); S.day = 13; ok(JSON.stringify(t.zaraDeco()) === JSON.stringify(zd2), 'same all week');
{ const seen = new Set(); for (let y = 1; y <= 3; y++) for (let s = 0; s < 4; s++) for (const d of [1, 8, 15, 22]) { S.year = y; S.season = s; S.day = d; t.zaraDeco().forEach(i => seen.add(i)); } ok(seen.size === 8, 'every piece comes round'); S.year = 2; S.season = 1; S.day = 5; }
{ const z = t.zaraDeco()[0], c1 = S.coins; ok(t.homeBuy(z) && S.coins === c1 - t.HOME_ITEMS[z].cost, "Zara's pieces can be bought"); }
// festival prizes
S.day = 14; S.tickets = 100; S.time = 700; { const st = t.prizeStock(), p = st.find(x => x.id === 'h:lstring'); ok(p && p.left === 1, 'summer prize stall has the lantern string');
  S.scene = 'village'; ok(t.prizeBuy('h:lstring') && t.homeOwn('lstring') === 1 && S.tickets === 80, 'bought with tickets'); ok(!t.prizeStock().find(x => x.id === 'h:lstring').left, 'once'); S.scene = 'home'; }
S.day = 5; S.time = 600;
ok(!t.homeBuy('lstring') && !t.homeBuy('pot_mint') && !t.homeBuy('relicab'), "festival, pot and gift pieces can't be bought with coins");
// pots
S.inv.glow = 2; const c0 = S.coins; ok(t.homePot('glow') && S.inv.glow === 1 && S.coins === c0 - 40 && t.homeFree('pot_glow') === 1, 'pot a glowcap');
ok(!t.homePot('melon') , 'needs the crop'); ok(t.homePut('pot_glow', 0, 8), 'pot on the floor');
t.openSheet('deco', { c:1, r:9 }); ok(/Pot a plant/.test(body()) && /Potted Glowcap/.test(body()) && clean(body()), 'deco sheet offers pots'); close();
// display pieces arrive once she has something to show
ok(t.homeOwn('relicab') === 0, 'no cabinet without relics');
S.hollow.relics = { moss:true, puff:true }; S.mementos = { mara:true }; S.ribbons = { ringtoss:[1] };
t.homeState(); ok(t.homeOwn('relicab') === 1 && t.homeOwn('kshelf') === 1 && t.homeOwn('ribbonbd') === 1, 'cabinet, shelf and ribbon board given');
ok(t.homePut('relicab', 8, 3) && t.homePut('kshelf', 2, 0) && t.homePut('ribbonbd', 6, 0), 'display pieces placed');
t.buildStatic(); t.draw(); ok(true, 'draws');
// morning note about new gifts
{ S.time = 1300; close(); t.endDay(false); const m = document.getElementById('shBody').innerHTML; ok(/Relic cabinet/.test(m), 'morning line names the new pieces'); close(); t.enterHome(); close(); }
// cosiness
{ const n0 = t.homeCosy(); ok(n0 > 12, 'cosier than the start: ' + n0);
  const saved = JSON.parse(JSON.stringify(S.home)); S.home = null; ok(t.homeCosy() === 12 && t.cosyLevel() === 0, 'no save field: bare, no bonus'); t.homeState(); ok(t.cosyLevel() === 0, 'starter room is bare ' + t.homeCosy());
  S.home = saved; }
// add lots, check the levels climb and the bonus lands in the morning
for (const id of ['armchair', 'bookcase', 'stove', 'dresser', 'ltable', 'chairb', 'chairb', 'candelabra', 'oillamp', 'starrug', 'roserug', 'wclock', 'bunting', 'telescope', 'globe', 'catbed', 'planter', 'p_stars', 'f_herring', 'b_brass']) t.homeBuy(id);
const spots = [['armchair', 3, 3], ['bookcase', 0, 2], ['stove', 2, 2], ['ltable', 5, 7], ['chairb', 5, 8], ['chairb', 6, 8], ['candelabra', 8, 6], ['starrug', 1, 9], ['roserug', 5, 4], ['wclock', 7, 0], ['bunting', 8, 0], ['telescope', 8, 10], ['globe', 7, 10], ['catbed', 0, 11], ['planter', 2, 11], ['dresser', 0, 4]];
for (const [id, c, r] of spots) t.homePut(id, c, r);
t.homePut('oillamp', 5, 7); t.homeSet('p_stars'); t.homeSet('f_herring'); t.homeSet('b_brass');
const nBig = t.homeCosy(), lv = t.cosyLevel(); ok(lv >= 3, `a full room is cosy or better (score ${nBig}, ${t.COSY_LEVELS[lv][0]})`);
{ S.time = 1300; close(); t.endDay(false); ok(S.energy === S.maxEnergy + t.COSY_BONUS[lv], 'morning energy bonus ' + t.COSY_BONUS[lv]); ok(/somewhere/.test(document.getElementById('shBody').innerHTML), 'morning line'); close(); }
{ S.time = 1300; t.endDay(true); close(); ok(S.energy === Math.round(S.maxEnergy * .6) + t.COSY_BONUS[lv], 'passing out still gets the cosy bonus on top'); }
t.openSheet('sleep'); ok(/The cottage feels/.test(body()), 'sleep sheet says how cosy'); close();
// villager lines
ok(t.VIDS.every(v => t.HOME_TALK[v] && t.DECO_LIKES[v]), 'every villager has a cottage line and a style');
{ let hits = 0; for (let i = 0; i < 400; i++) { const l = t.homeTalk('juno'); if (/sea|Shells|maps|deep/.test(l)) hits++; } ok(hits > 100, 'Juno notices the seaside pieces'); }
// tea
S.time = 600; S.day = 6; S.visits = []; S.visitKey = t.dayKey(); S.tea = null;
S.fr.wren = 0; ok(/better/.test(t.teaWhy('wren')), 'needs 2 hearts'); S.fr.wren = 300; S.fr.juno = 300;
t.homeState().at = t.homeState().at.filter(a => !['ltable', 'btable', 'rtable'].includes(t.HOME_ITEMS[a.id].d) && t.HOME_ITEMS[a.id].d !== 'ltable');
ok(/table/.test(t.teaWhy('wren')), 'needs a table'); t.homePut('btable', 2, 5) || t.homePut('ltable', 5, 7);
ok(t.teaWhy('wren') === '', 'can invite: ' + t.teaWhy('wren'));
const q = t.teaInvite('wren'); ok(q && q.from === 960 && q.to === 1080, 'tea at 4 pm');
ok(!t.teaInvite('juno') && /coming for tea/.test(t.teaWhy('juno')), 'one guest a day');
t.enterHome(); close(); S.time = 970; ok(t.where('wren') === 'tea' && t.canMeet('wren'), 'Wren is at the cottage at 4:10');
t.leaveHome(); ok(!t.canMeet('wren') && /Go home/.test(t.meetBox('wren').seek), 'from the garden: go home'); t.enterHome(); close();
const g = t.teaGuest(); ok(g && g.v === 'wren', 'guest is seated'); t.draw();
const fr0 = S.fr.wren; t.enqueue({ c:g.c, r:g.r }, false); ok(t.sheet === 'villager' && /Tea together/.test(body()) && S.fr.wren >= fr0 + 40 && S.tea.done && clean(body()), 'tap the guest: tea'); close();
ok(t.teaGuest() && t.where('wren') === 'tea' && !t.teaServe(), 'stays for the rest of tea, once only'); S.time = 1085; ok(!t.teaGuest(), 'gone at 6'); S.time = 1000;
t.openSheet('villager', { v:'wren' }); ok(/You had tea together today/.test(body()), 'page remembers'); close();
// a missed tea just lapses
S.day = 7; S.visitKey = ''; S.time = 600; S.tea = null; t.teaInvite('juno'); S.time = 1100; ok(t.where('juno') !== 'tea', 'after the hours, gone home');
// late
S.day = 8; S.time = 1210; S.tea = null; ok(/late/.test(t.teaWhy('wren')), 'too late after 8 pm');
S.time = 1000; const q2 = t.teaInvite('wren'); ok(q2 && q2.from === 1080, 'an hour from now, on the half hour');
// garden visit hidden while they're at tea
S.time = 1090; S.scene = 'farm'; ok(!t.visitPresent({ v:'wren', from:600, to:1200 }), 'not in the garden while at tea'); S.scene = 'home';
// save
const m = t.migrate(JSON.parse(JSON.stringify(S))); ok(m.home.quilt === 'q_stars' && m.tea && m.tea.v === 'wren', 'saves keep it');
const html = fs.readFileSync('../src/brambleroot.html', 'utf8'), acts = (html.match(/act === '[a-z0-9]*'/g) || []); ok(acts.length === new Set(acts).size, 'acts unique');
console.log(`home2test: ${pass} passed, ${bad} failed`);
