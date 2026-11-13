// Headless checks for the cottage, Part 3 (PLAN-cottage.md): Bramble's attic story, her eight things, the nook, Hew's portrait, sharing.
// Run from tests/ after `python3 extract.py` (needs b.js).
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", `globalThis.__t={get S(){return S},startGame,update,draw,buildStatic,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},enqueue,get queue(){return queue},witch,visit,
  enterHome,leaveHome,homeState,homeFree,homePut,homeOwn,homeCosy,homeNook,homeSnap,homeWhy,homeFloorTile,homeLadder,QUESTS,QIDS,qStep,qState,qBlock,questDo,questMorning,heartsOf,where,canMeet,seekPlace,enterVillage,leaveVillage,
  homeBuy,HOME_ITEMS,ATTIC_IDS,NOOK_COST,endDay,migrate,bgKeyNow,hewTalk,HW,dayKey,VILLAGERS,cosyLevel};\n})();`);
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem:k => store[k] ?? null, setItem:(k, v) => store[k] = String(v), removeItem:k => delete store[k] };
eval(src); const t = __t; t.startGame(true); const S = t.S; const close = () => { while (t.sheet) t.closeSheet(); }; close();
let pass = 0, bad = 0; const ok = (c, m) => { if (c) pass++; else { bad++; console.log('FAIL', m); } };
const body = () => document.getElementById('shBody').innerHTML, clean = h => !/undefined|NaN|\[object/.test(h);

S.year = 2; S.season = 1; S.day = 3; S.time = 600; S.coins = 20000; S.visits = []; S.visitKey = t.dayKey(); S.evToday = null;
ok(t.QUESTS.attic && t.QUESTS.attic.homeq && t.QIDS.includes('attic'), 'the attic story exists');
// not until she's been inside and Hettie is at 3 hearts
S.fr.hettie = 300; { const L = []; t.questMorning(L); ok(!S.quests.attic, 'waits until she has been inside'); }
S.homeSeen = true; S.fr.hettie = 100; { const L = []; t.questMorning(L); ok(!S.quests.attic, 'waits for Hettie at 3 hearts'); }
S.fr.hettie = 300;
// a piece standing where the ladder goes is put away when the story opens
t.homeState().own.stool = 1; t.homeState().at.push({ id:'stool', c:8, r:1, f:0 });
{ const L = []; t.questMorning(L); ok(S.quests.attic && L.some(l => /attic/.test(l.t)), 'opens with a morning line'); }
t.homeState(); ok(!S.home.at.some(a => a.c === 8 && a.r === 1), 'the ladder tile is cleared'); ok(t.homeLadder(8, 1) && !t.homeFloorTile(8, 1) && t.homeWhy('stool', 8, 2) !== '', 'ladder and its foot stay clear');
// walk the story through real schedules: for each step, find a time when the person is about, go there, do it
const H = t.homeState(), Q = t.QUESTS.attic;
S.inv = { violet:10, morel:10, mint:10, calming:3 };
function doStep() {
  const step = t.qStep('attic'); if (!step) return false;
  if (step.at === 'attic') { t.enterHome(); close(); const why = t.qBlock('attic'); ok(!why, 'attic step ready: ' + why); t.questDo('attic'); close(); return true; }
  const vs = [].concat(step.v);
  for (let d = S.day; d < S.day + 7; d++) for (let tm = 540; tm < 1200; tm += 30) {
    S.time = tm; const p = t.where(vs[0]); if (!t.VILLAGERS[vs[0]] || p === 'away' || p === 'home') continue;
    if (p === 'garden' || p === 'cottage') { if (S.scene !== 'farm') { if (S.scene === 'home') t.leaveHome(); else if (S.scene === 'village') t.leaveVillage(); } }
    else { if (S.scene === 'home') t.leaveHome(); if (S.scene !== 'village') t.enterVillage(); }
    if (!t.canMeet(vs[0])) continue;
    const why = t.qBlock('attic', vs[0]); if (why) { ok(false, 'blocked: ' + why); return false; }
    const s0 = t.qState('attic').s; t.questDo('attic', vs[0]); ok(t.qState('attic').s === s0 + 1, 'step done with ' + vs[0]); close(); return true;
  }
  ok(false, 'never found ' + vs[0]); return false;
}
let n = 0; while (!S.quests.attic.done && n++ < 15) if (!doStep()) break;
ok(S.quests.attic.done, 'the story finishes');
ok(t.ATTIC_IDS.every(id => t.homeOwn(id) === 1), "all eight of Bramble's things are hers");
ok(H.quilt === 'q_bramble', "Bramble's quilt goes straight on the bed");
// the attic sheet lists the stories
t.enterHome(); close(); t.openSheet('place', { p:'attic' }); ok(/Bramble's things/.test(body()) && (body().match(/atticmem/g) || []).length === 8 && clean(body()), 'attic sheet: eight stories');
// tap the ladder: walks there, opens the attic
close(); t.witch.x = 4; t.witch.y = 11; t.enqueue({ c:8, r:1 }, false); for (let i = 0; i < 200; i++) t.update(.05); ok(t.sheet === 'place', 'tap the ladder → the attic'); close();
// can't be bought
ok(t.ATTIC_IDS.every(id => !t.homeBuy(id)) && !t.homeBuy('hewpic'), "Bramble's things and Hew's portrait can't be bought");
// place them all: the set bonus
const before = t.homeCosy();
const spots = { rocker:[1, 3], kettle:null, starchart:[0, 0], bclock:[2, 0], lectern:[0, 7], bportrait:[6, 0], barmchair:[3, 3] };
for (const [id, sp] of Object.entries(spots)) if (sp) ok(t.homePut(id, sp[0], sp[1]), 'put out ' + id);
ok(t.homePut('kettle', 2, 5), 'kettle on the table');
ok(t.homeCosy() >= before + 8 + 7, 'all of Bramble\'s things out: set bonus');
t.buildStatic(); t.draw(); ok(/L/.test(t.bgKeyNow()), 'key knows the ladder');
// the nook
t.openSheet('decoroom', {}); ok(/Open up a nook/.test(body()) && /Share a picture/.test(body()) && clean(body()), 'room sheet: nook and share'); close();
ok(!t.homeFloorTile(0, 12), 'no floor by the door before the nook');
const c0 = S.coins; ok(t.homeNook() && S.coins === c0 - t.NOOK_COST && H.nook, 'nook built'); ok(!t.homeNook(), 'once');
ok(t.homeFloorTile(0, 12) && t.homeFloorTile(8, 12) && !t.homeFloorTile(4, 12), 'a new row of floor, the door still a door');
ok(t.homePut('lantern', 1, 12) || t.homeFree('lantern') === 0, 'something can stand in the nook');
t.buildStatic(); t.draw(); ok(/N/.test(t.bgKeyNow()), 'key knows the nook');
// sharing doesn't throw headless
let res = null; t.homeSnap(r => res = r); ok(res === 'unavailable' || res === null, 'share falls back quietly headless: ' + res);
// Hew's parcel and his line
S.hew = S.hew || {}; Object.assign(t.HW(), { met:true }); S.home.own.hewpic = 0;
for (let i = 0; i < 20 && !S.home.own.hewpic; i++) { S.time = 1300; t.endDay(false); close(); }
ok(S.home.own.hewpic === 1, "Hew's parcel arrives");
t.enterHome(); close(); ok(t.homePut('hewpic', 7, 0), 'hang it'); t.draw();
t.HW().talked = ''; const l = t.hewTalk(); ok(/portrait/.test(l || ''), 'Hew notices: ' + l); t.HW().talked = ''; ok(!/portrait/.test(t.hewTalk() || ''), 'only once');
// Journal Go button for the attic step works from the village
// saves
const m = t.migrate(JSON.parse(JSON.stringify(S))); ok(m.home.nook && m.quests.attic.done, 'save keeps it');
const html = fs.readFileSync('../src/brambleroot.html', 'utf8'), acts = (html.match(/act === '[a-z0-9]*'/g) || []); ok(acts.length === new Set(acts).size, 'acts unique');
console.log(`home3test: ${pass} passed, ${bad} failed`);
