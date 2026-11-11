// Year-2 newcomers (PLAN-hearts.md Part 4). Run from a folder with b.js.
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", "globalThis.__t={get S(){return S},set S(x){S=x},startGame,endDay,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},VILLAGERS,VIDS,arrived,arrivedBy,inValley,heartsOf,where,talkTo,giveGift,postRequests,migrate,NEWCOMER_HI,FEST,EVENTS,BFF,BFF_HELP,MEMENTOS,QUESTS,HEART_LETTERS,BDAY_NOTES,THANKS,WED_LINES,VISIT_SPOT,VISIT_STAND,VISIT_LINES,SCHED,DIALOG,genVisits,portrait,canRomance,setCal:x=>{calSeason=x},setJTab:x=>{journalTab=x}};\n})();");
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = v, removeItem: k => delete store[k] };
eval(src); const t = __t; t.startGame(true); let S = t.S;
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; if (bad < 40) console.log('BAD', m); } };
const body = () => document.getElementById('shBody').innerHTML, clean = h => !/undefined|NaN|\[object/.test(h);
const close = () => { if (t.sheet) t.closeSheet(); };
close();
const NEW = ['rosa', 'corin', 'marigold'], WHEN = { rosa:0, corin:1, marigold:2 };
ok(t.VIDS.length === 18, '18 villagers');
for (const v of NEW) {
  const V = t.VILLAGERS[v];
  ok(V.arriveY === 2 && V.arrive === WHEN[v], v + ' arrives in year 2, season ' + WHEN[v]);
  ok(!t.canRomance(v), v + ' is friend-only');
  ok(t.NEWCOMER_HI[v] && t.NEWCOMER_HI[v][1].length > 100, v + ' hello letter');
  for (let i = 0; i < 4; i++) ok(typeof t.FEST[i].lines[v] === 'string', `${v} festival ${i} line`);
  ok(typeof t.FEST[0].dance[v] === 'string', v + ' dance line');
  for (const e of ['picnic', 'bonfire', 'supper']) ok(typeof t.EVENTS[e].lines[v] === 'string', `${v} ${e} line`);
  ok(t.BFF[v] && t.BFF_HELP[v] && t.MEMENTOS[v] && t.QUESTS['h_' + v], v + ' best friend, keepsake and heart story');
  ok(t.HEART_LETTERS[v] && t.BDAY_NOTES[v] && t.THANKS[v] && t.WED_LINES[v] && t.VISIT_LINES[v], v + ' letters and lines');
  ok(t.VISIT_SPOT[v] && t.VISIT_STAND[v] && t.SCHED[v], v + ' visit tiles and schedule');
  for (const m of ['neutral', 'happy', 'sad', 'love']) ok(clean(t.portrait(v, m, 60)), `${v} portrait ${m}`);
}
// visit tiles unique
const tiles = t.VIDS.filter(v => !NEW.includes(v)).flatMap(v => [String(t.VISIT_SPOT[v]), String(t.VISIT_STAND[v])]);
for (const v of NEW) { ok(!tiles.includes(String(t.VISIT_SPOT[v])) && !tiles.includes(String(t.VISIT_STAND[v])), v + ' visit tiles free'); tiles.push(String(t.VISIT_SPOT[v]), String(t.VISIT_STAND[v])); }

// year 1: nobody new, the list teases them
S.year = 1; S.season = 2; S.day = 10; S.time = 600;
for (const v of NEW) { ok(!t.arrived(v) && !t.inValley(v), v + ' not here in year 1'); ok(t.where(v) === 'away' || t.where(v) === 'home', v + ' not placed in year 1: ' + t.where(v)); }
t.setJTab('village'); t.openSheet('journal'); ok(/Someone new/.test(body()) && /of year 2/.test(body()) && !/Rosa/.test(body()), 'year-1 list teases someone new in year 2'); close();
// story requests in year 1 never come from newcomers
for (let i = 0; i < 30; i++) { S.reqs = []; t.postRequests([]); ok(!S.reqs.some(q => NEW.includes(q.v)), 'no newcomer requests in year 1'); }
// walk year 2 season by season
S.year = 2; S.season = 0; S.day = 1; S.sent = {}; S.letters = S.letters || [];
for (let s = 0; s < 4; s++) {
  S.season = s; S.day = 3;
  for (const v of NEW) ok(t.arrived(v) === (WHEN[v] <= s), `${v} arrived in year 2 season ${s}: ${t.arrived(v)}`);
  close(); t.endDay(false); close();
  for (const v of NEW) ok(!!S.sent['hi' + v] === (WHEN[v] <= s), `${v} hello sent by season ${s}`);
  // story requests can come from arrived newcomers
  let seen = {};
  for (let i = 0; i < 60; i++) { S.reqs = []; S.day = 10; for (const v of t.VIDS) S.steps[v] = NEW.includes(v) && WHEN[v] >= s ? 0 : 9; t.postRequests([]); for (const q of S.reqs) seen[q.v] = 1; }
  for (const v of NEW) if (WHEN[v] === s) ok(seen[v], `${v} posts a story request in arrival season ${s}`);
  for (const v of NEW) if (WHEN[v] > s) ok(!seen[v], `${v} no requests before arriving`);
}
// year 3: everyone, no story requests from newcomers
S.year = 3; S.season = 0; S.day = 10;
for (const v of NEW) ok(t.arrived(v), v + ' here in year 3');
for (let i = 0; i < 30; i++) { S.reqs = []; for (const v of NEW) S.steps[v] = 0; t.postRequests([]); const q = S.reqs.find(q => NEW.includes(q.v) && !q.odd); ok(!q, 'no newcomer story requests in year 3 ' + JSON.stringify(q)); }
// chat and gifts work, and the village list and calendar render
for (const v of NEW) { S.talked[v] = null; const before = S.fr[v]; t.talkTo(v); ok(S.fr[v] > before, v + ' chat gives friendship'); }
t.setJTab('village'); for (const k of ['journal', 'calendar']) { t.openSheet(k); ok(clean(body()), k + ' renders cleanly'); close(); }
S.year = 1; S.season = 3; t.setCal(3); t.openSheet('calendar'); ok(/next year/.test(body()), 'calendar says new faces come next year'); ok(!/Marigold/.test(body()), 'no Marigold birthday in year 1'); close();
S.year = 2; S.season = 3; t.setCal(3); t.openSheet('calendar'); ok(/Marigold/.test(body()), 'Marigold birthday shows once she is here'); close();
// garden visits include them over a year
let vis = {}; S.year = 3;
for (let d = 0; d < 112; d++) { S.season = (d / 28) | 0; S.day = d % 28 + 1; t.genVisits(); for (const x of S.visits) vis[x.v] = 1; }
for (const v of NEW) ok(vis[v], v + ' visits the garden');
// old save shape: migrate fills newcomers
const old = JSON.parse(JSON.stringify(S)); for (const v of NEW) { delete old.fr[v]; delete old.steps[v]; delete old.hearts[v]; }
const m = t.migrate(old); ok(NEW.every(v => m.fr[v] === 0 && m.steps[v] === 0), 'migrate fills newcomer maps');
console.log(`nctest: ${n - bad}/${n} newcomer checks passed`);
