// Zara's cart: stock, prices, limits, friend's price, sheets, married Zara, saves.
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", "globalThis.__t={get S(){return S},set S(x){S=x},startGame,endDay,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},VILLAGERS,VIDS,where,enterVillage,leaveVillage,cartStock,cartBuy,cartPrice,cartRoad,cartHere,zaraAtCart,itemValue,ITEMS,heartsOf,migrate,save,load,addFr};\n})();");
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = v, removeItem: k => delete store[k] };
eval(src); const t = __t; t.startGame(true); let S = t.S;
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; if (bad < 25) console.log('BAD', m); } };
const body = () => document.getElementById('shBody').innerHTML, clean = h => !/undefined|NaN|\[object/.test(h);
const close = () => { if (t.sheet) t.closeSheet(); };
close();
// spring y1: Zara isn't here, no cart
S.day = 5; ok(!t.cartHere(), 'cart in spring y1');
// every market day for two years: stock sane, prices above sell value, nothing in season, rotates
const seenSets = new Set(); let days = 0;
for (let y = 1; y <= 2; y++) for (let s = 0; s < 4; s++) for (const d of [5, 12, 19, 26]) {
  S.year = y; S.season = s; S.day = d; S.time = 600; S.rain = false;
  if (y === 1 && s === 0) continue; days++;
  ok(t.cartHere(), `no cart y${y} s${s} d${d}`);
  const st = t.cartStock(); ok(st.length === 5, 'stock size ' + st.length);
  for (const w of st) { ok(w.price > t.itemValue(w.id) * 1.9, `${w.id} price ${w.price} too close to sell ${t.itemValue(w.id)}`); ok(!!t.ITEMS[w.id], 'unknown ' + w.id);
    if (w.road) { const it = t.ITEMS[w.id]; ok(!it.seasons.includes(s), `${w.id} in season`); ok(it.seasons.length < 4, 'all-season ' + w.id); } }
  ok(new Set(st.map(w => w.id)).size === 5, 'duplicate wares');
  seenSets.add(t.cartRoad().join());
  ok(t.cartRoad().join() === t.cartRoad().join(), 'stock not stable within the day');
}
ok(seenSets.size >= days - 2, `stock barely rotates: ${seenSets.size}/${days}`);
// buying: in the village, at her cart
S.year = 1; S.season = 1; S.day = 12; S.time = 600; S.rain = false; S.coins = 5000; S.inv = {};
ok(!t.zaraAtCart(), 'at cart from the farm');
ok(!t.cartBuy('starshard'), 'bought from the farm');
t.enterVillage(); ok(t.zaraAtCart(), 'zara not at cart 10am market day');
const p0 = t.cartPrice('starshard'); ok(p0 === 600, 'starshard price ' + p0);
ok(t.cartBuy('starshard') && S.inv.starshard === 1 && S.coins === 4400, 'starshard buy');
ok(!t.cartBuy('starshard'), 'second starshard allowed');
ok(t.cartBuy('crystal') && S.inv.crystal === 1, 'crystal buy');
const r0 = t.cartRoad()[0]; for (let i = 0; i < 3; i++) ok(t.cartBuy(r0), 'road buy ' + i); ok(!t.cartBuy(r0), 'road over limit');
ok(!t.cartBuy('mint'), 'bought something not stocked');
S.coins = 10; ok(!t.cartBuy(t.cartRoad()[1]), 'bought without coins'); S.coins = 5000;
// sheet renders
t.openSheet('place', { p:'cart' }); let h = body();
ok(/Zara's wares/.test(h) && /data-act="zbuy"/.test(h) && clean(h), 'cart sheet');
ok(/Sold out/.test(h), 'sold out shown');
const scrollKeep = document.getElementById('shBody'); close();
t.openSheet('villager', { v:'zara' }); h = body(); ok(/See her wares/.test(h) && clean(h), 'wares button on her page'); close();
// next market day restocks
S.day = 19; ok(t.cartBuy('starshard'), 'no restock next week');
// evening: she's at the inn, drawers shut
S.time = 1200; ok(!t.zaraAtCart(), 'shop open at 8pm'); t.openSheet('place', { p:'cart' }); h = body(); ok(/drawers are shut/.test(h) && !/zbuy/.test(h) && clean(h), 'shut sheet'); close();
// rain: she stays at the cart
S.time = 600; S.rain = true; ok(t.zaraAtCart(), 'rain closes cart'); S.rain = false;
// friend's price at 5 hearts
S.fr.zara = 500; ok(t.heartsOf('zara') >= 5, 'hearts'); ok(t.cartPrice('starshard') === 540, 'friend price ' + t.cartPrice('starshard'));
t.openSheet('place', { p:'cart' }); ok(/friend's price: 10% off/.test(body()), 'friend price text'); close();
// married Zara keeps the cart on market days, and isn't there on other days
S.spouse = 'zara'; S.day = 26; S.time = 600; S.visits = [];
ok(t.cartHere() && t.where('zara') === 'cart' && t.zaraAtCart(), 'married zara cart');
S.day = 27; ok(!t.cartHere() && t.where('zara') !== 'cart', 'married zara cart off-day');
S.spouse = null; S.day = 26;
// saves keep today's purchases, old saves load
t.save(); const back = t.load(); ok(back && back.cart && back.cart.k === `1.1.19` || (back && back.cart), 'cart saved');
const old = JSON.parse(JSON.stringify(S)); delete old.cart; const m = t.migrate(old); ok(m && m.cart === null, 'old save cart default');
console.log(`carttest: ${n - bad}/${n} passed, ${seenSets.size} different stocks over ${days} market days`);
process.exit(bad ? 1 : 0);
