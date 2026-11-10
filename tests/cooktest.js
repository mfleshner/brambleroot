// Headless checks for cooking (PLAN-hew.md Part 1): dishes, the Kitchen tab, eating limits, hearty dishes,
// recipe cards, recipe letters, the Hollow, old saves. Run from tests/ after `python3 extract.py` (needs b.js).
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", "globalThis.__t={get S(){return S},startGame,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},DISHES,ITEMS,FULL_MAX,HEARTY,COOK_MIN,cookDish,eatDish,fedToday,mailMorning,migrate,enterHollow,sleepNow:typeof sleepNow==='function'?sleepNow:null,VILLAGERS,get bt(){return brewTab},set bt(v){brewTab=v},set mt(v){marketTab=v},RECIPE_LETTERS,dayKey};\n})();");
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem:k => store[k] ?? null, setItem:(k, v) => store[k] = String(v), removeItem:k => delete store[k] };
eval(src); const t = __t; t.startGame(false); const S = t.S; while (t.sheet) t.closeSheet();
let pass = 0, bad = 0; const ok = (c, m) => { if (c) pass++; else { bad++; console.log('FAIL', m); } };
const body = () => document.getElementById('shBody').innerHTML, clean = h => !/undefined|NaN|\[object/.test(h);
const close = () => { while (t.sheet) t.closeSheet(); };

// data
const D = t.DISHES, ids = Object.keys(D);
ok(ids.length === 21, 'twenty-one dishes (17 + 4 festival recipes)');
for (const id of ids) { const d = D[id], cost = Object.entries(d.need).reduce((a, [k, n]) => a + t.ITEMS[k].sell * n, 0);
  ok(Object.keys(d.need).every(k => t.ITEMS[k]) && d.energy >= 15 && d.energy <= 50, 'dish data ' + id);
  ok(t.ITEMS[id] && t.ITEMS[id].dish && t.ITEMS[id].sell < cost, `${id} sells for less than its ingredients (${t.ITEMS[id].sell} < ${cost})`); }
ok(ids.filter(id => D[id].from === 'start').length === 3 && ids.filter(id => typeof D[id].from === 'number').length === 10 && Object.keys(t.RECIPE_LETTERS).length === 4, 'three starters, ten cards, four letters');
ok(Object.values(t.RECIPE_LETTERS).every(L => D[L.id] && D[L.id].from === Object.keys(t.RECIPE_LETTERS).find(v => t.RECIPE_LETTERS[v] === L)), 'letters match their dishes');

// new game knows the starters
ok(['minnowfry', 'minttea', 'berrytoast'].every(id => S.recipes[id]) && Object.keys(S.recipes).length === 3, 'starters known');

// kitchen tab
t.bt = 'kitchen'; t.openSheet('cauldron'); let h = body();
ok(/Kitchen/.test(document.getElementById('shTitle') ? document.getElementById('shTitle').textContent : 'Kitchen') && /Minnow Fry/.test(h) && /data-act="btab"/.test(h) && /18 more recipes/.test(h) && clean(h), 'kitchen tab lists recipes');
ok(/data-act="cook" data-id="minnowfry" type="button" disabled/.test(h), 'cook disabled without fish'); close();
t.bt = 'cauldron'; t.openSheet('cauldron'); h = body(); ok(/data-act="brew"/.test(h) && /Kitchen/.test(h), 'cauldron tab still there'); close();

// cooking
S.inv.minnow = 5; const t0 = S.time; ok(t.cookDish('minnowfry') && S.inv.minnowfry === 1 && S.inv.minnow === 3 && S.time === t0 + t.COOK_MIN, 'cooking uses fish and 10 minutes');
ok(!t.cookDish('troutsup'), 'cannot cook an unknown recipe');
S.inv.minnow = 0; ok(!t.cookDish('minnowfry'), 'cannot cook without ingredients');

// eating
S.energy = S.maxEnergy; ok(t.eatDish('minnowfry') === null && S.inv.minnowfry === 1, "not hungry at full energy");
S.energy = 50; ok(t.eatDish('minnowfry') === 20 && S.energy === 70 && t.fedToday() === 1, 'eating gives energy');
S.inv.minnowfry = 3; S.energy = S.maxEnergy - 5; ok(t.eatDish('minnowfry') === 5 && S.energy === S.maxEnergy, 'never past max');
S.energy = 10; ok(t.eatDish('minnowfry') === null && t.fedToday() === 2 && S.inv.minnowfry === 2, 'full after two a day');
S.fed = { k:'old', n:2 }; ok(t.fedToday() === 0, 'fullness resets with the day');
S.recipes.hotpot = true; S.inv.hotpot = 2; S.energy = S.maxEnergy; S.fed = null; ok(t.eatDish('hotpot') === t.HEARTY && S.energy === S.maxEnergy + t.HEARTY, 'hearty goes past max');
ok(t.eatDish('hotpot') === null, 'not past hearty cap');

// eating in the Hollow, but not cooking
S.fed = null; S.energy = 40; S.inv.minnow = 4; S.inv.minnowfry = 1; S.scene = 'wood'; S.spells = ['firebolt']; S.manaMax = 30; t.enterHollow(1); close();
ok(S.scene === 'hollow' && !t.cookDish('minnowfry') && S.inv.minnow === 4, 'no cooking in the Hollow');
ok(t.eatDish('minnowfry') === 20, 'eating in the Hollow');
t.bt = 'kitchen'; t.openSheet('cauldron'); h = body(); ok(/stove is at home/.test(h) && /data-act="cook" data-id="minnowfry" type="button" disabled/.test(h) && clean(h), 'kitchen in the Hollow says so'); close();
S.scene = 'farm';

// recipe cards in the market
S.coins = 1000; t.mt = 'buy'; t.openSheet('market'); h = body(); ok(/Recipe cards/.test(h) && /Recipe: Trout Supper/.test(h) && !/Slime Jelly Tart/.test(h.replace(/Recipe: Slime/, 'X')) === !!S.hollowMax && clean(h), 'market sells recipe cards'); close();
const hm = S.hollowMax; S.hollowMax = 0; t.openSheet('market'); ok(!/Slime Jelly Tart/.test(body()), 'jelly tart only once she has been in the Hollow'); close(); S.hollowMax = hm;

// letters: Isolde's kitchen letter, then recipe letters at 3 hearts
S.sent = {}; S.mail = []; S.year = 2; S.season = 0; S.day = 5; t.mailMorning([]);
ok(S.mail.some(m => m.id === 'kitchen' && m.from === 'isolde'), 'Isolde writes about the stove');
S.fr = Object.assign(S.fr || {}, { wren:300, fen:300, hettie:300, mara:300 }); t.mailMorning([]);
const rl = S.mail.filter(m => m.gift && m.gift.kind === 'recipe'); ok(rl.length === 4, 'four recipe letters at 3 hearts: ' + rl.length);
const before = Object.keys(S.recipes).length; S.mail.forEach(m => { if (m.gift && m.gift.kind === 'recipe') S.recipes[m.gift.id] = true; }); ok(Object.keys(S.recipes).length === before + 4, 'recipe letters teach recipes');
const n0 = S.mail.length; t.mailMorning([]); ok(S.mail.length === n0, 'once each');

// old saves
const old = JSON.parse(JSON.stringify(S)); delete old.recipes; delete old.fed; const m = t.migrate(old);
ok(m && m.recipes.minnowfry && m.recipes.berrytoast && Object.keys(m.recipes).length === 3, 'old save gets the starters');
const keep = t.migrate(JSON.parse(JSON.stringify(S))); ok(keep.recipes.honeycake && keep.recipes.hotpot, 'recipes survive a save');
console.log(`cooktest: ${pass} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
