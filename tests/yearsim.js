// Plays two in-game years by sleeping every night, and checks the village systems.
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", "globalThis.__t={get S(){return S},startGame,endDay,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},VILLAGERS,VIDS,inValley,heartsOf,talkTo,applyGifts,addFr,charterDef,checkStars:typeof checkStars==='function'?checkStars:null,reqLabel,ITEMS,itemValue,festRender,FEST,isFestDay};\n})();");
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = v, removeItem: k => delete store[k] };
eval(src); const t = __t; t.startGame(true); const S = t.S;
let bad = 0; const err = m => { bad++; if (bad < 15) console.log('BAD', m); };
const visits = [], perDay = [0, 0, 0, 0], who = {}, reqBy = {};
for (let d = 0; d < 28 * 8; d++) {
  if (t.sheet) t.closeSheet();
  for (const x of S.visits || []) {
    who[x.v] = (who[x.v] || 0) + 1;
    if (!t.inValley(x.v)) err(`${x.v} visited while away, day ${S.day}`);
  }
  perDay[(S.visits || []).length]++;
  for (const q of S.reqs) reqBy[q.v] = (reqBy[q.v] || 0) + (q.fresh ? 1 : 0);
  for (const q of S.reqs) q.fresh = false;
  // Zara only around on market days and festivals
  const zaraHere = t.inValley('zara');
  if (zaraHere && !(S.day % 7 === 5 || S.day === 14)) err('zara here on day ' + S.day);
  // festival sheet renders cleanly for everyone
  if (t.isFestDay()) { const h = t.festRender(); if (/undefined|NaN/.test(h)) err('festival render has undefined, season ' + S.season); if (S.season === 0 && /data-act="dance" data-id="(pip|tilly)"/.test(h)) err('kid offered as dance partner'); }
  t.endDay(false);
}
if (t.sheet) t.closeSheet();
// every villager page renders for every heart level
for (const v of t.VIDS) for (const fr of [0, 350, 650, 850]) { S.fr[v] = fr; t.openSheet('villager', { v }); const h = document.getElementById('shBody').innerHTML; if (/undefined|NaN/.test(h)) err(`villager page ${v} at ${fr}`); t.closeSheet(); }
// heart favours: apply all, check nothing breaks, and total their value
const before = { coins: S.coins, inv: JSON.stringify(S.inv) }; let val = 0; const inv0 = Object.assign({}, S.inv), c0 = S.coins;
S.gifts = {}; for (const v of t.VIDS) { S.fr[v] = 850; t.applyGifts(v, []); }
for (const [k, n] of Object.entries(S.inv)) val += (n - (inv0[k] || 0)) * t.itemValue(k);
val += S.coins - c0;
const newOnes = ['rowan','silas','theo','isolde','juno','hettie','aldous','zara','bertram','tilly'];
console.log('days played:', 28 * 8, '(2 years)');
console.log('garden visitors per day  0/1/2/3:', perDay.join(' / '));
console.log('visits by person:', t.VIDS.map(v => `${v} ${who[v] || 0}`).join(', '));
console.log('requests posted by person (year 1-2):', t.VIDS.map(v => `${v} ${reqBy[v] || 0}`).join(', '));
console.log('every heart favour, total one-off value incl. all 15:', val, 'coins; tool discount now', S.upDisc + '%');
console.log('charter label:', t.reqLabel(t.charterDef(1, 3).stars[2].req), '| year 2:', t.reqLabel(t.charterDef(2, 3).stars[2].req));
console.log(bad ? bad + ' problems' : 'all year checks passed');
