// Best friends (PLAN-hearts.md Part 1) and growing-crop drawing. Run from a folder with b.js and shot-save.json.
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", "globalThis.__t={get S(){return S},set S(x){S=x},startGame,endDay,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},VILLAGERS,VIDS,BFF,BFF_HELP,BFF_HELP_P,isBff,heartsOf,heartMax,addFr,nextScene,giveBracelet,giveBouquet,bffBox,braceletOnSale,bffMorning,hearts,migrate,ITEMS,NOGIFT,CROPS,ROMANCE,drawGrowing,canMeet,inValley,kindGoodbye:typeof kindGoodbye!=='undefined'?kindGoodbye:null,talkTo};\n})();");
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = v, removeItem: k => delete store[k] };
eval(src); const t = __t; t.startGame(true); let S = t.S;
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; if (bad < 40) console.log('BAD', m); } };
const body = () => document.getElementById('shBody').innerHTML, clean = h => !/undefined|NaN|\[object/.test(h);
const close = () => { if (t.sheet) t.closeSheet(); };
close();
S.year = 2; S.season = 1; S.day = 10; S.time = 600; S.scene = 'village';
// make everyone meetable for the page buttons
const meetAll = () => { S.visits = t.VIDS.map((v, i) => ({ v, at:i })); };

// --- content: every villager has bracelet, 9 and 10 lines, and help ---
for (const v of t.VIDS) {
  const B = t.BFF[v]; ok(B && B.yes && B.s9 && B.s10, v + ' BFF lines');
  for (const k of ['yes', 's9', 's10']) ok(B[k].length > 80 && B[k].length < 420, `${v}.${k} length ${B[k] && B[k].length}`);
  ok(typeof t.BFF_HELP[v] === 'function', v + ' help');
}
const all = t.VIDS.flatMap(v => ['yes', 's9', 's10'].map(k => t.BFF[v][k])); ok(new Set(all).size === all.length, 'duplicate BFF lines');
ok(t.ITEMS.bracelet && t.NOGIFT.bracelet, 'bracelet item, not giftable');

// --- caps and hearts ---
for (const v of t.VIDS) for (const l of [2, 4, 6, 8]) S.scenes[v + l] = true; // earlier heart scenes already seen
S.fr.rowan = 840; S.bff = {}; S.dating = null; S.spouse = null; S.wedding = null;
t.addFr('rowan', 500); ok(S.fr.rowan === 850 && t.heartsOf('rowan') === 8, 'non-bff capped at 850');
ok(/9 and 10 locked/.test(t.hearts(8, 'rowan')), 'locks shown for a friend');
ok(/9 and 10 locked/.test(t.hearts(8, 'fen')), 'locks shown for a friend-only villager');
ok(!t.braceletOnSale() || true, 'sale check runs');
ok(t.braceletOnSale(), 'bracelet on sale at 8 hearts');
// give without a bracelet: nothing
S.inv.bracelet = 0; t.giveBracelet('rowan'); ok(!t.isBff('rowan'), 'bff without bracelet');
S.inv.bracelet = 1; S.fr.fen = 790; t.giveBracelet('fen'); ok(!t.isBff('fen') && S.inv.bracelet === 1, 'bff under 8 hearts');
t.giveBracelet('rowan'); ok(t.isBff('rowan') && S.inv.bracelet === 0 && t.sheet === 'scene' && body().includes(t.BFF.rowan.yes.slice(0, 30)), 'bracelet given'); close();
ok(!/locked/.test(t.hearts(8, 'rowan')), 'unlocked after bracelet');
t.addFr('rowan', 120); ok(t.heartsOf('rowan') === 9, '9 hearts');
let sc = t.nextScene('rowan'); ok(sc && sc.lvl === 9 && sc.text === t.BFF.rowan.s9 && sc.mood === 'happy', 'bff scene 9');
ok(!t.nextScene('rowan'), 'scene 9 twice');
t.addFr('rowan', 500); ok(S.fr.rowan === 1050 && t.heartsOf('rowan') === 10, 'capped at 1050');
sc = t.nextScene('rowan'); ok(sc && sc.lvl === 10 && sc.text === t.BFF.rowan.s10, 'bff scene 10');
// several best friends
S.day = 12; // a market day, so Zara is in the valley
for (const v of ['pip', 'tilly', 'hettie', 'zara']) { S.fr[v] = 800; S.inv.bracelet = 1; t.giveBracelet(v); close(); ok(t.isBff(v), v + ' bff'); }
// the page
meetAll(); S.fr.odile = 820; S.inv.bracelet = 1;
t.openSheet('villager', { v:'odile' }); ok(/data-act="bracelet"/.test(body()) && clean(body()), 'bracelet button on the page'); close();
S.inv.bracelet = 0; t.openSheet('villager', { v:'odile' }); ok(/Friendship Bracelet from the Market/.test(body()), 'how-to note'); close();
t.openSheet('villager', { v:'rowan' }); ok(/your best friend, at 10 hearts/.test(body()) && clean(body()), 'bff page'); close();
t.openSheet('journal'); close();
// market
S.coins = 1000; t.openSheet('market'); ok(clean(body()), 'market renders'); close();

// --- romance interplay ---
// a best friend she starts dating gets the romance 9/10 scenes, not blocked by having seen the bff ones
S.fr.juno = 850; S.inv.bracelet = 1; t.giveBracelet('juno'); close(); t.addFr('juno', 300);
t.nextScene('juno'); t.nextScene('juno'); ok(S.scenes.junob9 && S.scenes.junob10, 'juno bff scenes seen');
S.inv.bouquet = 1; t.giveBouquet('juno'); close(); ok(S.dating === 'juno' && !t.isBff('juno'), 'dating replaces bff');
ok(t.heartsOf('juno') === 10, 'hearts kept when dating');
sc = t.nextScene('juno'); ok(sc && sc.lvl === 9 && t.ROMANCE.juno.s9 === sc.text, 'romance scene 9 after bff');
// can't give the partner a bracelet
S.inv.bracelet = 1; t.giveBracelet('juno'); ok(S.inv.bracelet === 1, 'bracelet to partner');
ok(t.bffBox('juno').note === '', 'no bff box for partner');
// goodbye: back to best friend
if (t.kindGoodbye) { t.kindGoodbye('juno'); close(); ok(!S.dating && t.isBff('juno') && t.heartsOf('juno') === 10, 'after goodbye, still a best friend'); }

// --- morning help ---
{ const lines = []; let got = 0, tries = 0; S.rain = false;
  for (let i = 0; i < 400; i++) { const L = []; t.bffMorning(L); if (L.length) { got++; ok(L[0].v && t.isBff(L[0].v) && t.heartsOf(L[0].v) >= 10 && clean(L[0].t), 'help line'); } tries++; }
  ok(got > 100 && got < 190, `help about 35% of mornings (${got}/400)`);
  for (const v of t.VIDS) { const e0 = S.energy; const r = t.BFF_HELP[v](); ok(typeof r === 'string' && r.length > 20 && clean(r), v + ' help text'); }
  // 2 years of mornings with every villager a best friend: no errors
  for (const v of t.VIDS) { S.bff[v] = 1; S.fr[v] = 1050; } S.dating = null;
  const c0 = S.coins; let days = 0; try { for (let i = 0; i < 224; i++) { S.time = 1300; t.endDay(); close(); days++; } } catch (e) { ok(false, 'endDay threw ' + e.message); }
  ok(days === 224, 'two years of mornings'); }

// --- save ---
{ const old = JSON.parse(fs.readFileSync('shot-save.json', 'utf8')); delete old.bff; const m = t.migrate(old); ok(m && m.bff && typeof m.bff === 'object', 'migrate bff');
  t.S = m; S = m; ok(t.VIDS.every(v => !t.isBff(v)), 'no bffs in old save'); ok(t.VIDS.every(v => t.heartMax(v) <= 10), 'heartMax'); }

// --- growing crops draw for every crop at every stage ---
for (const id of Object.keys(t.CROPS)) for (const prog of [.1, .5, .9]) { try { t.drawGrowing(100, 100, 2, id, t.CROPS[id], prog); ok(true, ''); } catch (e) { ok(false, `drawGrowing ${id} ${prog}: ${e.message}`); } }

console.log(`${n - bad}/${n} best-friend checks passed`);
process.exit(bad ? 1 : 0);
