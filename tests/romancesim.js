// Headless checks for villager plan part 2: 10 hearts, dating, the kind goodbye, the ring, the wedding and married life.
// Run from tests/ after `python3 extract.py` (needs b.js).
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", "globalThis.__t={get S(){return S},startGame,endDay,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},VILLAGERS,VIDS,ROMANCE,WED_LINES,inValley,heartsOf,heartMax,canRomance,isPartner,talkTo,giveGift,addFr,giveBouquet,kindGoodbye,propose,romanceBox,maybeWedding,showWedding,finishWedding,absDay,weddingAt,dateOf,SPOUSE_HELP,romanceMorning,genVisits,hearts,ITEMS,itemValue,migrate,festRender,isFestDay,bouquetOnSale};\n})();");
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = v, removeItem: k => delete store[k] };
eval(src); const t = __t; t.startGame(true); const S = t.S;
const body = () => document.getElementById('shBody').innerHTML, wed = () => document.getElementById('wed').innerHTML;
let pass = 0, bad = 0; const ok = (c, m) => { if (c) pass++; else { bad++; console.log('FAIL', m); } };
const ROM = t.VIDS.filter(t.canRomance), FRIENDS = t.VIDS.filter(v => !t.canRomance(v));
const clean = h => !/undefined|NaN|\[object/.test(h);
const sleep = () => { if (t.sheet) t.closeSheet(); t.endDay(false); };

// 1. who can be romanced
ok(ROM.join() === 'mara,odile,wren,rowan,silas,theo,isolde,juno,zara', 'nine romanceable: ' + ROM.join());
ok(FRIENDS.join() === 'fen,pip,hettie,aldous,bertram,tilly,rosa,corin,marigold', 'nine friend-only: ' + FRIENDS.join());
for (const v of ROM) { const R = t.ROMANCE[v]; ok(R && ['yes', 's9', 's10', 'bye', 'propose', 'vow', 'bday'].every(k => typeof R[k] === 'string' && R[k].length > 20) && R.date.length >= 2 && R.wed.length >= 3 && R.morn.length >= 2 && t.SPOUSE_HELP[v], 'romance text for ' + v); }
for (const v of t.VIDS) if (v !== 'aldous') ok(t.WED_LINES[v], 'wedding guest line for ' + v);

// 2. hearts cap at 8 and show padlocks until dating
S.year = 2; // everyone has arrived
for (const v of t.VIDS) S.fr[v] = 850;
ok(t.VIDS.every(v => t.heartsOf(v) === 8), 'everyone tops out at 8 hearts');
t.addFr('mara', 300); ok(S.fr.mara === 850 && t.heartsOf('mara') === 8, 'romanceable stays at 8 before dating');
ok((t.hearts(8, 'mara').match(/class="lock"/g) || []).length === 2, 'two padlocks for a romanceable villager');
ok(/lock/.test(t.hearts(8, 'fen')) && (t.hearts(8, 'fen').match(/<i /g) || []).length === 8, 'a friend shows 8 hearts and two padlocks (best friends, Nov 10, 2026)');
ok(t.bouquetOnSale(), 'bouquet on sale once someone is at 6+ hearts');

// 3. bouquet: friends and kids can't take one; 8 hearts needed
S.inv.bouquet = 3;
t.giveBouquet('fen'); ok(!S.dating && S.inv.bouquet === 3, 'Old Fen can\'t be asked out');
t.giveBouquet('pip'); ok(!S.dating, 'Pip can\'t be asked out');
S.fr.odile = 790; t.giveBouquet('odile'); ok(!S.dating, 'odile below 8 hearts says no');
S.fr.odile = 850;
t.giveBouquet('mara'); ok(S.dating === 'mara' && S.inv.bouquet === 2 && t.sheet === 'scene', 'mara accepts the bouquet');
ok(clean(body()) && /lock/.test(body()) === false, 'dating scene renders, no padlocks once dating');
t.closeSheet();
t.giveBouquet('odile'); ok(S.dating === 'mara' && S.inv.bouquet === 2, 'only one person at a time');
ok(t.heartMax('mara') === 10 && t.heartMax('odile') === 8, 'hearts 9 and 10 open only for mara');
// dating scenes at 9 and 10 through ordinary chat (the 2-8 heart scenes already seen)
for (const l of [2, 4, 6, 8]) S.scenes['mara' + l] = true;
t.addFr('mara', 60); S.talked = {}; t.talkTo('mara'); ok(t.heartsOf('mara') === 9 && t.sheet === 'scene' && body().includes('top of the mill'), '9-heart dating scene');
t.closeSheet(); t.addFr('mara', 100); S.talked = {}; t.talkTo('mara'); ok(t.heartsOf('mara') === 10 && body().includes('heart cut into the crust'), '10-heart dating scene');
t.closeSheet(); ok(S.fr.mara === 1050, 'friendship caps at 1050 while dating');

// 4. the kind goodbye costs no friendship
t.kindGoodbye('mara'); ok(!S.dating && S.fr.mara === 1050 && t.heartsOf('mara') === 8, 'goodbye: points kept, hearts back to 8');
t.closeSheet();
t.addFr('mara', 20); ok(S.fr.mara === 1050, 'a chat after the goodbye never trims the kept points');
t.addFr('mara', -40); ok(S.fr.mara === 1010, 'a disliked gift still costs the usual amount');
t.giveBouquet('mara'); ok(S.dating === 'mara' && t.heartsOf('mara') === 10, 'dating mara again brings hearts 9 and 10 straight back');
t.closeSheet(); t.kindGoodbye('mara'); t.closeSheet();

// 5. villager pages render in every romance state
for (const v of t.VIDS) { t.openSheet('villager', { v }); ok(clean(body()), 'page ' + v + ' (single)'); t.closeSheet(); }
t.giveBouquet('rowan'); t.closeSheet();
for (const v of t.VIDS) { t.openSheet('villager', { v }); const h = body(); ok(clean(h), 'page ' + v + ' (dating rowan)'); if (v === 'odile') ok(h.includes("You're seeing Rowan"), 'others mention who you\'re seeing'); t.closeSheet(); }
t.openSheet('goodbye', { v:'rowan' }); ok(clean(body()) && body().includes('data-act="byeyes"'), 'goodbye confirm sheet'); t.closeSheet();
t.openSheet('cauldron'); ok(/Witch's Ring/.test(body()), 'ring recipe shows at the cauldron while dating'); t.closeSheet();

// 6. proposal: ring at 10 hearts, wedding date rules
S.fr.rowan = 950; S.inv.ring = 1; t.propose('rowan'); ok(!S.wedding && S.inv.ring === 1, 'no proposal below 10 hearts');
S.fr.rowan = 1050;
const at = (sea, day) => { S.season = sea; S.day = day; return t.weddingAt() - t.absDay(); };
ok(at(0, 12) === 2, 'day 12: wedding at the festival on day 14');
ok(at(0, 5) === 3, 'day 5: wedding 3 days later');
ok(at(0, 14) === 3 && at(0, 27) === 3, 'on or after festival day: 3 days later');
ok(at(0, 11) === 3, 'day 11: 3 days later lands on the festival anyway');
S.season = 1; S.day = 26; const d0 = t.absDay(); // wedding crosses into autumn
t.propose('rowan'); ok(S.wedding && S.wedding.v === 'rowan' && S.wedding.at === d0 + 3 && S.inv.ring === 0, 'proposal accepted, wedding in 3 days');
ok(clean(body()) && body().includes('Autumn 1'), 'engaged scene names the date across the season change');
t.closeSheet();
t.openSheet('villager', { v:'rowan' }); ok(body().includes("You're engaged") && !body().includes('data-act="goodbye"'), 'engaged page, no goodbye button'); t.closeSheet();
sleep(); sleep(); ok(!S.spouse && t.sheet === 'morning', 'not married yet the day before');
t.closeSheet(); ok(t.sheet === null, 'no wedding before the day');
sleep(); ok(S.season === 2 && S.day === 1, 'wedding morning is autumn 1');
ok(body().includes('wedding day'), 'morning sheet says it\'s the wedding day');
t.closeSheet(); ok(t.sheet === 'wedding' && clean(wed()) && wed().includes(t.ROMANCE.rowan.vow.slice(2, 30)), 'wedding overlay after the morning sheet, with vows');
t.closeSheet(); ok(t.sheet === 'wedding', 'wedding can\'t be dismissed by closing a sheet');
t.showWedding(2); ok(clean(wed()) && wed().includes('Walk home together'), 'wedding part two');
t.finishWedding(); ok(S.spouse === 'rowan' && !S.dating && !S.wedding && S.weddingDay && S.weddingDay.s === 2 && S.weddingDay.d === 1 && t.sheet === null, 'married');

// 7. married life, two years
let helped = 0, greeted = 0, inGarden = 0, mornings = 0, ann = 0;
const f0 = S.fr.rowan; S.inv.wolf = 5; S.gifted = {}; t.giveGift('rowan', 'mudcat'); S.inv.mudcat = 1; S.gifted = {}; t.giveGift('rowan', 'mudcat');
ok(S.fr.rowan === f0, 'a disliked gift never lowers a spouse\'s friendship');
for (let d = 0; d < 224; d++) {
  sleep(); mornings++;
  const h = body(); if (!clean(h)) ok(false, 'morning sheet clean, day ' + S.day);
  if (/Rowan was out before dawn/.test(h)) helped++;
  if (/withpor"><svg class="por"[^]*?aria-label="Rowan"/.test(h)) greeted++;
  if (/anniversary/.test(h)) ann++;
  if ((S.visits || []).some(x => x.v === 'rowan' && x.spouse)) inGarden++;
  if (t.isFestDay()) ok(clean(t.festRender()), 'festival renders when married');
}
t.closeSheet();
ok(greeted === mornings, `spouse greets every morning (${greeted}/${mornings})`);
ok(helped / mornings > .5 && helped / mornings < .7, `spouse helps about 60% of days (${Math.round(helped / mornings * 100)}%)`);
ok(inGarden / mornings > .65, `spouse in the garden most days (${Math.round(inGarden / mornings * 100)}%, festivals excluded)`);
ok(ann === 2, 'two anniversaries in two years: ' + ann);
for (const v of t.VIDS) { t.openSheet('villager', { v }); ok(clean(body()) && !body().includes('data-act="bouquet"'), 'page ' + v + ' (married)'); t.closeSheet(); }
ok(!t.bouquetOnSale(), 'no bouquets for sale once married');
S.inv.bouquet = 1; S.fr.odile = 850; t.giveBouquet('odile'); ok(S.dating === null, 'no dating while married');

// 8. every spouse's help works, and Zara stays home
for (const v of t.VIDS) S.fr[v] = Math.min(S.fr[v], 500);
for (const v of ROM) { const before = JSON.stringify([S.inv, S.seeds, S.energy, S.mana, S.can, S.fr]); S.spouse = v; const m = t.SPOUSE_HELP[v](); ok(typeof m === 'string' && clean(m), `help text for ${v}: ${m}`); ok(v === 'rowan' || before !== JSON.stringify([S.inv, S.seeds, S.energy, S.mana, S.can, S.fr]), `help from ${v} changes something`); }
S.spouse = 'zara'; let away = 0; for (let d = 1; d <= 28; d++) { S.day = d; if (!t.inValley('zara')) away++; } ok(away === 0, 'married Zara is home every day');

// 9. saves keep it all
const back = t.migrate(JSON.parse(JSON.stringify(S)));
ok(back.spouse === 'zara' && back.weddingDay && back.weddingDay.s === 2, 'save round trip keeps the marriage');
const old = JSON.parse(JSON.stringify(S)); for (const k of ['dating', 'wedding', 'spouse', 'weddingDay', 'romanceTip']) delete old[k];
const m2 = t.migrate(old); ok(m2.spouse === null && m2.dating === null && m2.wedding === null, 'a pre-update save loads with no romance');

console.log(`${pass} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
