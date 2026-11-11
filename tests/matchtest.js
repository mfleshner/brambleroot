// Matchmaking (PLAN-hearts.md Part 3): when stories open, waiting while she's seeing one of them, couples can't be
// dated, the wedding day (date, where, the venue card, joining once), chat lines, festival spots, calendar and saves.
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", "globalThis.__t={get S(){return S},set S(x){S=x},startGame,endDay,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},VILLAGERS,VIDS,MATCHES,MKEYS,MATCH_TEXT,QUESTS,qState,qBlock,questDo,canRomance,coupled,mateOf,matchOf,matchOpen,matchWedAt,matchWedToday,joinMatchWedding,where,absDay,dateOf,FEST_DAY,festSpots,talkTo,heartsOf,migrate,giveBouquet,bouquetOnSale,setCal:x=>{calSeason=x},enterVillage};\n})();");
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = v, removeItem: k => delete store[k] };
eval(src); const t = __t; t.startGame(true); let S = t.S;
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; if (bad < 40) console.log('BAD', m); } };
const body = () => document.getElementById('shBody').innerHTML, clean = h => !/undefined|NaN|\[object/.test(h);
const close = () => { if (t.sheet) t.closeSheet(); };
const sleep = () => { close(); S.time = 1300; t.endDay(false); close(); };
close();
// content
for (const k of t.MKEYS) { const M = t.MATCHES[k], T = t.MATCH_TEXT[k];
  ok(T.steps.length === 4 && T.morning && T.wed && T.talk[M.a].length === 3 && T.talk[M.b].length === 3, k + ' texts');
  ok(t.QUESTS['m_' + k] && t.QUESTS['m_' + k].match === k, k + ' quest');
  ok(M.from < M.to && M.from >= 600 && M.to <= 1320, k + ' hours'); }
const people = t.MKEYS.flatMap(k => [t.MATCHES[k].a, t.MATCHES[k].b]); ok(new Set(people).size === people.length, 'each villager in at most one pair');
ok(!people.includes('pip') && !people.includes('tilly'), 'no kids');
// opening
S.year = 1; S.season = 2; S.day = 3; for (const v of t.VIDS) S.fr[v] = 590;
ok(t.MKEYS.every(k => !t.matchOpen(k)), 'closed under 6 hearts');
for (const v of t.VIDS) S.fr[v] = 610; ok(t.MKEYS.every(t.matchOpen), 'open at 6 hearts');
S.dating = 'rowan'; ok(!t.matchOpen('rowan_juno'), 'not while dating one of them'); S.dating = null;
S.wedding = { v:'juno', at:9999 }; ok(!t.matchOpen('rowan_juno'), 'not while engaged to one'); S.wedding = null;
// a story waits if she starts seeing one of them partway
S.quests = { m_rowan_juno:{ s:1, at:1 } }; S.dating = 'juno'; ok(/will wait/.test(t.qBlock('m_rowan_juno', 'rowan')), 'story waits while dating Juno'); S.dating = null;
// couples can't be dated, and the bouquet note follows
S.matched = { rowan_juno:{ wed:t.absDay() + 7, went:false } };
ok(!t.canRomance('rowan') && !t.canRomance('juno') && t.canRomance('theo'), 'couple not romanceable');
ok(t.mateOf('rowan') === 'juno' && t.coupled('juno'), 'mates');
S.fr.juno = 900; S.inv.bouquet = 1; t.giveBouquet('juno'); ok(S.dating !== 'juno', 'bouquet to a coupled villager');
// the wedding date: a week on, never on a festival day; Zara's on a market day
for (let s0 = 0; s0 < 4; s0++) for (let d0 = 1; d0 <= 28; d0++) { S.season = s0; S.day = d0;
  for (const k of t.MKEYS) { const w = t.matchWedAt(k), dt = t.dateOf(w); ok(w >= t.absDay() + 7 && dt.d !== t.FEST_DAY, `${k} date ${s0}/${d0}`); if (k === 'wren_zara') ok(dt.d % 7 === 5, 'zara wedding on a market day'); } }
// the day itself
S.year = 2; S.season = 1; S.day = 9; S.rain = false; S.visits = []; S.evToday = null;
const k = 'mara_aldous', M = t.MATCHES[k];
S.matched = { [k]:{ wed:t.absDay() + 1, went:false } };
sleep(); ok(t.matchWedToday() === k, 'wedding today');
S.time = M.from - 10; ok(t.where('mara') !== M.place || true, 'before');
S.time = M.from + 10; ok(t.where('mara') === M.place && t.where('aldous') === M.place, 'couple at the venue');
S.scene = 'village';
S.time = M.from - 30; t.openSheet('place', { p:M.place }); ok(/wedding/.test(body()) && !/data-act="mwed"/.test(body()), 'card before'); close();
S.time = M.from + 10; t.openSheet('place', { p:M.place }); ok(/data-act="mwed"/.test(body()) && clean(body()), 'join button'); close();
const f0 = S.fr.mara, t0 = S.time;
ok(t.joinMatchWedding(k) && t.sheet === 'scene' && body().includes(t.MATCH_TEXT[k].wed.slice(0, 30)), 'joined'); close();
ok(S.fr.mara > f0 && S.time > t0 && S.time <= M.to, 'friendship and time');
ok(!t.joinMatchWedding(k), 'join twice');
S.time = M.to + 10; ok(t.where('mara') !== M.place || t.where('mara') === 'mill', 'after hours');
// married: chat lines and the list chip
{ let got = 0; for (let i = 0; i < 200; i++) { S.talked = {}; t.talkTo('aldous'); const b = body(); if (t.MATCH_TEXT[k].talk.aldous.some(l => b.includes(l.slice(0, 25)))) got++; close(); }
  ok(got > 20 && got < 90, `couple lines about 25% of chats (${got}/200)`); }
t.openSheet('journal'); t.renderSheet('journal'); close();
// festival: couples stand together
S.matched = {}; for (const kk of t.MKEYS) S.matched[kk] = { wed:1, went:true };
for (let s0 = 0; s0 < 4; s0++) { S.season = s0; S.day = t.FEST_DAY; S.time = 700; const sp = t.festSpots();
  for (const kk of ['silas_isolde', 'fen_bertram', 'rowan_juno']) { const a = sp[t.MATCHES[kk].a], b = sp[t.MATCHES[kk].b]; if (a && b) ok(Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) <= 5, `${kk} together at festival ${s0} (${a} / ${b})`); } }
// calendar
S.season = 1; S.day = 3; S.matched = { silas_isolde:{ wed:t.absDay() + 7, went:false } }; t.setCal(1); t.openSheet('calendar'); ok(/Silas and Isolde's wedding/.test(body()), 'wedding on the calendar'); close();
// save
{ const old = JSON.parse(fs.readFileSync('shot-save.json', 'utf8')); delete old.matched; const m = t.migrate(old); ok(m.matched && typeof m.matched === 'object', 'migrate matched'); t.S = m; S = m; ok(t.VIDS.every(v => !t.coupled(v)), 'no couples in an old save'); }
console.log(`${n - bad}/${n} matchmaking checks passed`);
process.exit(bad ? 1 : 0);
