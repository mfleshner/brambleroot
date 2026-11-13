// Headless checks for the cottage, Part 1 (PLAN-cottage.md): inside the cottage, decorating, the makers' catalogues.
// Run from tests/ after `python3 extract.py` (needs b.js).
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", `globalThis.__t={get S(){return S},startGame,update,draw,buildStatic,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},enqueue,get queue(){return queue},witch,cat,visit,
  enterHome,leaveHome,goHome,homeState,homeFree,homePut,homeMove,homeAway,homeWhy,homeSpot,homeBuy,homeSet,homeAt,homePath,homeGrid,homeSpouse,homeCatSpot,decoToggle,get DECO(){return DECO},HOME_ITEMS,HIDS,bgKeyNow,migrate,endDay,where,canMeet,updateHUD,homeThumb,decoShopRow};\n})();`);
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem:k => store[k] ?? null, setItem:(k, v) => store[k] = String(v), removeItem:k => delete store[k] };
eval(src); const t = __t; t.startGame(true); const S = t.S; const close = () => { while (t.sheet) t.closeSheet(); }; close();
let pass = 0, bad = 0; const ok = (c, m) => { if (c) pass++; else { bad++; console.log('FAIL', m); } };
const body = () => document.getElementById('shBody').innerHTML, clean = h => !/undefined|NaN|\[object/.test(h);
const run = (sec) => { for (let i = 0; i < sec * 20; i++) t.update(.05); };
const click = (act, ds) => { const b = { dataset:Object.assign({ act }, ds || {}), disabled:false, closest:() => b }; document.getElementById('shBody'); return b; };

// an old save has no S.home: it fills itself in with the starter things
ok(!S.home, 'new save: nothing until first use');
const H = t.homeState();
ok(H.at.length === 5 && H.paper === 'p_plum' && H.floor === 'f_oak' && H.bed === 'b_plain', 'starter room');
ok(t.homeFree('chair') === 0 && t.homeFree('btable') === 0, 'starter pieces are all out');
// every item has what it needs, and every piece draws
for (const id of t.HIDS) { const it = t.HOME_ITEMS[id]; ok(it.name && it.kind && it.from && it.desc && it.col && typeof it.cost === 'number', 'fields ' + id); if (['piece', 'rug'].includes(it.kind)) ok(it.w && it.h, 'size ' + id); }

// going in from the Sleep sheet
S.time = 600; t.openSheet('sleep'); ok(/data-act="gohome"/.test(body()), 'sleep sheet offers Go inside'); close();
t.witch.x = 5; t.witch.y = 7; t.goHome(); ok(t.queue.length && t.queue[0].b === 'tohome', 'from across the farm she walks to the cottage first');
run(6); ok(S.scene === 'home', 'walks in'); close();
t.updateHUD(); ok(!document.getElementById('bDeco').hidden && document.getElementById('bBoard').hidden, 'Decorate replaces Board inside');
t.buildStatic(); t.draw(); ok(/^home\|/.test(t.bgKeyNow()) && /Hp_plum/.test(t.bgKeyNow()), 'draws, with a home key');
t.openSheet('sleep'); ok(!/data-act="gohome"/.test(body()), 'no Go inside when already in'); close();
// walking round furniture: the path never goes through a piece
{ const g = t.homeGrid(), p = t.homePath([4, 11], [2, 4], g); ok(p && p.every(([c, r]) => g.piece[c + ',' + r] === undefined), 'path avoids furniture'); }
t.witch.x = 4; t.witch.y = 11; t.enqueue({ c:7, r:2 }, false); ok(t.queue.length && t.queue[t.queue.length - 1].b === 'homebed', 'tap the bed: walk to it'); run(8); ok(t.sheet === 'sleep', 'bed opens the Sleep sheet'); close();
t.enqueue({ c:4, r:0 }, false); run(6); ok(t.witch.x === 4 && t.witch.y === 2, 'tap the fire: stands at the hearth');

// decorating
t.decoToggle(); ok(t.DECO && /Done/.test(document.getElementById('decoLbl').textContent), 'decorate mode on');
t.enqueue({ c:6, r:7 }, false); ok(t.sheet === 'deco' && /Put something here/.test(body()) && /Nothing in storage/.test(body()) && clean(body()), 'empty tile: deco sheet, nothing stored'); close();
S.coins = 20000;
ok(t.homeBuy('bench') && t.homeBuy('rtable') && t.homeBuy('oillamp') && t.homeBuy('wclock') && t.homeBuy('ragrug') && t.homeBuy('p_stars') && t.homeBuy('b_brass'), 'buying');
ok(!t.homeBuy('p_stars'), 'wallpaper is bought once'); ok(!t.homeBuy('btable'), "Bramble's table isn't for sale");
ok(S.coins === 20000 - 380 - 320 - 180 - 450 - 280 - 900 - 1500, 'coins taken');
t.openSheet('deco', { c:6, r:7 }); ok(/Settle bench/.test(body()) && /Rag rug/.test(body()) && !/Wall clock/.test(body()) && clean(body()), 'floor tile lists floor things only'); close();
t.openSheet('deco', { c:0, r:0 }); ok(/Wall clock/.test(body()) && !/Settle bench/.test(body()), 'wall slot lists wall things'); close();
// tapping the right edge of a 2-wide piece still places it (shifted left)
ok(t.homePut('bench', 8, 7) && H.at.some(a => a.id === 'bench' && a.c === 7 && a.r === 7), 'bench shifted to fit');
ok(t.homeWhy('rtable', 8, 7) !== '', "can't overlap");
ok(t.homeWhy('rtable', 4, 11) !== '' && t.homeWhy('rtable', 5, 2) !== '', 'stand tiles and the way in stay clear');
ok(t.homeWhy('rtable', 6, 1) !== '' && t.homeWhy('rtable', 3, 1) !== '', 'not on the bed or the hearth');
ok(t.homeWhy('oillamp', 6, 8) !== '', 'a lamp needs a table');
ok(t.homePut('rtable', 6, 8) && t.homePut('oillamp', 6, 8), 'lamp on a little table');
ok(t.homePut('wclock', 0, 0), 'clock on the wall'); ok(t.homeWhy('sampler', 0, 0) !== '', 'one thing per wall slot');
ok(t.homePut('ragrug', 6, 9), 'rug down'); ok(t.homeWhy('ragrug', 6, 9) !== '' || t.homeFree('ragrug') === 0, 'rug placed');
// moving the table takes the lamp with it
{ const i = H.at.findIndex(a => a.id === 'rtable'); ok(t.homeMove(i, 2, 9), 'move the table'); const l = H.at.find(a => a.id === 'oillamp'); ok(l.c === 2 && l.r === 9, 'the lamp came too'); }
// putting the table away puts the lamp away too
{ const i = H.at.findIndex(a => a.id === 'rtable'); const g = t.homeAway(i); ok(g.length === 2 && t.homeFree('rtable') === 1 && t.homeFree('oillamp') === 1, 'away with what was on it'); }
// a wall of furniture across the room is refused if it would cut off the bed
{ S.coins = 99999; for (let i = 0; i < 5; i++) t.homeBuy('ltable');
  for (const c of [0, 2, 5, 7]) t.homePut('ltable', c, 3); t.homeBuy('stool');
  ok(/block the way/.test(t.homeWhy('stool', 4, 3)), 'a stool closing the last gap is refused'); const g = t.homeGrid(); ok(t.homePath([4, 11], [5, 2], g), 'the bed is always reachable');
  for (let i = H.at.length - 1; i >= 0; i--) if (H.at[i] && H.at[i].id === 'ltable') t.homeAway(i); }
// decorate taps: lift and drop
{ const i = H.at.findIndex(a => a.id === 'bench'); t.openSheet('deco', { c:7, r:7 }); ok(/data-act="decomove"/.test(body()) && /Put away/.test(body()), 'piece card has Move and Put away'); close();
  t.renderSheet('deco', { c:7, r:7 }); }
// via the act handler, like a real tap
const act = (a, ds) => { const b = document.createElement('button'); b.dataset = Object.assign({ act:a }, ds || {}); b.disabled = false; b.closest = () => b; return b; };
{ const i = H.at.findIndex(a => a.id === 'bench'); t.openSheet('deco', { c:7, r:7 });
  // simulate the click handler
}
// the room sheet
ok(t.homeSet('p_stars') && H.paper === 'p_stars' && t.homeSet('b_brass') && H.bed === 'b_brass', 'room: wallpaper and bed'); ok(!t.homeSet('f_herring'), "can't use what she doesn't own");
t.openSheet('decoroom', {}); ok(/In use/.test(body()) && /Midnight stars/.test(body()) && /Herringbone/.test(body()) && clean(body()), 'room sheet'); close();
t.buildStatic(); t.draw(); ok(/p_stars/.test(t.bgKeyNow()) && /b_brass/.test(t.bgKeyNow()), 'key follows the room');
t.decoToggle(); ok(!t.DECO, 'done');
// the makers' sheets, from the mill and the smithy
ok(/decoshop/.test(t.decoShopRow('mill')) && /decoshop/.test(t.decoShopRow('smithy')) && t.decoShopRow('inn') === '', 'catalogue rows on the mill and smithy');
t.openSheet('decoshop', { shop:'mara' }); { const m = body().match(/.{80}(undefined|NaN).{40}/); if (m) console.log(m[0]); } ok(/Kitchen dresser/.test(body()) && /Yours/.test(body()) && clean(body()), "Mara's sheet"); close();
t.openSheet('decoshop', { shop:'rowan' }); ok(/Wood stove/.test(body()) && /Brass bed/.test(body()) && clean(body()), "Rowan's sheet"); close();
ok(t.HIDS.filter(id => t.HOME_ITEMS[id].from === 'mara').length >= 20 && t.HIDS.filter(id => t.HOME_ITEMS[id].from === 'rowan').length >= 9, 'about 30 pieces to buy');
// the cat naps on the rug (no basket), then the basket
ok(t.homeCatSpot(), 'cat has a spot'); t.homeBuy('catbed'); t.homePut('catbed', 1, 9); { const s = t.homeCatSpot(); ok(s[0] === 1 && Math.round(s[1]) === 9, 'cat goes to her basket'); }
run(3); ok(Math.hypot(t.cat.x - 1, t.cat.y - 8.85) < .3, 'cat walked to the basket');
// the spouse at home
S.spouse = 'rowan'; S.time = 1400; ok(t.where('rowan') === 'cottage' || t.where('rowan') === 'garden', 'spouse where');
if (t.where('rowan') === 'cottage') { ok(t.homeSpouse() && t.canMeet('rowan'), 'spouse inside, can chat'); t.draw(); }
// leaving
t.enqueue({ c:4, r:12 }, false); run(8); ok(S.scene === 'farm' && t.witch.x === 1 && t.witch.y === 2, 'out of the door, by the cottage');
S.spouse = null;
// save and load keep the room
const snap = JSON.parse(JSON.stringify(S)); const m = t.migrate(JSON.parse(JSON.stringify(snap)));
ok(m.home && m.home.at.length === S.home.at.length && m.home.paper === 'p_stars', 'room survives a save');
// a broken save entry doesn't crash
S.home.at.push({ id:'nonsense', c:1, r:1 }); t.homeState(); ok(!S.home.at.some(a => a.id === 'nonsense'), 'unknown pieces dropped');
// bedtime from inside wakes her on the farm
t.enterHome(); close(); t.endDay(false); close(); ok(S.scene === 'farm', 'wakes in the garden');
// thumbnails don't throw headless
ok(typeof t.homeThumb('dresser') === 'string', 'thumbs');
// unique acts
const html = fs.readFileSync('../src/brambleroot.html', 'utf8'), acts = (html.match(/act === '[a-z0-9]*'/g) || []); ok(acts.length === new Set(acts).size, 'acts unique');
console.log(`hometest: ${pass} passed, ${bad} failed`);
