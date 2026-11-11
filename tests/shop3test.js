// Headless checks for the shop, Part 3 (PLAN-shop.md): upgrades, reputation, regulars and decor.
// Run from tests/ after `python3 extract.py` (needs b.js).
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", `globalThis.__t={get S(){return S},startGame,update,draw,buildStatic,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},enqueue,get queue(){return queue},
  enterShop,leaveShop,enterRow,shopState,shopDay,shopOpenUp,shopCloseUp,shopServe,get SV(){return SV},shopSlots,shopBuyUp,shopUp,SHOP_UPS,slotPrice,shopPrice,CASE_BONUS,SHELVES,
  repLevel,addRep,REP_LEVELS,shopGapMul,isRegular,addBuy,REGULAR_N,SHOP_TALK,helperSales,bgKeyNow,VIDS,VILLAGERS,migrate,sellValue,vRow,shelfPut};\n})();`);
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem:k => store[k] ?? null, setItem:(k, v) => store[k] = String(v), removeItem:k => delete store[k] };
eval(src); const t = __t; t.startGame(true); const S = t.S; const close = () => { while (t.sheet) t.closeSheet(); }; close();
let pass = 0, bad = 0; const ok = (c, m) => { if (c) pass++; else { bad++; console.log('FAIL', m); } };
const body = () => document.getElementById('shBody').innerHTML, clean = h => !/undefined|NaN|\[object/.test(h);

S.season = 1; S.day = 3; S.time = 600; S.quests.shop = { s:5, done:true, at:1 }; S.visits = [];
t.enterShop(); const st = t.shopState();
ok(t.shopSlots() === 6 && st.shelf.length === 6, 'six shelves to start');
t.openSheet('shop'); ok(/Improvements/.test(body()) && /Word about the shop/.test(body()) && /data-act="shopup" data-id="glass"[^>]*disabled/.test(body()) && clean(body()), 'ledger shows improvements and reputation'); close();

// upgrades
S.coins = 1000; ok(!t.shopBuyUp('tables'), 'not enough coins');
S.coins = 10000; ok(!t.shopBuyUp('glass'), 'glass case needs the tables first');
ok(t.shopBuyUp('tables') && S.coins === 8500 && t.shopSlots() === 8 && st.shelf.length === 8, 'tables: 8 places');
ok(!t.shopBuyUp('tables'), 'only once');
ok(t.shopBuyUp('glass') && t.shopSlots() === 10 && st.shelf.length === 10, 'glass case: 10 places');
ok(t.shopBuyUp('window') && t.shopBuyUp('sign'), 'window and sign');
// tapping the new places
t.witch = null; S.inv = { pepper:30, melon:10, salve:4 };
for (const [c, r, i] of [[1, 11, 6], [7, 11, 7], [3, 5, 8], [4, 5, 8], [5, 5, 9]]) { t.enqueue({ c, r }, false); const q = t.queue[t.queue.length - 1]; ok(q && q.b === 'shelf' && q.i === i, `tap (${c},${r}) goes to place ${i + 1}`); t.queue.length = 0; }
// the glass case sells for more
t.shelfPut(8, 'salve'); ok(t.slotPrice(8, 'salve', 'fair') === Math.round(t.shopPrice('salve', 'fair') * t.CASE_BONUS), 'the case adds 15%');
t.openSheet('shelf', { i:8 }); ok(/glass case/i.test(body()) && clean(body()), 'case shelf sheet'); close();
// drawing with everything bought
S.ribbons = { ringtoss:[1], dance:[1, 2] }; S.prizes = { maypole:true, scarecrow:true };
t.buildStatic(); t.draw(); ok(/10ws/.test(t.bgKeyNow()), 'shop background key follows upgrades');
t.enterRow(); t.buildStatic(); t.draw(); ok(/shopws/.test(t.bgKeyNow()), 'row background key follows window and sign'); t.enterShop();

// reputation
st.rep = 0; ok(t.repLevel() === 0 && Math.abs(t.shopGapMul() - .85) < 1e-9, 'window alone: 15% more often');
t.addRep(20); ok(st.rep === 30 && t.repLevel() === 1, 'the sign makes word spread 1.5×');
st.rep = 400; ok(t.repLevel() === 4 && t.shopGapMul() < .67, 'famous: customers much more often');
// regulars
ok(t.VIDS.every(v => t.SHOP_TALK[v] && t.SHOP_TALK[v].length === 3), 'every villager has three regular lines');
S.shop.buys = {}; for (let i = 0; i < t.REGULAR_N - 1; i++) t.addBuy('wren');
ok(!t.isRegular('wren') && t.addBuy('wren') && t.isRegular('wren'), `a regular after ${t.REGULAR_N} buys`);
ok(/Regular at your shop/.test(t.vRow('wren', 'list')), 'regular chip on the village list');
t.openSheet('shop'); ok(/Your regulars/.test(body()), 'ledger lists regulars'); close();
// live serving adds reputation and counts buys
S.time = 600; ok(t.shopOpenUp(), 'open');
st.rep = 0; const cu = { v:'mara', st:'wait', id:'pepper', n:1, price:80, tier:'fair', x:4, y:3, q:0, path:[] }; t.SV.custs.push(cu);
t.shopServe(cu); ok(st.rep > 0 && S.shop.buys.mara === 1, 'serving adds reputation and a buy');
const tr = { v:null, st:'wait', id:'pepper', n:1, price:100, tier:'fair', x:3, y:3, q:1, path:[] }; t.SV.custs.push(tr);
st.rep = 250; const c0 = S.coins; t.shopServe(tr); ok(S.coins - c0 === 110, 'beloved shop: well-off travellers tip 10%');
t.shopCloseUp(true);
// helpers add reputation too
st.rep = 0; st.shelf[0] = { id:'pepper', n:10, p:'fair' }; t.helperSales('pip', 540, 1080); ok(st.rep > 0, 'helper sales add reputation');

// old save with no upgrades
const old = JSON.parse(JSON.stringify(S)); old.shop = { shelf:[{ id:'mint', n:3, p:'fair' }], day:null, came:{} };
const m = t.migrate(old); ok(m && m.shop.shelf.length === 1, 'old shop loads');
console.log(`shop3test: ${pass} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
