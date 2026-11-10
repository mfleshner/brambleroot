// Villager plan part 3: schedules, the village map, the gate, the place sheets, the calendar and the gift notebook.
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", "globalThis.__t={get S(){return S},startGame,endDay,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},VILLAGERS,VIDS,where,untilOf,canMeet,villageFolk,VB,VSPOTS,VPLACES,SCHED,enterVillage,leaveVillage,enqueue,update,visit,get queue(){return queue},witch,buildStatic,draw,inValley,talkTo,giveGift,seekVillager,meetBox,notebook,notebookCount,vBuildingAt,FEST_DAY,isFestDay,heartsOf,resize};\n})();");
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = v, removeItem: k => delete store[k] };
eval(src); const t = __t; t.startGame(true); const S = t.S;
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; if (bad < 25) console.log('BAD', m); } };
const body = () => document.getElementById('shBody').innerHTML, clean = h => !/undefined|NaN|\[object/.test(h);
const close = () => { if (t.sheet) t.closeSheet(); };
close();
// 1. map sanity: spots don't overlap buildings, river or each other; her stand tiles aren't someone's spot
const vt = new Set(), wt = new Set();
for (const [p, list] of Object.entries(t.VSPOTS)) for (const [c, r, wc, wr] of list) {
  const k = c + ',' + r; ok(!vt.has(k), 'two spots on ' + k); vt.add(k); wt.add(wc + ',' + wr);
  ok(c >= 0 && c < 9 && r >= 0 && r < 13 && wc >= 0 && wc < 9 && wr >= 0 && wr < 13, 'spot off map ' + p);
  const b = t.vBuildingAt(c, r); ok(!b || (p === 'docks' && b === 'docks'), `spot ${k} for ${p} sits on building ${b}`);
  ok(r !== 9 || (c === 6 && p === 'docks'), 'spot in the river ' + k);
  ok(!(Math.abs(wc - c) + Math.abs(wr - r) !== 1), 'her stand not next to spot ' + p + ' ' + k);
}
for (const k of wt) ok(!vt.has(k), 'her stand tile is a villager spot ' + k);
for (const [p, B] of Object.entries(t.VB)) ok(!vt.has(B.stand.join(',')), 'building stand on a spot ' + p);
// 2. schedules: every entry is a known place, sorted, starting at 6 am
for (const v of t.VIDS) { const sc = t.SCHED[v]; ok(!!sc, 'no schedule ' + v); for (const l of [sc.day, sc.rest].filter(Boolean)) { ok(l[0][0] === 360, v + ' starts late'); l.forEach((e, i) => { ok(e[1] === 'home' || !!t.VPLACES[e[1]], v + ' unknown place ' + e[1]); if (i) ok(e[0] > l[i - 1][0], v + ' unsorted'); }); } }
// 3. play 2 years: who's where at 8 am, noon, 4 pm, 8 pm, in rain and sun; render every new sheet
const seen = {}, rainIndoors = { ok:0, all:0 }, busy = { morning:0, noon:0, eve:0, days:0 };
let maxInn = 0;
for (let d = 0; d < 28 * 8; d++) {
  close();
  for (const tm of [480, 720, 960, 1200]) {
    S.time = tm;
    const out = t.VIDS.map(v => [v, t.where(v)]);
    for (const [v, p] of out) {
      (seen[v] = seen[v] || new Set()).add(p);
      if (p === 'away') ok(!t.inValley(v) || !(S.year > 1 || t.VILLAGERS[v].arrive <= S.season), `${v} away while in the valley`);
      if (S.rain && t.VPLACES[p] && !(S.day === 14 && tm >= 1020)) { rainIndoors.all++; if (t.VPLACES[p].indoor || p === 'cart') rainIndoors.ok++; }
      if (t.VILLAGERS[v].market && p === 'cart') ok(S.day % 7 === 5 || S.day === 14, 'zara cart off market day ' + S.day);
    }
    const inVillage = out.filter(([, p]) => t.VPLACES[p]).length;
    if (tm === 480) busy.morning += inVillage; if (tm === 720) busy.noon += inVillage; if (tm === 1200) busy.eve += inVillage;
    maxInn = Math.max(maxInn, out.filter(([, p]) => p === 'inn').length);
    // the folk on the map never share a tile
    const f = t.villageFolk().filter(z => !z.inside), tiles = f.map(z => z.c + ',' + z.r);
    ok(new Set(tiles).size === tiles.length, 'two villagers on one tile');
    if (S.rain) ok(f.every(z => !t.VPLACES[z.p].indoor), 'someone drawn outside an indoor place in the rain');
  }
  busy.days++;
  S.time = 720;
  if (d % 9 === 0) {
    for (const p of Object.keys(t.VPLACES)) { t.openSheet('place', { p }); ok(clean(body()), 'place sheet ' + p); close(); }
    t.openSheet('gate'); ok(clean(body()) && body().includes('govillage') && body().includes('gowood'), 'gate sheet'); close();
  }
  t.endDay(false);
}
close();
console.log('places each person was seen at:'); for (const v of t.VIDS) console.log('  ' + v.padEnd(8), [...seen[v]].join(', '));
console.log(`average people in the village: 8 am ${(busy.morning / busy.days).toFixed(1)}, noon ${(busy.noon / busy.days).toFixed(1)}, 8 pm ${(busy.eve / busy.days).toFixed(1)}; most at the inn at once: ${maxInn}`);
console.log(`in the rain, ${rainIndoors.ok} of ${rainIndoors.all} village sightings were indoors (or Zara under her awning)`);
// 4. the village scene: walk in, tap each person, talk, gift, leave
S.rain = false; S.day = 12; S.time = 720; S.visits = []; t.resize();
t.enterVillage(); ok(S.scene === 'village', 'entered village');
t.buildStatic(); t.draw();
const folk = t.villageFolk().filter(z => !z.inside);
ok(folk.length >= 6, 'at least 6 people standing about at noon on a market day, got ' + folk.length);
const tapTile = (c, r) => { t.enqueue({ c, r }, false); for (let i = 0; i < 400 && (t.queue.length || t.witch.walk); i++) { t.update(1 / 30); if (t.sheet) break; } };
let talked = 0;
for (const f of folk) {
  close(); S.time = 720; tapTile(f.c, f.r);
  ok(t.sheet === 'villager', 'tapping ' + f.v + ' opens their page'); if (t.sheet !== 'villager') continue;
  ok(clean(body()) && body().includes('data-act="talk"'), f.v + ' page has chat');
  const before = S.fr[f.v]; t.talkTo(f.v); if (S.fr[f.v] > before) talked++;
  close();
}
ok(talked === folk.length, 'chatted with everyone tapped');
// buildings open "who's here"
for (const p of ['inn', 'mill', 'smithy', 'apothecary', 'school', 'lanes', 'lighthouse']) { close(); S.time = 720; const B = t.VB[p]; tapTile(B.c, B.r); ok(t.sheet === 'place', 'tapping ' + p + ' opens who\'s here, got ' + t.sheet); }
close(); tapTile(t.VB.board.c, t.VB.board.r); ok(t.sheet === 'calendar' && clean(body()), 'village board opens the calendar');
// can't chat from the journal with someone who isn't where she is
close(); t.leaveVillage(); S.time = 720; S.visits = [];
const mara = t.where('mara'); t.openSheet('villager', { v:'mara' });
ok(!body().includes('data-act="talk"') && body().includes('data-act="seek"'), 'farm: Mara (at ' + mara + ') can\'t be chatted with from the list; offered a walk');
close(); t.seekVillager('mara');
for (let i = 0; i < 600 && (t.queue.length || t.witch.walk || S.scene === 'farm'); i++) { t.update(1 / 30); if (t.sheet) break; }
ok(S.scene === 'village' && t.sheet === 'villager', 'seek walks her through the gate to Mara, scene ' + S.scene + ' sheet ' + t.sheet);
close();
// garden visitors still work on the farm, and the spouse at home
t.leaveVillage(); S.visits = [{ v:'rowan', c:8, r:4, from:360, to:1440 }];
ok(t.where('rowan') === 'garden' && t.canMeet('rowan'), 'garden visitor can be met on the farm');
t.enterVillage(); ok(!t.canMeet('rowan'), 'garden visitor can\'t be met from the village'); t.leaveVillage();
S.spouse = 'isolde'; S.visits = []; S.time = 1400; ok(t.where('isolde') === 'cottage' && t.canMeet('isolde'), 'spouse at home in the evening, met on the farm'); S.spouse = null;
// rain: nobody stands out in the rain, the inn fills up
S.rain = true; S.time = 720; t.enterVillage();
ok(t.villageFolk().filter(z => !z.inside).length === 0 || t.villageFolk().filter(z => !z.inside).every(z => z.p === 'cart' || z.p === 'docks' || z.p === 'square'), 'rain: only outdoor spots drawn');
ok(t.villageFolk().some(z => z.inside), 'rain: people indoors');
t.draw(); t.leaveVillage(); S.rain = false;
// festival day: everyone at the festival grounds from 10 am to 10 pm
S.day = 14; S.time = 1100; S.visits = []; ok(t.VIDS.filter(v => t.where(v) === 'fest').length >= 10, 'festival crowd at the grounds');
// 5. calendar and notebook
for (let s = 0; s < 4; s++) { t.openSheet('calendar'); t.renderSheet('calendar'); ok(clean(body()), 'calendar season ' + s); close(); }
S.known = { mara:{ honey:'love', mint:'like', wolf:'hate', turnip:'neutral' } };
const nb = t.notebook('mara'); ok(nb.includes('Wildflower Honey') && nb.includes('2 still to find') && nb.includes('Dislikes'), 'notebook shows found and missing tastes');
const nc = t.notebookCount(); ok(nc.got === 3 && nc.all > 100, 'notebook count ' + JSON.stringify(nc));
for (const v of t.VIDS) for (const fr of [0, 450, 850]) { S.fr[v] = fr; t.openSheet('villager', { v }); ok(clean(body()), 'villager page ' + v); close(); }
console.log(`${n - bad} passed, ${bad} failed`);
