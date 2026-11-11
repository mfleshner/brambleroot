// Headless checks for the shop (PLAN-shop.md Part 1): the shop story, Old Market Row, the shop inside, shelves and prices,
// customers by the real clock, serving, closing, the day summary, sheets, saves and old saves.
// Run from tests/ after `python3 extract.py` (needs b.js).
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", `globalThis.__t={get S(){return S},set S(v){S=v},startGame,update,draw,buildStatic,visit,enqueue,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},get queue(){return queue},set queue(v){queue=v},witch,
  questMorning,questDo,qBlock,qStep,QUESTS,enterVillage,leaveVillage,enterRow,enterShop,leaveShop,shopState,shopDay,shelfPut,shelfBack,shelfRestock,shopOpenUp,shopCloseUp,shopServe,shopTick,get SV(){return SV},
  rowOpen,shopReady,shopPrice,sellValue,PRICE_TIERS,SHELVES,SHOP_ME,SLOT_MAX,migrate,where,canMeet,VILLAGERS,VIDS,ITEMS,CROPS,FORAGE,dayKey,endDay,heartsOf,seekPlace,set jt(v){journalTab=v},mailMorning};\n})();`);
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem:k => store[k] ?? null, setItem:(k, v) => store[k] = String(v), removeItem:k => delete store[k] };
let toasts = [];
eval(src); const t = __t; t.startGame(true); let S = t.S; const close = () => { while (t.sheet) t.closeSheet(); }; close();
let pass = 0, bad = 0; const ok = (c, m) => { if (c) pass++; else { bad++; console.log('FAIL', m); } };
const body = () => document.getElementById('shBody').innerHTML, clean = h => !/undefined|NaN|\[object/.test(h);
const run = (secs, step = .05) => { for (let i = 0; i < secs / step; i++) t.update(step); };
const walk = () => { for (let i = 0; i < 400 && (t.queue.length || t.witch.walk); i++) t.update(.05); };

// ---- the story opens in summer of year 1, not before ----
S.quests = {}; const lines = []; t.questMorning(lines);
ok(!S.quests.shop && !t.rowOpen(), 'no shop story in spring of year 1');
S.season = 1; S.day = 2; t.questMorning(lines);
ok(S.quests.shop && S.quests.shop.s === 0 && t.rowOpen() && !t.shopReady(), 'shop story opens in summer');
ok(lines.some(l => /The shop on Old Market Row/.test(l.t)), 'morning line announces it');

// step 1: Odile, in the village, at the school
S.day = 2; S.time = 600; S.rain = false; S.visits = []; S.visitKey = t.dayKey(); S.evToday = null;
t.enterVillage(); ok(t.where('odile') === 'school' && t.canMeet('odile'), 'Odile at school mid-morning');
t.questDo('shop', 'odile'); close();
ok(S.quests.shop.s === 1 && t.qStep('shop').at === 'shopfront', 'step 2: go to the shop');
ok(/Head to/.test(t.qBlock('shop')), 'step 2 needs the row, not the village');

// the arch on the village map takes her to the row
t.queue = []; t.enqueue({ c:8, r:8 }, false); ok(t.queue.length && t.queue[0].b === 'torow', 'tapping the arch heads for the row');
walk(); ok(S.scene === 'row', 'walked through the arch onto Old Market Row');
t.buildStatic(); t.draw(); ok(true, 'row draws');
ok(t.qBlock('shop') === '', 'step 2 is doable on the row');
// tapping the boarded shop opens its place sheet with the story card
t.enqueue({ c:4, r:1 }, false); walk();
ok(t.sheet === 'place' && /Unlock the door/.test(body()) && clean(body()) && !/Nobody/.test(body()), 'boarded shop shows the story card');
t.questDo('shop'); close();
ok(S.quests.shop.s === 2 && t.qStep('shop').pay === 500, 'step 3: pay Rowan');

// back to the village: the signpost at the bottom of the row
t.enqueue({ c:4, r:12 }, false); walk(); ok(S.scene === 'village' && Math.round(t.witch.x) === 8 && Math.round(t.witch.y) === 8, 'back in the village by the arch');

// step 3: Rowan wants 500 coins
S.time = 600; S.visits = []; ok(t.where('rowan') === 'smithy', 'Rowan at the smithy');
S.coins = 300; ok(/500 coins/.test(t.qBlock('shop', 'rowan')), 'not enough coins blocks the step');
S.coins = 900; t.questDo('shop', 'rowan'); close();
ok(S.coins === 400 && S.quests.shop.s === 3, 'paid 500 coins');

// step 4: Mara wants 8 crops
S.time = 600; ok(t.where('mara') === 'mill', 'Mara at the mill');
ok(/need 8/.test(t.qBlock('shop', 'mara')), 'needs 8 crops');
S.inv.mint = 5; S.inv.pepper = 4; t.questDo('shop', 'mara'); close();
ok(S.quests.shop.s === 4 && S.inv.mint === 0 && S.inv.pepper === 1, 'took the 8 cheapest crops');

// step 5: back at the shop with 4 Wood finds; the Journal's Go button walks there from the farm
t.leaveVillage(); S.inv.fern = 2; S.inv.violet = 3;
t.jt = 'stories'; t.openSheet('journal'); ok(/data-act="goplace" data-id="shopfront"/.test(body()) && clean(body()), 'Journal offers Go to the shop');
close(); t.seekPlace('shopfront'); walk(); walk(); walk(); walk();
ok(S.scene === 'row' && t.sheet === 'place', `walked from the farm to the shop (${S.scene}, ${t.sheet})`);
const fr0 = S.fr.odile; t.questDo('shop'); close();
ok(S.quests.shop.done && t.shopReady() && S.fr.odile > fr0, 'shop restored, Odile fonder');
ok((S.inv.fern || 0) + (S.inv.violet || 0) === 1, 'took 4 finds');

// ---- inside the shop ----
t.enqueue({ c:4, r:1 }, false); walk(); ok(S.scene === 'shop', 'tapping the shop now goes inside');
t.buildStatic(); t.draw(); ok(true, 'shop draws');
const st = t.shopState(); ok(st.shelf.length === 6 && st.shelf.every(s => !s.id), 'six empty shelves');
// stocking
S.inv = { moon:14, ember:6, honey:3, bouquet:1, glow:2, cordial:2 };
ok(t.shelfPut(0, 'moon') === 10 && S.inv.moon === 4 && st.shelf[0].n === 10, 'put out 10 of 14');
ok(t.shelfPut(0, 'moon') === 0, 'a full shelf takes no more');
ok(t.shelfPut(1, 'bouquet') === 0 && !st.shelf[1].id, 'romance items stay off the shelves');
t.shelfPut(1, 'ember'); t.shelfPut(2, 'honey'); t.shelfPut(3, 'glow'); t.shelfPut(4, 'cordial');
ok(S.inv.ember === 0 && st.shelf[1].n === 6, 'all 6 ember out');
S.inv.ember = 3; ok(t.shelfRestock() === 3 && st.shelf[1].n === 9, 'restock tops shelves up');
ok(t.shelfBack(4) === 2 && S.inv.cordial === 2 && !st.shelf[4].id, 'take back returns to basket');
// prices
const v = t.sellValue('moon'), P = t.PRICE_TIERS; ok(t.shopPrice('moon', 'kind') === Math.round(v * P.kind.mult) && t.shopPrice('moon', 'fair') === Math.round(v * P.fair.mult) && t.shopPrice('moon', 'dear') === Math.round(v * P.dear.mult) && P.kind.mult > 1 && P.fair.mult > P.kind.mult && P.dear.mult > P.fair.mult, 'price tiers');
// sheets
t.openSheet('shelf', { i:0 }); ok(/Take back/.test(body()) && /Kind · /.test(body()) && clean(body()), 'shelf sheet (stocked)'); close();
t.openSheet('shelf', { i:5 }); ok(/Put out/.test(body()) && !/Moonpetal Bouquet/.test(body()) && clean(body()), 'shelf sheet (empty) lists the basket'); close();

// routing: from the door to the ledger goes round the end of the counter
t.witch.x = 4; t.witch.y = 11; t.queue = []; t.enqueue({ c:4, r:2 }, false);
ok(t.queue.length === 3 && t.queue[0].c === 7 && t.queue[0].r === 3 && t.queue[1].r === 1 && t.queue[2].b === 'ledger', 'walks round the counter');
walk(); ok(t.sheet === 'shop' && /Open up/.test(body()) && clean(body()), 'ledger opens the shop sheet');
close();

// opening hours
S.time = 500; ok(!t.shopOpenUp(), 'can\'t open before 9 am');
S.time = 540; ok(t.shopOpenUp() && t.SV.open, 'opens at 9 am');
// a shop day by the real clock; a bot serves anyone waiting
const coins0 = S.coins, fr1 = Object.assign({}, S.fr); let served = 0, maxWait = 0, sim = 0;
while (t.SV && t.SV.open && sim < 4000) {
  t.update(.1); sim++;
  const w = t.SV ? t.SV.custs.filter(c => c.st === 'wait') : [];
  maxWait = Math.max(maxWait, w.length);
  if (w.length && sim % 15 === 0) { if (t.shopServe(w[0])) served++; }
  if (t.sheet === 'shopday') break;
}
ok(S.time >= 1080, `the day ran to closing (${Math.round(S.time)})`);
const d = t.shopDay();
console.log('  shop day:', d.people, 'customers,', d.sold, 'sold,', d.coins, 'coins,', served, 'served by tapping');
ok(d.people >= 7 && d.people <= 16, `a sensible number of customers (${d.people})`);
ok(served >= 5 && S.coins > coins0 && d.coins === S.coins - coins0, `coins from serving (${served} served, ${d.coins} coins)`);
ok(maxWait <= 5, 'never more than five waiting');
ok(t.sheet === 'shopday' && /Closed up|count the till/.test(body()) && clean(body()), 'closing shows the day summary');
ok(t.VIDS.some(x => S.fr[x] > fr1[x]), 'villagers got fonder');
ok(st.days === 1 && st.total === d.coins && st.best === d.coins, 'lifetime totals');
ok(Object.values(st.came).every(k => k === t.dayKey()), 'each villager came in at most once today');
close();

// serving: love → tip and notebook; asks from the basket
t.shopOpenUp(); S.time = 600; t.shopOpenUp();
const wren = t.VILLAGERS.wren; const loved = wren.loves.find(x => t.ITEMS[x] && t.ITEMS[x].sell > 0);
S.inv[loved] = 3; S.known.wren = {};
const cu = { v:'wren', st:'wait', id:loved, n:1, price:t.shopPrice(loved, 'fair'), tier:'fair', x:4, y:3, q:0, path:[], ask:true };
t.SV.custs.push(cu); const c1 = S.coins, f1 = S.fr.wren;
ok(t.shopServe(cu) && S.coins - c1 === cu.price + Math.round(cu.price * .15) && S.inv[loved] === 2, 'loved thing from the basket, with a 15% tip');
ok(S.fr.wren - f1 >= 20 && S.known.wren[loved] === 'love', 'fonder, and the notebook learns it');
const cu2 = { v:null, st:'wait', id:'moon', n:2, price:t.shopPrice('moon', 'dear'), tier:'dear', x:3, y:3, q:1, path:[] };
t.SV.custs.push(cu2); const c2 = S.coins; t.shopServe(cu2); ok(S.coins - c2 === cu2.price * 2, 'a traveller pays the shelf price, no tip');

// dear prices sell less: compare picks
const pickRate = p => { let took = 0; for (let i = 0; i < 400; i++) { st.shelf[5] = { id:'ember', n:10, p }; const c = { v:null, slot:5, id:'ember', st:'browse', path:[], x:7, y:10 }; t.SV.custs = [c]; t.shopTick(0); c.wait = 0; t.shopTick(.01); if (c.n) took++; } return took / 400; };
const rf = pickRate('fair'), rd = pickRate('dear');
ok(rf > .95 && rd > .45 && rd < .75, `dear puts some back (fair ${rf.toFixed(2)}, dear ${rd.toFixed(2)})`);
t.SV.custs = [];

// leaving with customers waiting serves them on the way out
st.shelf[0] = { id:'moon', n:5, p:'fair' };
t.SV.custs.push({ v:null, st:'wait', id:'moon', n:1, price:50, tier:'fair', x:4, y:3, q:0, path:[] });
const c3 = S.coins; t.leaveShop();
ok(S.scene === 'row' && !t.SV && S.coins === c3 + 50, 'leaving closes up and serves the queue');
ok(t.sheet === 'shopday', 'and shows the summary'); close();

// bedtime with the shop open: closed up quietly, and the morning says so
t.enterShop(); S.time = 700; t.shopOpenUp(); t.SV.custs.push({ v:null, st:'wait', id:'moon', n:1, price:60, tier:'fair', x:4, y:3, q:0, path:[] });
t.endDay(false); close();
ok(!t.SV && S.scene === 'farm', 'end of day leaves the shop');

// the gate goes straight to the row once the shop is restored
t.openSheet('gate'); ok(/data-act="gorow"/.test(body()) && clean(body()), 'gate offers Old Market Row'); close();

// save and reload
const saved = JSON.parse(JSON.stringify(S));
const m = t.migrate(saved); ok(m.shop && m.shop.shelf.length === 6 && m.quests.shop.done, 'shop survives a save');
// an old save with no shop field at all
const old = JSON.parse(JSON.stringify(S)); delete old.shop; delete old.rowSeen; delete old.shopSeen; old.quests = {};
const m2 = t.migrate(old); ok(m2 && m2.shop === null && !m2.quests.shop, 'old save loads with no shop');
t.S = m2; S = m2; t.enterShop(); ok(t.shopState().shelf.length === 6, 'shopState fills in an old save');
t.openSheet('shop'); ok(clean(body()), 'shop sheet on an old save'); close();
t.openSheet('journal'); ok(clean(body()), 'journal on an old save'); close();

console.log(`shoptest: ${pass} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
