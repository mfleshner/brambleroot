// Headless checks for the shop, Part 2 (PLAN-shop.md): helpers mind the shop while she's away.
// Run from tests/ after `python3 extract.py` (needs b.js).
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", `globalThis.__t={get S(){return S},set S(v){S=v},startGame,update,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},
  enterShop,leaveShop,enterVillage,shopState,shopDay,shopOpenUp,shopCloseUp,get SV(){return SV},helperChoices,helperToday,helperOn,helperSettle,helperHoursOn,HELPER_CUT,
  where,canMeet,genVisits,endDay,VIDS,VILLAGERS,dayKey,sellValue,shopPrice,migrate,heartsOf,villageFolk,enqueue,FEST_DAY};\n})();`);
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem:k => store[k] ?? null, setItem:(k, v) => store[k] = String(v), removeItem:k => delete store[k] };
eval(src); const t = __t; t.startGame(true); const S = t.S; const close = () => { while (t.sheet) t.closeSheet(); }; close();
let pass = 0, bad = 0; const ok = (c, m) => { if (c) pass++; else { bad++; console.log('FAIL', m); } };
const body = () => document.getElementById('shBody').innerHTML, clean = h => !/undefined|NaN|\[object/.test(h);
const stock = () => { const st = t.shopState(); ['pepper', 'melon', 'mint', 'star', 'thorn', 'salve'].forEach((id, i) => st.shelf[i] = { id, n:10, p:'fair' }); };

S.season = 1; S.day = 3; S.time = 600; S.rain = false; S.quests.shop = { s:5, done:true, at:1 }; S.visits = []; S.evToday = null;
const st = t.shopState();
ok(t.helperChoices().join() === 'pip', 'Pip is the only helper at first');
ok(!t.helperToday(), 'nobody hired yet');

// hiring Pip from the ledger
t.enterShop(); t.openSheet('shop'); ok(/Minding the shop/.test(body()) && /data-act="shophelp" data-id="pip"/.test(body()) && clean(body()), 'ledger offers Pip');
document.getElementById('shBody').innerHTML; close();
st.helper = 'pip';
ok(t.helperToday() === 'pip', 'Pip hired');
ok(!t.helperOn(600) && t.helperOn(950) === 'pip', 'Pip works after school on a school day');
S.day = 7; ok(t.helperOn(600) === 'pip', 'all day on a rest day');
S.day = t.FEST_DAY; ok(!t.helperToday(), 'not on festival day');
S.day = 3;
ok(t.where('pip', 600) === 'school' && t.where('pip', 950) === 'shopfront', 'where() puts Pip at the shop after school');
S.time = 950; t.enterShop(); ok(t.canMeet('pip'), 'Pip can be chatted to in the shop');
t.enqueue({ c:2, r:1 }, false); ok(t.sheet === 'villager', 'tapping Pip behind the counter opens their page'); close();
t.enterVillage(); ok(!t.villageFolk().some(f => f.v === 'pip'), 'Pip isn\'t in the village while on duty');
for (let i = 0; i < 30; i++) { t.genVisits(); if (S.visits.some(x => x.v === 'pip')) break; } ok(!S.visits.some(x => x.v === 'pip'), 'Pip never visits the garden on a work day');

// taking over settles what Pip sold since 3 pm
stock(); t.shopDay().idleDone = 0; S.time = 1020; t.enterShop();
const c0 = S.coins; ok(t.shopOpenUp(), 'she takes over'); const got = S.coins - c0;
ok(got > 0 && t.shopDay().helped === got, `Pip's takings come to her when she takes over (${got})`);
ok(!t.helperOn(1030), 'Pip steps aside while she serves');
t.shopCloseUp(true); ok(t.shopDay().idleDone >= 1020 && t.helperOn(1040) === 'pip', 'and takes over again when she closes');
t.leaveShop(); close();

// a whole rest day with Pip: takings at bedtime, with Pip's cut
let tot = 0, sold0 = 0, cut = 0, stall = 0, lines = 0, n = 40;
for (let k = 0; k < n; k++) {
  S.day = 7; S.time = 1200; S.shop.day = null; S.shop.came = {}; stock(); S.scene = 'farm';
  const shelf0 = st.shelf.map(s => s.n), cc = S.coins;
  t.endDay(false); close();
  tot += S.coins - cc; st.shelf.forEach((s, i) => { sold0 += shelf0[i] - s.n; stall += (shelf0[i] - s.n) * t.sellValue(s.id); });
  if (S.mail || true) lines++;
}
const perDay = tot / n;
console.log(`  Pip, a whole rest day: ${(sold0 / n).toFixed(1)} things sold, ${Math.round(perDay)} coins after Pip's cut (the market stall pays ${Math.round(stall / n)} for the same: ${Math.round((perDay / (stall / n) - 1) * 100)}% more)`);
ok(sold0 / n >= 6 && sold0 / n <= 16, 'Pip sells a sensible amount on a rest day');
ok(perDay > stall / n && perDay < stall / n * 1.25, 'Pip earns more than the market stall but less than running it herself');

// spouse and best friends
S.spouse = 'rowan'; ok(t.helperChoices().includes('rowan'), 'her spouse can mind the shop');
S.bff = { wren:1 }; S.fr.wren = 1050; ok(t.heartsOf('wren') === 10 && t.helperChoices().includes('wren'), 'a best friend at 10 hearts can');
S.fr.wren = 800; ok(!t.helperChoices().includes('wren'), 'not below 10 hearts');
st.helper = 'rowan'; S.day = 3; ok(t.helperOn(600) === 'rowan', 'a partner minds it all day');
for (let i = 0; i < 30; i++) t.genVisits(); ok(!S.visits.some(x => x.v === 'rowan'), 'a spouse on duty stays at the shop, not the garden');
t.enterShop(); t.openSheet('shop'); ok(/Rowan minds the shop today/.test(body()) && /keeps 3%/.test(body()) && clean(body()), 'ledger shows the spouse helper'); close();
// letting them go
t.leaveShop(); close(); st.helper = null; ok(!t.helperToday() && t.where('rowan', 600) !== 'shopfront', 'nobody minds it once let go');

// saves
const m = t.migrate(JSON.parse(JSON.stringify(Object.assign({}, S, { shop:Object.assign({}, S.shop, { helper:'pip' }) }))));
ok(m.shop.helper === 'pip', 'helper survives a save');

console.log(`shop2test: ${pass} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
