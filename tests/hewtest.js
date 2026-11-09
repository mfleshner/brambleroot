// Headless checks for Hew the Almighty (PLAN-hew.md Parts 2-3): arrival, curses and their effects, the day 7-14 rule,
// counters, breaking curses, gossip, the ease setting, hearts, scenes, dating gate, the duel, marriage, staying a friend
// when she's married to a villager, sheets and old saves. Run from tests/ after `python3 extract.py` (needs b.js).
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", "globalThis.__t={get S(){return S},startGame,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},HW,hewState,HEW_CURSES,HEW_COUNTERS,HEW_LOVES,HEW_SCENES,DUEL_SPELLS,curseOn,curseLive,curseWeak,startCurse,pickCurse,canCap,potSlots,sellValue,hewBreak,hewTalk,hewGift,hewHearts,hewStage,hewDateReady,hewDuelOpen,duelSpell,hewDuelAnswer,hewTaken,addHew,mailMorning,migrate,genWood,endDay,canRomance,VILLAGERS,VIDS,POTIONS,DISHES,CROPS,ITEMS,potionKnown,hewPortrait,woodFree,seasonKey,set jt(v){journalTab=v},talkTo,bouquetOnSale};\n})();");
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem:k => store[k] ?? null, setItem:(k, v) => store[k] = String(v), removeItem:k => delete store[k] };
eval(src); const t = __t; t.startGame(false); const S = t.S; while (t.sheet) t.closeSheet();
let pass = 0, bad = 0; const ok = (c, m) => { if (c) pass++; else { bad++; console.log('FAIL', m); } };
const body = () => document.getElementById('shBody').innerHTML, clean = h => !/undefined|NaN|\[object/.test(h);
const close = () => { while (t.sheet) t.closeSheet(); };
const reset = (y, s, d) => { S.year = y; S.season = s; S.day = d; S.hew = t.hewState(); S.sent = {}; S.mail = []; S.dating = null; S.spouse = null; S.wedding = null; };
const morning = () => { const L = []; t.mailMorning(L); return L; };

// data
ok(Object.keys(t.HEW_CURSES).length === 8, 'eight curses');
for (const [k, C] of Object.entries(t.HEW_CURSES)) ok(C.name && C.effect && C.letter && /Hew the Almighty/.test(C.letter), 'curse text ' + k);
for (let s = 0; s < 4; s++) for (const id of t.HEW_COUNTERS[s]) { const P = t.POTIONS[id], D = t.DISHES[id], need = (P || D).need;
  ok(Object.keys(need).every(k => !t.CROPS[k] || t.CROPS[k].seasons.includes(s)), `counter ${id} can be made in season ${s}`); if (D) ok(D.from === 'start', `dish counter ${id} is a starter`); }
ok(t.HEW_LOVES.every(k => t.DISHES[k]), 'he loves dishes');
ok(['smug', 'fond', 'annoyed', 'flustered', 'shock'].every(m => /Hew the Almighty Wizard/.test(t.hewPortrait(m, 60)) && clean(t.hewPortrait(m, 60))), 'portrait moods');

// arrival
reset(1, 0, 5); morning(); ok(!S.hew.met && !S.mail.some(m => m.from === 'hew'), 'not in a new game\'s first spring');
reset(1, 1, 1); morning(); ok(S.hew.met && S.mail.some(m => m.id === 'hewintro') && S.hew.cur && S.hew.cur.key === '1-1', 'arrives in summer of year 1 with a curse');
ok(S.mail.some(m => m.from === 'hew' && /This season's curse/.test(m.title)), 'curse letter');
reset(2, 1, 22); const L0 = morning(); ok(S.hew.met && !S.hew.cur && L0.some(l => /next season/.test(l.t)), 'late in a season: intro only, curse next season');
S.season = 2; S.day = 1; morning(); ok(S.hew.cur && S.hew.cur.key === '2-2' && S.hew.cur.start === 1, 'curse on the first of next season');
reset(2, 1, 13); morning(); const c13 = S.hew.cur; ok(c13 && c13.weak >= 13 + 6 && c13.weak <= 27, 'mid-season start weakens at least six days later: ' + c13.weak);

// the day 7-14 rule, rotation, rules per season
const seenWeak = new Set(), seq = [];
for (let y = 1; y <= 4; y++) for (let s = 0; s < 4; s++) { S.year = y; S.season = s; S.day = 1; S.slots = 3; S.hew.cur = null; const c = t.startCurse(1); seenWeak.add(c.weak); seq.push(c.id);
  ok(c.weak >= 7 && c.weak <= 14, `weakens on day 7-14 (${c.weak})`); ok(t.HEW_COUNTERS[s].includes(c.counter), 'counter from the season pool');
  if (s === 3) ok(c.id !== 'drought', 'no drought in winter'); }
ok(seenWeak.size >= 4, 'the weak day varies: ' + [...seenWeak].join());
{ let rep = 0; for (let i = 0; i < seq.length; i++) if (seq.slice(Math.max(0, i - 7), i).includes(seq[i])) rep++; ok(rep === 0, 'no repeat within eight seasons: ' + seq.join(',')); }
S.slots = 1; for (let i = 0; i < 40; i++) { S.year = 10 + i; S.hew.hist = []; ok(t.pickCurse() !== 'onepot', 'no Cold Cauldron with one pot'); }

// effects, and the ease setting
const force = id => { reset(2, 1, 9); S.hew.met = true; S.hew.cur = { id, key:t.seasonKey(), weak:10, counter:'salve', broken:false, start:1 }; };
force('smallcan'); S.canMax = 40; ok(t.canCap() === 30, 'leaky can holds 3/4'); S.hew.ease = true; ok(t.canCap() === 40, 'eased: full can'); S.hew.ease = false;
force('onepot'); S.slots = 3; ok(t.potSlots() === 2, 'cold cauldron: one pot fewer');
force('cheapherbs'); ok(t.sellValue('melon') === Math.round(t.ITEMS.melon.sell * .85) && t.sellValue('cordial') === t.ITEMS.cordial.sell, "haggler's curse on herbs only");
force('fewforage'); t.genWood(); ok(S.wood.spots.filter(s => s.r > 3).length === 3, 'hidden wood: three finds');
force('latemorn'); S.time = 360; morning(); ok(S.time === 420, 'lie-in: wakes at 7');
force('drought'); S.rain = true; morning(); ok(!S.rain, 'parched sky: no rain today');
{ let rain = 0; for (let i = 0; i < 40; i++) { S.day = 9; S.hew.cur.key = t.seasonKey(); t.endDay(false); close(); S.day = 9; S.season = 1; S.year = 2; S.hew.cur = { id:'drought', key:t.seasonKey(), weak:10, counter:'salve', broken:false }; if (S.nextRain) rain++; } ok(rain === 0, 'parched sky: never rains'); }
force('slowgrow'); S.plots[0] = Object.assign(S.plots[0] || {}, { t:true, c:'mint', d:0, ready:false, w:true, lag:1 });
{ const p = S.plots[0]; S.day = 9; t.endDay(false); close(); ok(p.d === 0 && !p.lag, 'sluggard hex: first night does not count'); }
force('shyfish'); ok(/curseOn\('shyfish'\) \? \.7/.test(fs.readFileSync('b.js', 'utf8')), 'shy fish shrink the reel zone');
force('shyfish'); S.hew.wed = true; ok(!t.curseOn('shyfish'), 'married: no curse effects'); S.hew.wed = false;

// breaking: not before it weakens, needs the counter, then pays and warms him up
force('smallcan'); S.inv.salve = 0; S.day = 9; ok(!t.hewBreak(), 'not before it weakens');
S.day = 10; ok(!t.hewBreak(), 'not without the counter');
S.inv.salve = 1; const c0 = S.coins, f0 = S.hew.fr; ok(t.hewBreak() && S.hew.cur.broken && S.hew.broken === 1 && S.coins === c0 + 400 && S.hew.fr === f0 + 150 && !t.curseOn('smallcan'), 'breaking it');
ok(!t.hewBreak(), 'only once');

// gossip on the weak day, and in chat
reset(2, 1, 1); morning(); const wk = S.hew.cur.weak; S.day = wk; const Lw = morning();
ok(Lw.some(l => /spell is fraying/.test(l.t) && l.t.includes(t.ITEMS[S.hew.cur.counter].name)), 'weak-day gossip names the counter');
S.day = wk + 1; ok(!morning().some(l => /fraying/.test(l.t)), 'once');
{ let g = 0; for (let i = 0; i < 200; i++) { S.talked = {}; t.talkTo('isolde'); if (/Hew|wizard|tower/.test(body())) g++; close(); } ok(g > 10 && g < 80, 'villagers gossip about Hew sometimes: ' + g); }

// sheets
reset(2, 1, 9); morning(); t.openSheet('hew'); let h = body(); ok(/Hew the Almighty/.test(h) && /This season's curse/.test(h) && /holds firm/.test(h) && clean(h), 'tower sheet before it weakens');
close(); S.day = S.hew.cur.weak; t.openSheet('hew'); h = body(); ok(/weakening/.test(h) && /data-act="hewbreak"/.test(h) && clean(h), 'tower sheet once it weakens'); close();
t.openSheet('hew', { give:true }); ok(/one gift a day/.test(body()) && clean(body()), 'gift view'); close();
t.jt = 'mail'; t.openSheet('journal'); h = body(); ok(/Hew the Almighty/.test(h) && clean(h), 'his letters in the mail'); close();
const tl = t.hewTalk(); ok(tl && t.hewTalk() === null, 'chat once a day');

// hearts, scenes, the dating gate
reset(2, 1, 9); S.hew.met = true; S.hew.fr = 250; t.openSheet('hew'); ok(/2 hearts/.test(body()) && S.hew.scenes[2], '2-heart scene'); close();
t.openSheet('hew'); ok(!/<h4 class="sec">2 hearts/.test(body()), 'scene shows once'); close();
S.hew.fr = 900; S.hew.broken = 3; ok(!t.hewDateReady(), 'not before four curses broken');
S.hew.broken = 4; ok(t.hewDateReady() && t.bouquetOnSale(), 'eight hearts and four curses: ready');
S.dating = 'theo'; ok(t.hewTaken() && !t.hewDateReady() && t.hewHearts() === 8, 'dating a villager: Hew stays a friend');
t.openSheet('hew'); ok(/A good friend/.test(body()) && /spoken for/.test(body()), 'friend wording'); close(); S.dating = null;
S.inv.bouquet = 1; ok(t.hewGift('bouquet') === 'date' && S.hew.dating && !t.canRomance('theo'), 'bouquet: dating Hew, villagers off');
ok(t.hewHearts() === 9, 'hearts can now climb past 8');
// gifts
S.inv.risotto = 1; S.inv.minnowfry = 2; const fr1 = S.hew.fr; ok(t.hewGift('risotto') === 'love' && S.hew.fr === fr1 + 40, 'he secretly loves risotto');
ok(t.hewGift('minnowfry') === 'once', 'one gift a day');
// the duel
S.hew.fr = 1000; ok(t.hewHearts() === 10 && t.hewDuelOpen(), 'duel opens at 10 hearts');
{ const st = { round:0, wins:0, losses:0, log:[], done:null }; while (!st.done) t.hewDuelAnswer(st, t.DUEL_SPELLS[t.duelSpell(st.round)].beat); ok(st.done === 'won' && S.hew.duel && st.wins === 3, 'winning the duel'); }
{ S.hew.duel = false; const st = { round:0, wins:0, losses:0, log:[], done:null }; while (!st.done) { const sp = t.duelSpell(st.round); const wrong = Object.keys(t.DUEL_SPELLS).find(e => e !== t.DUEL_SPELLS[sp].beat); t.hewDuelAnswer(st, wrong); } ok(st.done === 'lost' && S.hew.duelTry, 'losing: try again tomorrow'); }
{ const beats = Object.values(t.DUEL_SPELLS).map(x => x.beat).sort().join(); ok(beats === 'earth,fire,water,wind', 'every spell has one counter'); }
S.hew.duel = false; S.inv.ring = 1; ok(t.hewGift('ring') === null && S.inv.ring === 1, 'no proposal before the duel');
S.hew.duel = true; t.openSheet('hewduel', { round:3, wins:3, losses:0, log:[{ sp:'fire', el:'water', won:true }], done:'won' }); ok(/Bramble would have been proud/.test(body()) && clean(body()), 'duel win sheet'); close();
t.openSheet('hewduel', { round:1, wins:0, losses:1, log:[{ sp:'fire', el:'earth', won:false }], done:null }); ok(/data-act="duel"/.test(body()) && /He wins the round/.test(body()) && clean(body()), 'duel round sheet'); close();
ok(t.hewGift('ring') === 'wed' && S.hew.wed && t.hewStage() === 'wed', 'married to Hew');
S.season = 2; S.day = 1; S.sent = {}; morning(); ok(S.mail.some(m => /This season's curse/.test(m.title) && /husband|love|Wife|Dearest/.test(m.text)) && !Object.keys(t.HEW_CURSES).some(t.curseOn), 'married: joke curses only');
t.openSheet('hew'); ok(/Your husband/.test(body()) && clean(body()), 'husband wording'); close();

// wood, old saves
ok(!t.woodFree(8, 4) && !t.woodFree(8, 5) && t.woodFree(5, 5), "forage never lands on Hew's tower");
const old = JSON.parse(JSON.stringify(S)); delete old.hew; const m = t.migrate(old); ok(m && m.hew && m.hew.fr === 0 && !m.hew.met, 'old save gets Hew fresh');
const keep = t.migrate(JSON.parse(JSON.stringify(S))); ok(keep.hew.wed && keep.hew.broken === 4, 'Hew state survives a save');
console.log(`hewtest: ${pass} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
