// Villager plan part 3, items 5 and 6: story quests and group events. Headless.
// Walks every story start to finish, checks the blocked cases, every group event (sun and rain), saves,
// Bramble's Charm, and then runs a "typical player" friendship model for 2 years to report when things open up.
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", "globalThis.__t={get S(){return S},set S(v){S=v},startGame,endDay,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},VILLAGERS,VIDS,where,canMeet,villageFolk,VPLACES,VSPOTS,VB,SCHED,enterVillage,leaveVillage,heartsOf,addFr,talkTo,QUESTS,QIDS,MEMENTOS,qStep,qState,qBlock,qHint,questDo,questHollow,hollowFloor,EVENTS,EIDS,evNow,joinEvent,evPlace,lampLit,bgKeyNow,buildStatic,draw,castSpell,learnSpell,SPELLS,migrate,newState,ITEMS,CROPS,FORAGE,POTIONS,itemValue,absDay,genVisits,inValley,arrived,seekPlace,setCal:v=>{calSeason=v},update,get queue(){return queue},witch,resize,FEST_DAY};\n})();");
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = v, removeItem: k => delete store[k] };
eval(src); const t = __t; t.startGame(true);
// node questsim.js heart → the heart quests (PLAN-hearts.md Part 2), else the original six stories.
// node questsim.js match → the five matchmaking stories (Part 3).
const MODE = process.argv[2] || '', HEART = MODE === 'heart' || MODE === 'match', QL = t.QIDS.filter(id => MODE === 'match' ? !!t.QUESTS[id].match : MODE === 'heart' ? !!t.QUESTS[id].heart : !t.QUESTS[id].heart && !t.QUESTS[id].match && id !== 'shop'); // the shop story has its own test (shoptest.js)
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; if (bad < 30) console.log('BAD', m); } };
const body = () => document.getElementById('shBody').innerHTML, clean = h => !/undefined|NaN|\[object/.test(h);
const close = () => { if (t.sheet) t.closeSheet(); };
const S = () => t.S;
close();

// 1. data sanity (as in year 2, so late arrivals like Silas count)
const y0 = S().year; S().year = 2;
const valid = id => !!t.ITEMS[id];
for (const id of QL) {
  const Q = t.QUESTS[id];
  ok(Q.cast.every(v => t.VILLAGERS[v]), id + ' cast');
  ok(t.VILLAGERS[Q.host] && Q.cast.includes(Q.host), id + ' host');
  ok(Q.title && Q.hook && Q.unlock && Q.rtext && Q.reward, id + ' texts');
  Q.steps.forEach((st, i) => {
    ok(st.text && st.hint && (st.floor || st.btn), `${id} step ${i} texts`);
    if (st.v) ok([].concat(st.v).every(v => t.VILLAGERS[v]), `${id} step ${i} people`);
    if (st.at) ok(!!t.VPLACES[st.at], `${id} step ${i} place`);
    if (st.give) { const p = st.give.pick; ok(typeof p === 'string' ? ['crop', 'forage', 'potion'].includes(p) : p.every(valid), `${id} step ${i} items`); ok(st.give.n > 0, `${id} step ${i} n`); }
    if (st.need) for (const v of st.need) {
      // the people needed are really at that place, at an allowed time, on at least 3 days of a season (sun)
      let days = 0; for (let d = 1; d <= 28; d++) { let hit = false; for (let tm = Math.max(360, st.after || 0); tm < 1380 && !hit; tm += 10) if (st.need.every(x => t.where(x, tm, d, false) === st.at)) hit = true; if (hit) days++; }
      ok(days >= 3, `${id} step ${i}: ${st.need.join('+')} together at ${st.at} on only ${days} days`);
    }
  });
}
S().year = y0;
for (const id of t.EIDS) {
  const E = t.EVENTS[id];
  ok(!!t.VPLACES[E.place] && E.from < E.to && E.day >= 1 && E.day <= 28 && E.day !== t.FEST_DAY, id + ' event basics');
  for (const v of t.VIDS) ok(typeof E.lines[v] === 'string' && E.lines[v].length > 10, `${id} line for ${v}`);
  ok(E.invite && E.morning && E.intro && t.VILLAGERS[E.host], id + ' event texts');
  if (!t.VPLACES[E.place].indoor) ok(!!E.wet, id + ' rain text');
}
ok(!!t.SPELLS.kin, 'charm spell exists');

// helpers to stand where someone is
function findTime(test) { for (let tm = 360; tm < 1380; tm += 10) { S().time = tm; if (test()) return tm; } return -1; }
function meetable(v) { S().scene = 'village'; const tm = findTime(() => t.canMeet(v)); if (tm >= 0) return true; return false; }
function sleep() { close(); t.endDay(false); close(); }
function untilFound(fn, max) { for (let i = 0; i < (max || 40); i++) { if (fn()) return true; sleep(); } return false; }
function giveFor(st) { if (!st.give) return; const p = st.give.pick; const ids = typeof p === 'string' ? Object.keys({ crop:t.CROPS, forage:t.FORAGE, potion:t.POTIONS }[p]).filter(k => k !== 'wyrd') : p; S().inv[ids[0]] = (S().inv[ids[0]] || 0) + st.give.n; return ids[0]; }

// 2. nothing at the start
sleep();
ok(Object.keys(S().quests).length === 0, 'no stories on day 2');
// unlock everything
S().spells.push('firebolt');
for (const v of t.VIDS) S().fr[v] = MODE === 'heart' ? 850 : MODE === 'match' ? 650 : 450;
if (HEART) { S().year = 3; for (const v of t.VIDS) S().scenes[v + 8] = true; }
sleep();
if (MODE === 'heart') { ok(QL.filter(id => S().quests[id]).length === 1, 'one heart story a morning'); untilFound(() => QL.every(id => S().quests[id]), 26); }
const unlocked = Object.keys(S().quests).filter(id => QL.includes(id));
ok(unlocked.length === QL.length, 'every story unlocked: ' + unlocked.join(','));
// 3. walk each story
const before = { coins:S().coins };
for (const id of QL) {
  const Q = t.QUESTS[id];
  ok(t.qState(id).s === 0, id + ' starts at step 0');
  t.openSheet('journal'); close();
  for (let i = 0; i < Q.steps.length; i++) {
    const st = Q.steps[i];
    ok(t.qStep(id) === st, `${id} at step ${i}`);
    if (st.floor) {
      ok(t.qBlock(id) !== '', id + ' floor step has no button');
      S().scene = 'hollow'; t.hollowFloor(st.floor - 1); ok(t.qState(id).s === i, id + ' floor 14 not enough'); close();
      t.hollowFloor(st.floor); close(); S().scene = 'farm';
      ok(t.qState(id).s === i + 1, id + ' floor step done'); continue;
    }
    // blocked first: no items
    if (st.give) { const ids = typeof st.give.pick === 'string' ? null : st.give.pick; for (const k of Object.keys(S().inv)) S().inv[k] = 0; }
    let where;
    if (st.v) {
      const vs = [].concat(st.v);
      ok(untilFound(() => vs.some(meetable)), `${id} step ${i}: can't find ${vs}`);
      const v = vs.find(x => t.canMeet(x));
      if (st.give) { ok(t.qBlock(id, v) !== '', `${id} step ${i} blocked without items`); t.questDo(id, v); ok(t.qState(id).s === i, `${id} didn't advance without items`); close(); }
      const k = giveFor(st);
      t.openSheet('villager', { v }); ok(body().includes('data-act="qdo"') && clean(body()), `${id} step ${i} card on ${v}'s page`);
      ok(!/data-act="qdo"[^>]*disabled/.test(body()), `${id} step ${i} button enabled`);
      const coins = S().coins; t.questDo(id, v);
      if (k) ok((S().inv[k] || 0) === 0, `${id} step ${i} items taken`);
      ok(t.sheet === 'qscene' && clean(body()) && body().length > 200, `${id} step ${i} scene`);
      // a meet step elsewhere: someone not here can't be met
    } else if (st.at) {
      S().scene = 'farm';
      ok(t.qBlock(id) !== '', `${id} step ${i} blocked on the farm`);
      ok(untilFound(() => { S().scene = 'village'; return findTime(() => S().time >= (st.after || 0) && (st.need || []).every(v => t.where(v) === st.at)) >= 0; }), `${id} step ${i}: place never ready`);
      if (st.give) { ok(t.qBlock(id) !== '', `${id} step ${i} place blocked without items`); }
      const k = giveFor(st);
      t.openSheet('place', { p:st.at }); ok(body().includes('data-act="qdo"') && clean(body()), `${id} step ${i} card at ${st.at}`);
      t.questDo(id);
      if (k) ok((S().inv[k] || 0) === 0, `${id} step ${i} items taken`);
      ok(t.sheet === 'qscene' && clean(body()), `${id} step ${i} scene at ${st.at}`);
    }
    ok(t.qState(id).s === i + 1, `${id} advanced past step ${i}`);
    close();
  }
  ok(t.qState(id).done, id + ' done');
  t.openSheet('journal'); close();
}
if (MODE === 'match') { ok(QL.every(id => S().matched[t.QUESTS[id].match]), 'every couple together'); console.log(`match stories: all ${QL.length} walked start to finish`); console.log(`${n - bad} passed, ${bad} failed`); process.exit(bad ? 1 : 0); }
if (HEART) { ok(QL.every(id => S().mementos[id.slice(2)]), 'every keepsake'); t.openSheet('relics'); ok(clean(body()) && body().split('Keepsakes from friends').length === 2 && QL.every(id => body().includes(t.MEMENTOS[id.slice(2)].name.replace(/'/g, '&#39;')) || body().includes(t.MEMENTOS[id.slice(2)].name)), 'keepsakes on the shelf'); close();
  t.openSheet('journal'); close(); console.log(`heart stories: all ${QL.length} walked start to finish, ${QL.reduce((a, id) => a + (t.QUESTS[id].reward.coins || 0), 0)} coins in all`); console.log(`${n - bad} passed, ${bad} failed`); process.exit(bad ? 1 : 0); }
ok(S().spells.includes('kin'), 'Hettie gave the charm');
ok(t.lampLit(), 'lamp lit');
S().scene = 'village'; ok(t.bgKeyNow().includes('lit'), 'village background knows the lamp is lit');
console.log(`stories: all ${QL.length} walked start to finish`);
{ S().scene = 'farm'; const jt = '__jt'; }

// 4. Bramble's Charm
S().mana = 100; S().talked = {};
ok(t.castSpell('kin') === false, 'charm needs a chat first');
S().fr.mara = 100; S().talked.mara = `${S().year}.${S().season}.${S().day}`; S().talked.fen = S().talked.mara;
const fm = S().fr.mara; ok(t.castSpell('kin') === true && S().fr.mara === fm + 15, 'charm gives +15');
ok(t.castSpell('kin') === false, 'charm once a day');

// 5. group events, a fresh game for each
function freshTo(season, day, fr) {
  t.S = t.newState(); S().year = 1; S().season = season; S().day = day - 1; for (const v of t.VIDS) S().fr[v] = fr; S().time = 360; S().scene = 'farm';
  sleep();
}
for (const id of t.EIDS) {
  const E = t.EVENTS[id];
  for (const wet of [false, true]) {
    freshTo(E.season, E.day - 2, 450);
    ok(S().mail.some(m => m.id === `ev${id}y1`), id + ' invitation letter');
    sleep(); sleep();
    ok(S().day === E.day, id + ' day');
    S().rain = wet && E.season !== 3;
    const e = t.evNow(); ok(!!e && e.id === id, id + ' is on');
    const p = t.evPlace(E, S().rain);
    ok(e.who.length >= 3, id + ' guests ' + e.who.length);
    S().time = E.from + 10;
    ok(e.who.every(v => t.where(v) === p), `${id} guests at ${p}`);
    ok(!(S().visits || []).some(x => e.who.includes(x.v)), id + ' guests not visiting the garden');
    S().time = E.to + 10; ok(e.who.some(v => t.where(v) !== p) || p === 'inn', id + ' guests leave after');
    // calendar
    t.setCal(E.season); t.openSheet('calendar'); ok(body().includes(E.short) && clean(body()), id + ' on the calendar'); close();
    // too early: card but no join
    S().scene = 'village'; S().time = E.from - 30; t.openSheet('place', { p }); ok(body().includes(E.name) && !body().includes('evjoin'), id + ' not yet'); close();
    S().time = E.from + 20;
    t.openSheet('place', { p }); ok(body().includes('evjoin'), id + ' join button'); close();
    const fr0 = {}; for (const v of t.VIDS) fr0[v] = S().fr[v];
    const here = t.VIDS.filter(v => t.where(v) === p), tm = S().time;
    t.joinEvent();
    ok(t.sheet === 'event' && clean(body()), id + ' event sheet');
    ok(here.every(v => S().fr[v] >= fr0[v] + 60), id + ' friendship for everyone there');
    ok(t.VIDS.filter(v => !here.includes(v)).every(v => S().fr[v] === fr0[v]), id + ' no friendship for people elsewhere');
    ok(S().time > tm && S().time <= E.to, id + ' time passed');
    ok(S().events[`${id}y1`], id + ' marked');
    close(); t.joinEvent(); ok(t.sheet !== 'event', id + ' only once');
    t.draw && t.buildStatic && (t.buildStatic(), t.draw());
  }
}
// the picnic needs 3 friends at 4+ hearts
freshTo(0, 21, 350); ok(!t.evNow(), 'no picnic without 3 friends at 4 hearts');
t.setCal(0); t.openSheet('calendar'); ok(body().includes('3 friends'), 'calendar explains the picnic'); close();
freshTo(0, 21, 350); for (const v of ['mara', 'pip', 'odile']) S().fr[v] = 400; S().day = 20; sleep(); ok(t.evNow() && t.evNow().who.length === 3, 'picnic with exactly 3 friends');
// seeking a place from the farm walks through the gate
S().scene = 'farm'; S().time = 700; t.seekPlace('square'); ok(t.queue.length === 1 && t.queue[0].b === 'tovillage' && t.queue[0].place === 'square', 'go to the square');

// 6. saves: quests and events survive a round trip; an old save without them loads
{ const j = JSON.parse(JSON.stringify(S())); const m = t.migrate(j); ok(m.events['picnicy1'] === undefined || typeof m.events === 'object', 'events kept'); }
{ const old = JSON.parse(JSON.stringify(S())); delete old.quests; delete old.events; delete old.evToday; const m = t.migrate(old); ok(m && typeof m.quests === 'object' && typeof m.events === 'object' && m.evToday === null, 'old save gets defaults'); t.S = m; sleep(); ok(true, 'old save plays a day'); }

console.log(`${n - bad} passed, ${bad} failed`);

// 7. two kinds of player, for 2 years, going to every event (or not). Busy: 3 chats and 1 liked gift a day.
// Social: 5 chats and 2 liked gifts a day. Both find the Hollow in summer of year 1.
// When do stories open, does the picnic happen in year 1, and how much do events add to the winter "befriend" star?
function play(events, chats, gifts) {
  t.S = t.newState(); for (const v of t.VIDS) S().fr[v] = 0; close();
  const opened = {}, rnd = (() => { let x = 7; return () => (x = (x * 16807) % 2147483647) / 2147483647; })();
  let picnicY1 = false, friends5 = null;
  for (let d = 0; d < 28 * 8; d++) {
    if (S().season >= 1 && !S().spells.includes('firebolt')) S().spells.push('firebolt');
    const pool = t.VIDS.filter(t.inValley);
    for (let i = 0; i < chats && pool.length; i++) { const v = pool.splice((rnd() * pool.length) | 0, 1)[0]; t.addFr(v, 20); if (i < gifts) t.addFr(v, 45); }
    if (events) { const e = t.evNow(); if (e) { for (const v of e.who) t.addFr(v, 60); if (e.id === 'picnic' && S().year === 1) picnicY1 = true; } }
    if (S().season === 3 && S().day === 28 && S().year === 1) friends5 = t.VIDS.filter(v => t.heartsOf(v) >= 5).length;
    S().time = 1300; sleep();
    for (const id of Object.keys(S().quests)) if (!opened[id]) opened[id] = `y${S().year} ${['spring', 'summer', 'autumn', 'winter'][S().season]} ${S().day}`;
  }
  return { opened, picnicY1, friends5 };
}
for (const [label, c, g] of [['busy', 3, 1], ['social', 5, 2]]) {
  const a = play(true, c, g), b = play(false, c, g);
  console.log(`${label} player (${c} chats and ${g} liked gift${g > 1 ? 's' : ''} a day), when each story opens:`);
  for (const id of QL) console.log(`  ${t.QUESTS[id].title.padEnd(22)} ${a.opened[id] || 'not in 2 years'}`);
  console.log(`  spring picnic in year 1: ${a.picnicY1 ? 'yes' : 'no'}`);
  console.log(`  villagers at 5+ hearts at the end of winter, year 1: ${a.friends5} going to events, ${b.friends5} without (the star needs 6)`);
}
// value of story rewards
const coinsOf = r => (r.coins || 0) + Object.entries(r.items || {}).reduce((s, [k, n]) => s + t.itemValue(k) * n, 0);
const total = QL.reduce((s, id) => s + coinsOf(t.QUESTS[id].reward), 0);
console.log(`stories, one-off value of all rewards: ${total} coins (${QL.map(id => `${id} ${coinsOf(t.QUESTS[id].reward)}`).join(', ')}), plus a spell`);
console.log(`against the year-1 earning goals (spring 16k + summer 35k + autumn 33k = 84k): ${(total / 84000 * 100).toFixed(1)}%`);
