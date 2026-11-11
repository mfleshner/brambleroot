// Headless checks for the shop, Part 4 (PLAN-shop.md): special orders, gift baskets and out-of-town buyers.
// Run from tests/ after `python3 extract.py` (needs b.js).
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", `globalThis.__t={get S(){return S},startGame,update,draw,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},enqueue,
  enterShop,leaveShop,shopState,shopDay,shopOpenUp,shopCloseUp,shopServe,shopTick,get SV(){return SV},shopMorning,newOrder,orderDone,orderPool,ORDER_MAX,
  basketAdd,basketBack,basketReady,basketPrice,BASKET_N,buyerToday,buyerDay,buyerWants,buyerSell,BUYERS,BUYER_MAX,BUYER_PAY,helperSales,
  VIDS,VILLAGERS,ITEMS,CROPS,FISH,POTIONS,absDay,endDay,sellValue,shopPrice,dayKey};\n})();`);
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem:k => store[k] ?? null, setItem:(k, v) => store[k] = String(v), removeItem:k => delete store[k] };
eval(src); const t = __t; t.startGame(true); const S = t.S; const close = () => { while (t.sheet) t.closeSheet(); }; close();
let pass = 0, bad = 0; const ok = (c, m) => { if (c) pass++; else { bad++; console.log('FAIL', m); } };
const body = () => document.getElementById('shBody').innerHTML, clean = h => !/undefined|NaN|\[object/.test(h);

S.season = 1; S.day = 2; S.time = 600; S.quests.shop = { s:5, done:true, at:1 }; S.visits = [];
const st = t.shopState(); st.orders = [];

// ---- special orders ----
for (const sn of [0, 1, 2, 3]) { S.season = sn; const p = t.orderPool(); ok(p.crop.length && p.potion.every(id => !t.POTIONS[id].wild), `season ${sn}: makeable things to order`); }
S.season = 1;
let made = 0, okItems = true, okN = true;
for (let i = 0; i < 300; i++) { st.orders = []; const o = t.newOrder(); if (!o) continue; made++; const p = t.orderPool(); if (![].concat(p.crop, p.fish, p.forage, p.potion).includes(o.item)) okItems = false; if (o.n < 1 || o.n > 8 || o.pay <= t.ITEMS[o.item].sell * o.n) okN = false; }
ok(made === 300 && okItems && okN, 'orders ask for something makeable this season, and pay more than the stall');
// mornings: never more than two, lapses kindly
st.orders = []; let maxOpen = 0, lapses = 0, news = 0;
for (let d = 0; d < 60; d++) { const lines = []; t.shopMorning(lines); maxOpen = Math.max(maxOpen, st.orders.length); news += lines.filter(l => /special order/.test(l.t)).length; lapses += lines.filter(l => /about the/.test(l.t)).length; S.day = S.day % 27 + 1; if (S.day === 14) S.day = 15; }
ok(maxOpen <= t.ORDER_MAX && news > 5 && lapses > 0, `orders come and lapse (${news} new, ${lapses} lapsed in 60 days)`);
// handing one over
st.orders = []; const o = t.newOrder(); S.inv = {}; S.inv[o.item] = o.n - 1;
ok(!t.orderDone(o.id), 'can\'t hand over without enough');
S.inv[o.item] = o.n; const c0 = S.coins, f0 = S.fr[o.v];
ok(t.orderDone(o.id) && S.coins - c0 === o.pay && S.fr[o.v] - f0 === 40 && !st.orders.length && S.inv[o.item] === 0, 'handing over pays, and the villager is fonder');
t.enterShop(); st.orders = [t.newOrder()]; t.openSheet('shop'); ok(/Special orders/.test(body()) && /data-act="shoporder"/.test(body()) && clean(body()), 'orders on the ledger'); close();

// ---- gift baskets ----
S.inv = { pepper:3, melon:1, salve:1, mint:4 }; st.basket = [];
ok(t.basketAdd('pepper') && !t.basketAdd('pepper'), 'one of each thing');
ok(!t.basketAdd('bouquet'), 'no romance items');
t.basketAdd('melon'); t.basketAdd('salve'); ok(t.basketReady() && !t.basketAdd('mint') && S.inv.pepper === 2, 'three things fill it');
const bp = t.basketPrice(); ok(bp === Math.round((t.shopPrice('pepper', 'fair') + t.shopPrice('melon', 'fair') + t.shopPrice('salve', 'fair')) * 1.3), 'priced at 1.3× the fair prices');
t.openSheet('shop'); ok(/Ready on the counter/.test(body()) && clean(body()), 'basket on the ledger'); close();
t.basketBack(); ok(!st.basket.length && S.inv.melon === 1 && S.inv.pepper === 3, 'emptying it puts things back');
t.basketAdd('pepper'); t.basketAdd('melon'); t.basketAdd('salve');
// a basket customer during a shop day
st.shelf[0] = { id:'mint', n:10, p:'fair' }; S.time = 600; S.day = 2; t.shopOpenUp();
let bought = false;
for (let i = 0; i < 3000 && !bought; i++) { t.update(.1); const w = t.SV && t.SV.custs.find(c => c.st === 'wait'); if (w) { const was = w.basket; const c1 = S.coins; t.shopServe(w); if (was) { bought = S.coins - c1 === bp && !t.basketReady(); } } }
ok(bought, 'someone buys the basket for its price');
t.shopCloseUp(true); close();
// the helper sells baskets too
t.basketAdd('mint'); t.basketAdd('pepper'); S.inv.cordial = 1; t.basketAdd('cordial');
let hs = 0; for (let i = 0; i < 20; i++) { if (!t.basketReady()) { st.basket = ['mint', 'pepper', 'cordial']; } const r = t.helperSales('pip', 540, 1080); if (!t.basketReady()) hs++; }
ok(hs > 6 && hs < 20, `the helper sells the basket some days (${hs} of 20)`);
st.basket = [];

// ---- out-of-town buyers ----
const days = []; for (let d = 1; d <= 28; d++) { S.day = d; if (t.buyerDay()) days.push(d); }
ok(days.join() === '3,10,17,24', 'buyers on days 3, 10, 17 and 24');
const kinds = new Set(); for (let y = 1; y < 4; y++) for (let s = 0; s < 4; s++) for (const d of days) { S.year = y; S.season = s; S.day = d; kinds.add(t.buyerToday()); }
ok(kinds.size === 4, 'all four kinds of buyer turn up');
S.year = 1; S.season = 1; S.day = 3; const b = t.buyerToday();
const lines = []; st.orders = []; t.shopMorning(lines); ok(lines.some(l => new RegExp(t.BUYERS[b].name).test(l.t)), 'morning says a buyer is in town');
// they come in once she's open
const want = t.BUYERS[b].want, sample = want === 'fish' ? 'sunfish' : want === 'potion' ? 'salve' : want === 'forage' ? 'sunberry' : 'pepper';
S.inv = { [sample]:9 }; t.shopDay().buyerCame = false; S.time = 600; st.shelf[0] = { id:'mint', n:10, p:'fair' }; ok(t.shopOpenUp(), 'open on a buyer day');
let came = null; for (let i = 0; i < 2000 && !came; i++) { t.update(.1); came = t.SV.custs.find(c => c.buyer && c.st === 'wait'); }
ok(came, 'the buyer comes to the counter');
t.shopServe(came); ok(t.sheet === 'buyer' && /half as much again/.test(body()) && clean(body()), 'tapping them opens what they\'ll buy');
const c2 = S.coins; const got = t.buyerSell(sample, 9);
ok(got === Math.round(t.sellValue(sample) * t.BUYER_PAY) * t.BUYER_MAX && S.inv[sample] === 3 && S.coins - c2 === got, `they take up to ${t.BUYER_MAX} at 1.5×`);
ok(t.buyerSell(sample, 1) === 0, 'and no more');
close(); t.shopCloseUp(true); ok(t.shopDay().buyerGone, 'closing sends the buyer off');
S.day = 4; ok(!t.buyerToday(), 'no buyer on other days');

// old shop state without orders or basket
const m = Object.assign({}, S.shop); delete m.orders; delete m.basket; S.shop = m; const l2 = []; t.shopMorning(l2); t.openSheet('shop'); ok(clean(body()), 'old shop with no orders or basket'); close();
console.log(`shop4test: ${pass} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
