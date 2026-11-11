// Shop balance (PLAN-shop.md): runs the real shop code for whole days, with a bot that serves anyone waiting
// within a few seconds, and compares what the shop takes with what the same things fetch at the market stall.
// Then puts the premium next to a season's farm earnings from econ4.js. Run from tests/ after extract.py.
// Args: days per season to sample (default 40).
const fs = require('fs'), { execSync } = require('child_process');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", `globalThis.__t={get S(){return S},startGame,update,closeSheet,get sheet(){return sheetOpen},enterShop,leaveShop,shopState,shopDay,shopOpenUp,shopServe,get SV(){return SV},helperSales,HELPER_CUT,shopBuyUp,shopMorning,ITEMS,FISH,FORAGE,buyerToday,BUYER_PAY,BUYER_MAX,sellValue,QUESTS,CROPS,POTIONS,VIDS,dayKey};\n})();`);
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem:k => store[k] ?? null, setItem:(k, v) => store[k] = String(v), removeItem:k => delete store[k] };
eval(src); const t = __t; t.startGame(true); const S = t.S; const close = () => { while (t.sheet) t.closeSheet(); }; close();
const N = +(process.argv[2] || 40);
S.quests.shop = { s:5, done:true, at:1 };
const SEAS = ['spring', 'summer', 'autumn', 'winter'];
const out = {};
const UPS = process.argv[3] === 'up';
if (UPS) console.log('(with every improvement bought and a Beloved shop: 10 places, the glass case, the window, the sign)');
for (const [season, year] of [[1, 1], [2, 1], [3, 1], [0, 2]]) {
  const crops = Object.keys(t.CROPS).filter(id => t.CROPS[id].seasons.includes(season));
  const pots = Object.keys(t.POTIONS).filter(id => !t.POTIONS[id].wild && Object.keys(t.POTIONS[id].need).every(k => crops.includes(k)));
  let tot = { coins:0, stall:0, people:0, sold:0, fr:0 };
  for (let day = 0; day < N; day++) {
    S.year = year; S.season = season; S.day = 1 + (day % 27); if (S.day === 14) S.day = 15; S.rain = Math.random() < [.22, .12, .25, 0][season];
    S.time = 540; S.shop = null; S.known = {}; if (t.SV) t.leaveShop && t.leaveShop(); for (const v of t.VIDS) S.fr[v] = 300;
    t.enterShop(); const st = t.shopState();
    if (UPS) { S.coins += 10000; ['tables', 'glass', 'window', 'sign'].forEach(t.shopBuyUp); st.rep = 250; }
    // her shelves: up to 4 kinds of this season's crops, 10 each, and two shelves of potions (6 a day: two nights of brewing)
    const nS = st.shelf.length, kinds = crops.slice(0, 4).concat(pots.slice(0, 6 - Math.min(4, crops.length)));
    while (kinds.length < nS) kinds.push(kinds[kinds.length % Math.max(1, kinds.length)]);
    S.inv = {}; kinds.forEach((id, i) => { if (i >= nS) return; const n = t.POTIONS[id] ? 3 : 10; st.shelf[i] = { id, n, p:'fair' }; });
    const stock0 = st.shelf.map(s => ({ id:s.id, n:s.n }));
    const fr0 = t.VIDS.reduce((a, v) => a + S.fr[v], 0), c0 = S.coins;
    t.shopOpenUp();
    for (let i = 0; i < 6000 && t.SV && t.SV.open; i++) {
      t.update(.1);
      const w = t.SV && t.SV.custs.filter(c => c.st === 'wait');
      if (w && w.length && i % 20 === 0) t.shopServe(w[0]);
      if (t.sheet === 'shopday') break;
    }
    close();
    const d = t.shopDay(); let stall = 0;
    st.shelf.forEach((s, i) => { const o = stock0[i]; if (o.id) stall += (o.n - (s.id === o.id ? s.n : 0)) * t.sellValue(o.id); });
    tot.coins += S.coins - c0; tot.stall += stall; tot.people += d.people; tot.sold += d.sold; tot.fr += t.VIDS.reduce((a, v) => a + S.fr[v], 0) - fr0;
    S.scene = 'farm'; t.__noop;
  }
  for (const k in tot) tot[k] /= N;
  out[SEAS[season]] = tot;
  console.log(`${SEAS[season].padEnd(7)} y${year}: ${tot.people.toFixed(1)} customers, ${tot.sold.toFixed(1)} things sold, ${Math.round(tot.coins)} coins a day (the market stall pays ${Math.round(tot.stall)} for the same): +${Math.round(tot.coins - tot.stall)} a day (+${Math.round((tot.coins / tot.stall - 1) * 100)}%), friendship +${Math.round(tot.fr)} a day across the village`);
}
// Next to a season of farming (econ4, good player with the Wood and spells).
let econ = '';
try { econ = execSync('node econ4.js', { cwd:__dirname }).toString(); } catch (e) {}
for (const s of ['summer', 'autumn', 'winter']) {
  const m = econ.split('\n').find(l => l.startsWith(s)); if (!m) continue;
  const nums = m.match(/good\/relaxed:\s+(\d+)\s+(\d+)\s+\|\s+with Wood[^:]*:\s+(\d+)/); if (!nums) continue;
  const farm = +nums[3], prem = out[s].coins - out[s].stall;
  console.log(`${s.padEnd(7)} farm season ${farm}: the shop on 8 days +${Math.round(prem * 8)} (+${Math.round(prem * 8 / farm * 100)}%), on 16 days +${Math.round(prem * 16)} (+${Math.round(prem * 16 / farm * 100)}%), less 500 coins to restore it once`);
}

// Part 2: a helper minding it while she farms (no time from her at all).
for (const [season, year] of [[1, 1], [2, 1], [3, 1]]) {
  const crops = Object.keys(t.CROPS).filter(id => t.CROPS[id].seasons.includes(season));
  const pots = Object.keys(t.POTIONS).filter(id => !t.POTIONS[id].wild && Object.keys(t.POTIONS[id].need).every(k => crops.includes(k)));
  const res = {};
  for (const [who, from, to] of [['pip', 900, 1080], ['pip rest day', 540, 1080], ['spouse', 540, 1080]]) {
    let net = 0, stall = 0;
    for (let k = 0; k < N; k++) {
      S.year = year; S.season = season; S.day = 3; S.shop = null; const st = t.shopState(); S.rain = false;
      const kinds = crops.slice(0, 4).concat(pots.slice(0, 6 - Math.min(4, crops.length)));
      kinds.forEach((id, i) => { if (i < 6) st.shelf[i] = { id, n:t.POTIONS[id] ? 3 : 10, p:'fair' }; });
      const before = st.shelf.map(x => x.n);
      const r = t.helperSales(who === 'spouse' ? 'rowan' : 'pip', from, to);
      net += r.coins - r.cut; st.shelf.forEach((x, i) => stall += (before[i] - x.n) * t.sellValue(x.id));
    }
    res[who] = `${Math.round(net / N)} coins (+${Math.round((net / N) - stall / N)} over the stall, +${Math.round((net / stall - 1) * 100)}%)`;
  }
  console.log(`${SEAS[season].padEnd(7)} helper days: Pip after school ${res.pip}; Pip on a rest day ${res['pip rest day']}; spouse or best friend all day ${res.spouse}`);
}

// Part 4: special orders and buyers over a season (every order handed over in time; the buyer gets 6 of the
// dearest thing of their kind she'd have).
for (const [season, year] of [[1, 1], [2, 1], [3, 1]]) {
  let ordPrem = 0, ords = 0, buyPrem = 0;
  for (let k = 0; k < N; k++) {
    S.year = year; S.season = season; S.shop = null; const st = t.shopState(); st.orders = [];
    for (let d = 1; d <= 28; d++) {
      S.day = d; const lines = []; t.shopMorning(lines);
      for (const o of st.orders.slice()) { ords++; ordPrem += o.pay - t.ITEMS[o.item].sell * o.n; st.orders = st.orders.filter(x => x !== o); }
      const b = t.buyerToday(); if (b) { const kind = { potion:t.POTIONS, fish:t.FISH, forage:t.FORAGE, crop:t.CROPS }[t.BUYERS ? 0 : 0] || null; }
    }
    const crops = Object.keys(t.CROPS).filter(id => t.CROPS[id].seasons.includes(season));
    const pv = Object.keys(t.POTIONS).filter(id => !t.POTIONS[id].wild && Object.keys(t.POTIONS[id].need).every(x => crops.includes(x))).map(id => t.POTIONS[id].sell);
    const best = { potion:Math.max(...pv), crop:Math.max(...crops.map(id => t.CROPS[id].sell)), fish:Math.max(...Object.values(t.FISH).filter(f => f.seasons.includes(season) && f.sell < 150).map(f => f.sell)), forage:Math.max(...Object.values(t.FORAGE).filter(f => f.seasons && f.seasons.includes(season)).map(f => f.sell)) };
    for (let d = 1; d <= 28; d++) { S.day = d; const b = t.buyerToday(); if (b) buyPrem += best[{ guild:'potion', cook:'fish', herbalist:'forage', grocer:'crop' }[b]] * (t.BUYER_PAY - 1) * t.BUYER_MAX; }
  }
  console.log(`${SEAS[season].padEnd(7)} orders and buyers: ${(ords / N).toFixed(1)} orders a season worth +${Math.round(ordPrem / N)} over the stall if all handed over, and four buyer days worth up to +${Math.round(buyPrem / N)}`);
}
