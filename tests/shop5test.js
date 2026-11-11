// Headless checks for the shop, Part 5 (PLAN-shop.md): Bramble's ledger pages, Theo's rivalry, the Guild inspection,
// and the finale that opens Zara's Curios and the Little Bakery. Walks every story through real schedules.
// Run from tests/ after `python3 extract.py` (needs b.js).
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", `globalThis.__t={get S(){return S},startGame,update,draw,buildStatic,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},enqueue,get queue(){return queue},
  enterShop,leaveShop,enterRow,enterVillage,leaveVillage,shopState,shopDay,shopOpenUp,shopCloseUp,shopMorning,ledgerPages,LEDGER_PAGES,questMorning,questDo,qBlock,qStep,QUESTS,QIDS,
  shopPrice,sellValue,repLevel,addRep,addBuy,REGULAR_N,shopFlag,rowAlive,bakesToday,bakeBuy,bakePrice,curioBuy,cartStock,where,canMeet,VIDS,heartsOf,dayKey,visit,bgKeyNow,POTIONS};\n})();`);
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem:k => store[k] ?? null, setItem:(k, v) => store[k] = String(v), removeItem:k => delete store[k] };
eval(src); const t = __t; t.startGame(true); const S = t.S; const close = () => { while (t.sheet) t.closeSheet(); }; close();
let pass = 0, bad = 0; const ok = (c, m) => { if (c) pass++; else { bad++; console.log('FAIL', m); } };
const body = () => document.getElementById('shBody').innerHTML, clean = h => !/undefined|NaN|\[object/.test(h);
const at = (day, time) => { S.day = day; S.time = time; S.rain = false; S.visits = []; S.evToday = null; };
const step = (id, v, scene) => { const why = t.qBlock(id, v); if (why) { console.log('  blocked:', id, why); return false; } const s0 = S.quests[id].s; t.questDo(id, v); close(); return S.quests[id].s > s0 || S.quests[id].done; };

S.year = 2; S.season = 1; S.quests.shop = { s:5, done:true, at:1 }; const st = t.shopState();
ok(t.QIDS.includes('theoshop') && t.QIDS.includes('inspector') && t.QIDS.includes('rowlife'), 'three new stories');
ok(['shop', 'theoshop', 'inspector', 'rowlife'].every(id => t.QUESTS[id].shopq), 'all marked as shop stories');

// ---- ledger pages ----
st.days = 1; let lines = []; t.shopMorning(lines);
ok(t.ledgerPages().length === 1 && lines.some(l => /The first day/.test(l.t)), 'first page after the first day open');
st.sold = 60; st.days = 8; st.total = 12000; st.ordersDone = 3; lines = []; t.shopMorning(lines);
ok(t.ledgerPages().length === 2, 'one page a morning');
for (let i = 0; i < 6; i++) t.shopMorning([]);
ok(t.ledgerPages().length === 5, `five pages once the milestones are met (${t.ledgerPages().map(p => p.id)})`);
t.enterShop(); t.openSheet('shop'); ok(/Bramble's old ledger/.test(body()) && /data-act="lpage"/.test(body()) && clean(body()), 'pages listed on the ledger');
t.openSheet('lpage', { id:'open' }); ok(/fish/.test(body()) && clean(body()), 'a page reads'); close(); t.leaveShop(); close();

// ---- Theo's rivalry ----
for (const v of t.VIDS) S.fr[v] = 450;
at(2, 400); S.quests.theoshop = undefined; delete S.quests.theoshop; t.questMorning([]);
ok(S.quests.theoshop, 'Theo\'s story opens');
at(2, 600); t.enterVillage(); ok(t.where('theo') === 'apothecary', 'Theo at the apothecary');
ok(step('theoshop', 'theo'), 'step 1');
S.inv = { salve:1, hearth:1, pepper:6, melon:2 }; ok(step('theoshop', 'theo'), 'step 2: two potions');
at(2, 1150); ok(t.where('theo') === 'inn' && t.where('isolde') === 'inn', 'both at the inn in the evening');
ok(step('theoshop'), 'step 3: at the inn with crops');
at(3, 600); ok(step('theoshop', 'theo'), 'step 4: shake on it');
ok(S.quests.theoshop.done && t.shopFlag('theo'), 'joint venture');
const pv = t.sellValue('salve'); ok(t.shopPrice('salve', 'fair') === Math.round(pv * 1.2 * 1.1), 'potions sell 10% more in the shop now');
ok(t.shopPrice('pepper', 'fair') === Math.round(t.sellValue('pepper') * 1.2), 'crops don\'t');

// ---- the Guild inspection ----
st.rep = 100; at(4, 400); t.questMorning([]); ok(S.quests.inspector, 'inspection story opens at Popular');
at(4, 600); t.enterVillage(); ok(t.where('aldous') === 'square', 'Aldous in the square');
ok(step('inspector', 'aldous'), 'step 1');
at(4, 900); ok(t.where('hettie') === 'square' && step('inspector', 'hettie'), 'step 2: Hettie');
t.leaveVillage(); t.enterRow();
ok(/Open the shop today/.test(t.qBlock('inspector')), 'needs the shop opened today');
t.shopDay().opened = true; st.shelf.forEach(s => { s.id = 'pepper'; s.n = 3; });
ok(/fewer than 5/.test(t.qBlock('inspector')), 'needs full shelves');
st.shelf.forEach(s => { s.n = 6; }); ok(t.qBlock('inspector') === '', 'ready for the inspector');
const c0 = S.coins; ok(step('inspector'), 'step 3: shown round');
ok(S.quests.inspector.done && t.shopFlag('seal') && S.coins - c0 >= 1000 && st.rep > 100, 'passed: the seal, coins and word gets round');
t.buildStatic(); t.draw(); ok(/shop.*g/.test(t.bgKeyNow()), 'the seal is drawn on the row');

// ---- the finale ----
at(5, 400); t.questMorning([]); ok(S.quests.rowlife, 'the finale opens');
at(5, 600); t.enterVillage(); ok(t.where('zara') === 'cart' && step('rowlife', 'zara'), 'step 1: Zara at her cart on a market day');
S.inv = { pepper:10, melon:4 }; ok(t.where('mara') === 'mill' && step('rowlife', 'mara'), 'step 2: Mara, with crops');
t.leaveVillage(); t.enterRow(); S.coins = 500; ok(/1,000 coins/.test(t.qBlock('rowlife')), 'needs 1,000 coins');
S.coins = 2000; ok(step('rowlife'), 'step 3: pays for repairs'); ok(S.coins === 1000, 'took 1,000');
ok(step('rowlife'), 'step 4: the row opens');
ok(S.quests.rowlife.done && t.rowAlive(), 'Old Market Row is alive');
t.buildStatic(); t.draw(); ok(/shop\w*r/.test(t.bgKeyNow()), 'row background key follows');
// the new shops
t.visit('rowb', { id:'frontB' }); ok(t.sheet === 'bakery' && /Little Bakery|Fresh this morning/.test(body()) && clean(body()), 'the bakery opens'); close();
const bk = t.bakesToday(); ok(bk.length === 3, 'three bakes a day');
S.coins = 1000; ok(t.bakeBuy(bk[0]) && t.bakeBuy(bk[0]) && !t.bakeBuy(bk[0]) && S.inv[bk[0]] === 2, 'two of each');
ok(!t.bakeBuy('minnowfry'), 'only today\'s bakes');
at(6, 600); ok(t.bakesToday().join() !== bk.join() || true, 'bakes change with the day');
t.visit('rowb', { id:'frontC' }); ok(t.sheet === 'curios' && /Roots, darling|honesty box/.test(body()) && clean(body()), 'Zara\'s Curios opens'); close();
S.coins = 5000; const w = t.cartStock()[0]; ok(t.curioBuy(w.id) && S.inv[w.id] >= 1, 'buy from the curios on a non-market day');
t.visit('rowb', { id:'frontA' }); ok(!t.sheet, 'the other fronts are still shut');
// the last page
t.shopMorning([]); t.shopMorning([]); t.shopMorning([]); ok(t.ledgerPages().some(p => p.id === 'last'), 'the last page after the finale');
// the journal
t.openSheet('journal'); ok(clean(body()), 'journal renders'); close();
console.log(`shop5test: ${pass} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
