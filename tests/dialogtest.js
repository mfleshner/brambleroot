// Headless checks for the dialog overhaul (Nov 9, 2026): DIALOG, ROMANCE_MORE, crush/engaged pools, sayLine's no-repeat memory.
// Run from a folder holding b.js (python3 extract.py) and sim7.js.
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8')
  .replace('function celebrate(v, mood, line) {', 'function celebrate(v, mood, line) { globalThis.__said = line;')
  .replace("requestAnimationFrame(frame);\n})();", "globalThis.__t={get S(){return S},startGame,endDay,VILLAGERS,VIDS,ROMANCE,DIALOG,ROMANCE_MORE,HEW_TALK,HEW_GOSSIP,VISIT_LINES,talkTo,visitLine,sayLine,hasCrush,heartsOf,hewTalk,romanceMorning,canRomance,FEST,HEART_LETTERS};\n})();");
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = v, removeItem: k => delete store[k] };
eval(src); const t = __t; t.startGame(true); const S = t.S;
let pass = 0, bad = 0; const ok = (c, m) => { if (c) pass++; else { bad++; console.log('FAIL', m); } };
const ROM = ['mara', 'odile', 'wren', 'rowan', 'silas', 'theo', 'isolde', 'juno', 'zara'];
const say = v => { const f = S.fr[v]; delete S.talked[v]; t.talkTo(v); S.fr[v] = f; return globalThis.__said; }; // keep hearts fixed
const reset = () => { S.dating = null; S.spouse = null; S.wedding = null; S.rain = false; S.heard = {}; if (S.hew) { S.hew.met = false; S.hew.dating = false; S.hew.wed = false; } };

// 1. data shape and quality
const all = [];
for (const v of t.VIDS) {
  const D = t.DIALOG[v]; ok(D, 'DIALOG for ' + v); if (!D) continue;
  ok(D.t.length === 3 && D.t.every(a => a.length >= 12), v + ' tiers');
  ok(D.s.length === 4 && D.s.every(a => a.length >= 4), v + ' seasons');
  ok(D.rain.length >= 4 && D.visit.length >= 8, v + ' rain/visit');
  ok(t.VILLAGERS[v].talk.every(a => a.length >= 14), v + ' talk tiers now 14+');
  all.push(...t.VILLAGERS[v].talk.flat(), ...D.s.flat(), ...D.rain, ...D.visit, t.VISIT_LINES[v]);
}
for (const v of ROM) {
  const R = t.ROMANCE[v];
  ok(R.crush.length >= 12 && R.engaged.length >= 8, v + ' crush/engaged');
  ok(R.date.length >= 18 && R.wed.length >= 21 && R.morn.length >= 10, v + ' date/wed/morn');
  all.push(...R.crush, ...R.engaged, ...R.date, ...R.wed, ...R.morn);
}
for (const k in t.HEW_TALK) { ok(t.HEW_TALK[k].length >= 15, 'hew ' + k); all.push(...t.HEW_TALK[k]); }
all.push(...t.HEW_GOSSIP);
ok(t.HEW_GOSSIP.length >= 22, 'gossip 22+');
const dup = all.filter((l, i) => all.indexOf(l) !== i);
ok(dup.length === 0, 'no duplicate lines: ' + dup.slice(0, 3).join(' | '));
for (const l of all) {
  ok(typeof l === 'string' && l.length >= 8 && l.length <= 240, 'length: ' + l);
  ok(!/undefined|\{n\}|  /.test(l), 'clean: ' + l);
  ok((l.match(/"/g) || []).length % 2 === 0, 'balanced quotes: ' + l);
}
ok(!all.some(l => /\bPip\b[^.]*\b(he|his|him|she|her)\b/.test(l) && /Pip (got|said|says) /.test(l) && /\b(he|she) /.test(l)), 'Pip stays "they"');

// 2. ordinary chat: tiers, seasons, rain
reset();
S.fr.fen = 0; S.season = 0;
const fen0 = new Set(); for (let i = 0; i < 200; i++) fen0.add(say('fen'));
ok([...fen0].every(l => t.VILLAGERS.fen.talk[0].includes(l) || t.DIALOG.fen.s[0].includes(l)), 'fen at 0 hearts: tier 0 + spring only');
ok(t.DIALOG.fen.s[0].every(l => fen0.has(l)), 'spring lines show in spring');
ok(fen0.size === t.VILLAGERS.fen.talk[0].length + t.DIALOG.fen.s[0].length, 'every tier-0 line reached: ' + fen0.size);
S.season = 3; const winter = new Set(); for (let i = 0; i < 200; i++) winter.add(say('fen'));
ok(!t.DIALOG.fen.s[0].some(l => winter.has(l)) && t.DIALOG.fen.s[3].some(l => winter.has(l)), 'winter lines in winter, not spring');
ok(!t.DIALOG.fen.rain.some(l => winter.has(l)), 'no rain lines when dry');
S.rain = true; const wet = new Set(); for (let i = 0; i < 200; i++) wet.add(say('fen'));
ok(t.DIALOG.fen.rain.every(l => wet.has(l)), 'rain lines when wet'); S.rain = false;
S.fr.fen = 700; const fen2 = new Set(); for (let i = 0; i < 200; i++) fen2.add(say('fen'));
ok(t.DIALOG.fen.t[2].every(l => fen2.has(l)) && !t.VILLAGERS.fen.talk[0].some(l => fen2.has(l)), 'tier 2 at 7 hearts');

// 3. no repeats: with a 10-line pool, the last 6 are skipped
reset(); S.fr.fen = 0; S.season = 0;
let rep = 0; const seq = []; for (let i = 0; i < 300; i++) { const l = say('fen'); if (seq.slice(-6).includes(l)) rep++; seq.push(l); }
ok(rep === 0, 'no line repeats within 6 chats (' + rep + ')');

// 4. crushes
reset(); S.season = 1;
for (const v of t.VIDS) S.fr[v] = 550;
for (const v of t.VIDS) {
  const got = new Set(); for (let i = 0; i < 120; i++) got.add(say(v));
  const R = t.ROMANCE[v], crush = R && R.crush ? R.crush.filter(l => got.has(l)).length : 0;
  if (ROM.includes(v)) ok(crush >= 4, v + ' shows crush lines at 5 hearts (' + crush + ')');
  else ok(!R || !R.crush, v + ' (friend only) has no crush pool');
}
for (const v of ROM) S.fr[v] = 450;
ok(ROM.every(v => !t.hasCrush(v, t.heartsOf(v))), 'no crush below 5 hearts');
for (const v of ROM) S.fr[v] = 550;
S.dating = 'rowan';
ok(!ROM.filter(v => v !== 'rowan').some(v => t.hasCrush(v, t.heartsOf(v))), 'no crushes while she dates someone');
const others = new Set(); for (let i = 0; i < 100; i++) others.add(say('mara'));
ok(!t.ROMANCE.mara.crush.some(l => others.has(l)), 'mara: no crush lines while she dates rowan');
reset(); S.hew = S.hew || {}; S.hew.dating = true;
ok(!ROM.some(v => t.hasCrush(v, t.heartsOf(v))), 'no crushes while she dates Hew'); reset();

// 5. partners
for (const v of ROM) {
  reset(); S.fr[v] = 900; S.dating = v;
  const d = new Set(); for (let i = 0; i < 150; i++) d.add(say(v));
  ok(t.ROMANCE[v].date.filter(l => d.has(l)).length >= 8, v + ' dating lines');
  ok(!t.ROMANCE[v].crush.some(l => d.has(l)), v + ' no crush lines once dating');
  S.wedding = { v, at: 999 };
  const e = new Set(); for (let i = 0; i < 150; i++) e.add(say(v));
  ok(t.ROMANCE[v].engaged.every(l => e.has(l)), v + ' engaged lines');
  S.wedding = null; S.dating = null; S.spouse = v;
  const w = new Set(); for (let i = 0; i < 200; i++) w.add(say(v));
  ok(t.ROMANCE[v].wed.filter(l => w.has(l)).length >= 11, v + ' married lines');
  ok(!t.ROMANCE[v].date.some(l => w.has(l)), v + ' no dating lines once married');
  const m = new Set(); for (let i = 0; i < 300; i++) { const L = []; t.romanceMorning(L); if (L[0]) m.add(L[0].t); }
  ok(t.ROMANCE[v].morn.filter(l => m.has(l)).length >= 5, v + ' mornings (' + t.ROMANCE[v].morn.filter(l => m.has(l)).length + ')');
}

// 6. garden visit greetings
reset();
for (const v of t.VIDS) { const g = new Set(); for (let i = 0; i < 60; i++) g.add(t.visitLine(v)); ok(g.size >= 5, v + ' visit lines (' + g.size + ')'); }
S.dating = 'juno'; S.fr.juno = 900; const jv = new Set(); for (let i = 0; i < 80; i++) jv.add(t.visitLine('juno'));
ok(t.ROMANCE.juno.date.some(l => jv.has(l)), 'dating partner sometimes greets with a dating line');

// 7. Hew
reset(); S.hew.met = true; S.hew.fr = 0;
const hw = new Set(); for (let i = 0; i < 80; i++) { S.hew.talked = null; S.hew.fr = 0; hw.add(t.hewTalk()); }
ok(t.HEW_TALK.nemesis.every(l => hw.has(l)), 'hew nemesis lines all reachable (' + hw.size + ')');

// 8. the save stays small after two years of daily chats with everyone
reset();
for (let d = 0; d < 224; d++) { S.season = (d / 28 | 0) % 4; S.rain = d % 5 === 0; for (const v of t.VIDS) { S.fr[v] = Math.min(800, d * 4); say(v); } }
const heard = JSON.stringify(S.heard);
ok(heard.length < 2500, 'S.heard stays small: ' + heard.length + ' bytes');
ok(!/undefined|null/.test(heard), 'S.heard clean');

console.log(`dialogtest: ${pass} passed, ${bad} failed; ${all.length} chat/romance/Hew lines checked`);
{ const z = require('zlib'), full = JSON.stringify(S), s2 = JSON.parse(full); delete s2.heard;
  const a = z.deflateRawSync(full).length, b = z.deflateRawSync(JSON.stringify(s2)).length;
  console.log(`save code: ${b} -> ${a} bytes compressed (+${a - b}) after two years of daily chats`); }
