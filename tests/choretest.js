// Headless checks for the Nov 8 garden requests: silver sprinkler heads, the trowel, and the notice board staying open.
// Run from tests/ after `python3 extract.py` (needs b.js).
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", "globalThis.__t={get S(){return S},startGame,endDay,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},doField,predict,enqueue,get queue(){return queue},plotIdx,UPGRADES,upCost,CROPS,VILLAGERS,addFr,heartsOf,migrate};\n})();");
const noop = () => {}; const ctxP = new Proxy({}, { get:(t, k) => k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop:noop }) : k === 'measureText' ? () => ({ width:10 }) : (typeof k === 'string' ? noop : undefined), set:() => true });
const els = {}; const el = () => { const o = { style:{}, hidden:false, textContent:'', innerHTML:'', dataset:{}, scrollTop:0, on:{}, getBoundingClientRect:() => ({ height:60 }), querySelector:() => null, getContext:() => ctxP, firstChild:{} }; o.addEventListener = (k, f) => { o.on[k] = f; }; return o; };
globalThis.Image = function () { return { complete:false, naturalWidth:0 }; };
globalThis.document = { getElementById:id => els[id] || (els[id] = el()), createElement:() => el(), addEventListener:noop };
Object.assign(globalThis, { window:globalThis, innerWidth:390, innerHeight:844, devicePixelRatio:2, matchMedia:() => ({ matches:false }), addEventListener:noop, requestAnimationFrame:noop, cancelAnimationFrame:noop, performance:{ now:() => 0 }, setTimeout:() => {}, clearTimeout:noop });
const store = {}; globalThis.localStorage = { getItem:k => store[k] ?? null, setItem:(k, v) => store[k] = v, removeItem:k => delete store[k] };
eval(src); const t = __t; t.startGame(true); const S = t.S;
const body = () => els.shBody.innerHTML;
// Press a sheet button the way her finger would: find it in the rendered HTML, then run the real click handler.
function press(act, extra) {
  const re = new RegExp(`<button[^>]*data-act="${act}"[^>]*>`, 'g'); const tags = body().match(re) || [];
  const tag = tags.find(x => !extra || x.includes(extra)); if (!tag) return false;
  const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = m[2];
  const b = { dataset:ds, disabled:/ disabled/.test(tag), closest:() => b };
  els.shBody.on.click({ target:b }); return true;
}
let pass = 0, bad = 0; const ok = (c, m) => { if (c) pass++; else { bad++; console.log('FAIL', m); } };
const clean = h => !/undefined|NaN|\[object/.test(h);
const P = (c, r) => S.plots[t.plotIdx(c, r)];
const wipe = () => { for (const p of S.plots) Object.assign(p, { t:0, w:false, c:null, d:0, ready:false, s:false, b:false }); };
const sleep = () => { if (t.sheet) t.closeSheet(); t.endDay(false); S.rain = false; };

// ---------- 1. silver sprinkler heads ----------
const H = t.UPGRADES.sprhead;
ok(H && H.cost === 1000 && H.season === 1, 'silver heads upgrade exists, 1,000 coins, from summer');
ok(/four beds/.test(t.UPGRADES.sprinkler.desc), 'brass sprinkler says four beds before the upgrade');
S.coins = 5000; t.openSheet('market'); press('tab', 'data-id="upgrades"');
ok(!body().includes('Silver sprinkler heads'), 'heads hidden in year 1 spring');
S.season = 1; t.renderSheet('market'); ok(body().includes('Silver sprinkler heads') && clean(body()), 'heads on sale in summer');
// place a sprinkler at (4,6), till everything around it
wipe(); S.nextRain = false; S.rain = false;
for (let c = 3; c <= 5; c++) for (let r = 5; r <= 7; r++) P(c, r).t = 1;
P(4, 6).s = true; P(4, 6).t = 0;
t.closeSheet(); sleep();
const wet = () => [[3, 5], [4, 5], [5, 5], [3, 6], [5, 6], [3, 7], [4, 7], [5, 7]].filter(([c, r]) => P(c, r).w).length;
ok(wet() === 4 && P(4, 5).w && P(3, 6).w && !P(3, 5).w, 'brass sprinkler waters the 4 beds beside it');
t.openSheet('market'); press('tab', 'data-id="upgrades"'); press('up', 'data-id="sprhead"');
ok(S.up.sprhead && S.coins === 4000, 'buying the heads costs 1,000 and sets S.up.sprhead');
ok(/all 8 beds/.test(t.UPGRADES.sprinkler.desc), 'brass sprinkler text now says all 8 beds');
t.renderSheet('market'); ok(/Silver sprinkler heads<\/span>[\s\S]*?Owned/.test(body()) || body().includes('Owned'), 'heads show as owned');
for (const p of S.plots) p.w = false;
sleep();
ok(wet() === 8, 'with silver heads it waters all 8 beds around it');
// corner of the field: no out-of-bounds trouble
wipe(); P(1, 3).s = true; P(2, 3).t = 1; P(1, 4).t = 1; P(2, 4).t = 1; sleep();
ok(P(2, 3).w && P(1, 4).w && P(2, 4).w, 'corner sprinkler waters its 3 in-field beds');
S.sprinklers = 2; t.openSheet('seeds'); ok(/all 8 beds around it/.test(body()), 'seed pouch mentions 8 beds');
const mi = t.migrate(JSON.parse(JSON.stringify(S))); ok(mi.up.sprhead === true, 'heads survive a save round trip');

// ---------- 2. the trowel ----------
wipe(); S.season = 0; S.energy = 100;
t.openSheet('seeds'); ok(body().includes('data-id="trowel"') && clean(body()), 'trowel row in the seed pouch');
press('sel', 'data-id="trowel"'); ok(S.sel === 'trowel' && !t.sheet, 'selecting the trowel closes the pouch');
P(2, 4).t = 1; P(2, 4).c = 'mint'; P(2, 4).d = 0;          // just planted
P(3, 4).t = 1; P(3, 4).c = 'ember'; P(3, 4).d = 2; P(3, 4).w = true; P(3, 4).b = true; // growing, blessed
P(4, 4).t = 1; P(4, 4).c = 'mint'; P(4, 4).d = 3; P(4, 4).ready = true; // ripe
P(5, 4).t = 1;                                                  // empty soil
P(6, 4).s = true;                                               // a sprinkler
ok(t.predict(P(2, 4)) === 'dig' && t.predict(P(3, 4)) === 'dig', 'trowel digs planted beds');
ok(t.predict(P(4, 4)) === 'harvest', 'trowel on a ripe crop harvests it instead');
ok(t.predict(P(5, 4)) === 'nodig', 'trowel on empty soil does nothing');
ok(t.predict(P(6, 4)) === 'pickup', 'trowel on a sprinkler still picks it up');
const mint0 = S.seeds.mint || 0, e0 = S.energy;
t.doField(2, 4); ok(!P(2, 4).c && P(2, 4).t && S.seeds.mint === mint0 + 1, 'unsprouted seed goes back in the pouch, bed stays tilled');
const ember0 = S.seeds.ember || 0;
t.doField(3, 4); ok(!P(3, 4).c && !P(3, 4).b && P(3, 4).w && S.seeds.ember === ember0, 'sprouted plant is cleared, no seed back, bed stays watered');
ok(S.energy === e0, 'digging costs no energy');
const inv0 = S.inv.mint || 0; t.doField(4, 4); ok((S.inv.mint || 0) === inv0 + 1, 'ripe mint harvested with the trowel');
// drag never digs, a tap queues
P(2, 5).t = 1; P(2, 5).c = 'mint';
t.enqueue({ c:2, r:5 }, true); ok(!t.queue.length, 'dragging across a plant with the trowel does not dig');
t.enqueue({ c:2, r:5 }, false); ok(t.queue.length === 1, 'tapping a plant with the trowel queues a dig');
// planting again after digging
S.sel = 'mint'; ok(t.predict(P(2, 4)) === 'plant', 'dug bed can be planted again');
// buying seeds keeps the trowel selected
S.sel = 'trowel'; S.coins = 500; t.openSheet('market'); press('tab', 'data-id="buy"'); press('buy', 'data-id="mint"');
ok(S.sel === 'trowel', 'buying seeds does not swap the trowel away'); t.closeSheet();

// ---------- 3. notice board stays open ----------
S.season = 0; S.day = 6;
const vs = ['mara', 'odile', 'fen'];
S.reqs = vs.map((v, i) => ({ v, item:'mint', n:1, text:'Some mint please, ' + v + '.', due:S.day + 3, reward:30 + i, fresh:true }));
S.inv.mint = 10; for (const v of vs) S.fr[v] = 0;
t.openSheet('board'); const coins0 = S.coins;
press('give', 'data-i="1"');
ok(t.sheet === 'board', 'board stays open after giving');
ok(S.coins === coins0 + 31 && S.reqs.length === 2, 'reward paid and request removed');
const order = [...body().matchAll(/<div class="nm">([^<]+)<\/div>/g)].map(m => m[1]);
ok(order.join() === 'Mara,Odile,Old Fen' || order.join() === 'Mara,Odile,Fen', 'thank-you card sits where the request was: ' + order.join());
ok(/Done · thank you!/.test(body()) && clean(body()), 'thank-you card shows');
ok(body().includes('data-act="give" data-i="1"') && body().includes('Old Fen') || body().includes('Fen'), 'remaining buttons re-indexed');
press('give', 'data-i="1"'); // Fen, now index 1
ok(t.sheet === 'board' && S.reqs.length === 1 && S.reqs[0].v === 'mara', 'second give also stays, right person helped');
ok((body().match(/Done · thank you!/g) || []).length === 2, 'two thank-you cards');
press('give', 'data-i="0"');
ok(S.reqs.length === 0 && (body().match(/Done · thank you!/g) || []).length === 3 && !body().includes('Nothing pinned'), 'all three done, thank-yous still shown');
t.closeSheet(); t.openSheet('board');
ok(!body().includes('Done · thank you!') && body().includes('Nothing pinned'), 'reopening the board starts clean');
t.closeSheet();
// a heart scene waits behind a button; Back returns to the board
S.reqs = [{ v:'odile', item:'mint', n:1, text:'Mint?', due:S.day + 2, reward:40, fresh:true }, { v:'mara', item:'mint', n:1, text:'Mint?', due:S.day + 2, reward:40, fresh:true }];
S.fr.odile = 150; delete S.scenes.odile2; S.gifts = S.gifts || {};
t.openSheet('board'); press('give', 'data-i="0"');
ok(t.heartsOf('odile') >= 2 && t.sheet === 'board' && body().includes('data-act="boardscene"'), 'heart scene offered on the thank-you card');
press('boardscene'); ok(t.sheet === 'scene' && body().includes('data-act="boardback"') && clean(body()), 'scene opens with Back to requests');
press('boardback'); ok(t.sheet === 'board' && !body().includes('data-act="boardscene"') && /Done · thank you!/.test(body()) && body().includes('data-act="give" data-i="0"'), 'back on the board, scene button gone, Mara still there');
t.closeSheet();
// gifts at 3 hearts show on the card
S.reqs = [{ v:'mara', item:'mint', n:1, text:'Mint?', due:S.day + 2, reward:40, fresh:true }];
S.fr.mara = 250; S.scenes.mara2 = true; delete S.gifts.mara3; const spr0 = S.sprinklers;
t.openSheet('board'); press('give', 'data-i="0"');
ok(S.sprinklers > spr0 && /class="gift"/.test(body()) && t.sheet === 'board', 'heart gift listed on the thank-you card');

console.log(`choretest: ${pass} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
