// A bouquet given to the wrong person (Nov 12, 2026): the "are you sure?" step before giving one (villagers and Hew),
// and the kind goodbye handing the bouquet back within BOUQUET_BACK days (or on saves from before datingAt).
// Run from tests/ after `python3 extract.py` (needs b.js).
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", "globalThis.__t={get S(){return S},startGame,endDay,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},VIDS,VILLAGERS,canRomance,heartsOf,addFr,giveBouquet,kindGoodbye,bouquetBack,BOUQUET_BACK,absDay,romanceBox,HW,hewBye,hewGift,hewHearts,hewStage,inValley};\n})();");
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
let onBody = null; const gid = document.getElementById; document.getElementById = id => { const e = gid(id); if (id === 'shBody' && !e._p) { e._p = 1; e.addEventListener = (k, f) => { if (k === 'click') onBody = f; }; } return e; };
const store = {}; globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = v, removeItem: k => delete store[k] };
eval(src); const t = __t; t.startGame(true); const S = t.S;
const body = () => document.getElementById('shBody').innerHTML;
let pass = 0, bad = 0; const ok = (c, m) => { if (c) pass++; else { bad++; console.log('FAIL', m); } };
const click = (act, id) => { const b = { dataset:{ act, id }, disabled:false }; onBody({ target:{ closest:() => b } }); };
const v = t.VIDS.find(x => t.canRomance(x) && t.inValley(x)) || t.VIDS.find(t.canRomance); const w = t.VIDS.find(x => x !== v && t.canRomance(x));
S.season = 1; S.day = 3; t.addFr(v, 850); t.addFr(w, 850); S.inv.bouquet = 1;
const box = t.romanceBox(v); ok(/data-act="bouqask"/.test(box.acts) && !/data-act="bouquet"/.test(box.acts), 'the villager button asks first');
t.openSheet('vill', { v }); click('bouqask', v); ok(t.sheet === 'bouqask' && body().includes(t.VILLAGERS[v].name) && /data-act="bouquet"/.test(body()), 'the confirm sheet names them');
ok(S.inv.bouquet === 1 && !S.dating, 'asking gives nothing away');
click('vopen', v); ok(S.inv.bouquet === 1 && !S.dating, 'Not now keeps the bouquet');
t.giveBouquet(v); ok(S.dating === v && S.inv.bouquet === 0 && S.datingAt === t.absDay(), 'giving it starts dating and remembers the day');
t.closeSheet(); t.openSheet('goodbye', { v }); t.renderSheet('goodbye', { v }); ok(/hand it back/.test(body()), 'the goodbye sheet says the bouquet comes back');
S.day += 5; t.kindGoodbye(v); ok(!S.dating && S.inv.bouquet === 1 && t.heartsOf(v) === 8, 'kind goodbye within a week: bouquet back, hearts kept');
t.closeSheet(); t.giveBouquet(w); ok(S.dating === w && S.inv.bouquet === 0, 'she can give it to the right person');
S.day += t.BOUQUET_BACK + 2; ok(!t.bouquetBack(), 'after a week it stays given'); t.closeSheet(); t.kindGoodbye(w); ok(!S.dating && S.inv.bouquet === 0, 'a later goodbye keeps no bouquet');
t.closeSheet(); S.inv.bouquet = 1; t.giveBouquet(v); delete S.datingAt; ok(t.bouquetBack(), 'an older save (no datingAt) counts as recent'); t.closeSheet(); t.kindGoodbye(v); ok(S.inv.bouquet === 1, 'old save gets the bouquet back');
// Hew
t.closeSheet(); const H = t.HW(); H.met = true; H.fr = 850; H.broken = 4; S.inv.bouquet = 1;
t.openSheet('hew', {}); click('hewgive'); ok(/data-act="hewbouq"/.test(body()), "Hew's gift list asks before the bouquet");
click('hewbouq', 'bouquet'); ok(/Yes, give it to Hew/.test(body()) && S.inv.bouquet === 1 && !H.dating, 'Hew confirm shows, nothing given yet');
click('hewgift', 'bouquet'); ok(H.dating && S.inv.bouquet === 0 && H.datingAt === t.absDay(), 'Hew dating after yes');
t.closeSheet(); t.openSheet('hew', {}); t.renderSheet('hew', {}); ok(/data-act="hewbyeask"/.test(body()), 'Hew has a Just friends button while dating');
click('hewbyeask'); ok(/hand it back/.test(body()), 'Hew goodbye says the bouquet comes back');
click('hewbye'); ok(!H.dating && S.inv.bouquet === 1 && t.hewHearts() === 8 && t.hewStage() === 'friend', 'Hew: friends again, bouquet back, 8 hearts');
ok(!/data-act="hewbyeask"/.test(body()) && /flowers back/.test(body()), 'his reply shows and the button is gone');
ok(!/undefined|NaN/.test(body()), 'clean text');
console.log(`bouqtest: ${pass} passed, ${bad} failed`);
