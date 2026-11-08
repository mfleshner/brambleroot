// What is a spouse worth? Runs each spouse's real morning help many times per season and values it in coins.
// Value model: coins and items at their sell price, seeds at the price you'd otherwise pay (low) or the crop they grow (high),
// energy and mana at ~3 coins each (from econ4's good-vs-relaxed gap), watered beds at 1 energy each, friendship at 0.
// Run from tests/ after `python3 extract.py`.
const fs = require('fs');
const src = fs.readFileSync('b.js', 'utf8').replace("requestAnimationFrame(frame);\n})();", "globalThis.__t={get S(){return S},startGame,SPOUSE_HELP,SPOUSE_HELP_P,VIDS,canRomance,itemValue,seedPrice:typeof seedPrice==='function'?seedPrice:null,CROPS,RAIN};\n})();");
const sim7 = fs.readFileSync('sim7.js', 'utf8').split('\n').slice(2, 7).join('\n'); eval(sim7);
const store = {}; globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = v, removeItem: k => delete store[k] };
eval(src); const t = __t; t.startGame(true); const S = t.S;
S.year = 2; S.rod = true; S.spells = ['quicken', 'hearth']; S.manaMax = 30; S.hives = 1;
for (const v of t.VIDS) S.fr[v] = 500;
const E = 3, MANA = 3, N = 3000;
const ROM = t.VIDS.filter(t.canRomance);
const plant = s => { const ids = Object.keys(t.CROPS).filter(id => t.CROPS[id].seasons.includes(s)); S.plots.forEach((p, i) => { if (i < 35) Object.assign(p, { t:1, c:ids[i % ids.length], d:0, w:false, ready:false }); }); };
const target1 = [16000, 35000, 33000, 33000], target2 = target1.map(n => n * 1.5), bot = [30436, 71141, 66941, 56310];
const rows = [];
for (const v of ROM) {
  const per = [];
  for (let s = 0; s < 4; s++) {
    let lo = 0, hi = 0;
    for (let i = 0; i < N; i++) {
      S.season = s; S.day = 1 + (i % 28); S.time = 360; plant(s);
      S.rain = Math.random() < t.RAIN[s]; S.snow = s === 3; if (S.rain) for (const p of S.plots) if (p.t) p.w = true;
      S.energy = 100; S.maxEnergy = 100; S.mana = 30; S.can = 5;
      const inv = Object.assign({}, S.inv), seeds = Object.assign({}, S.seeds), c0 = S.coins, can0 = S.can, wet0 = S.plots.filter(p => p.w).length;
      t.SPOUSE_HELP[v]();
      let val = S.coins - c0;
      for (const [k, n] of Object.entries(S.inv)) val += (n - (inv[k] || 0)) * t.itemValue(k);
      val += (S.energy - 100) * E + (S.mana - 30) * MANA + (S.plots.filter(p => p.w).length - wet0) * E + (S.can > can0 ? 2 * E : 0);
      let sLo = 0, sHi = 0;
      for (const [k, n] of Object.entries(S.seeds)) { const d = n - (seeds[k] || 0); if (d > 0) { const cr = t.CROPS[k]; sLo += d * cr.seed; sHi += d * cr.sell * (cr.yield || 1); } }
      lo += val + sLo; hi += val + sHi;
      S.inv = inv; S.seeds = seeds;
    }
    const days = 28 * t.SPOUSE_HELP_P;
    per.push({ lo:lo / N * days, hi:hi / N * days });
  }
  rows.push([v, per]);
}
const pct = (n, d) => (n / d * 100).toFixed(1) + '%';
console.log('Spouse help per season (60% of 28 days), in coins, and as a share of the season\'s 3-star earning goal.');
console.log('Winter has no earning star; autumn\'s 33k is used for it.\n');
console.log('spouse   per season (spring/summer/autumn/winter)     share of year-1 goal       share of year-2 goal');
let all1 = [], all2 = [];
for (const [v, per] of rows) {
  const mid = per.map(p => (p.lo + p.hi) / 2);
  const s1 = mid.map((n, s) => n / target1[s]), s2 = mid.map((n, s) => n / target2[s]);
  all1.push(...s1); all2.push(...s2);
  console.log(v.padEnd(8), mid.map(n => String(Math.round(n)).padStart(5)).join(' '), per.some(p => Math.round(p.hi - p.lo) > 0) ? `(seeds: ${per.map(p => Math.round(p.lo) + '-' + Math.round(p.hi)).join(' ')})` : '', '\n         ', s1.map(x => (x * 100).toFixed(1).padStart(5) + '%').join(''), '   ', s2.map(x => (x * 100).toFixed(1).padStart(5) + '%').join(''));
}
const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
console.log(`\naverage over spouses and seasons: ${(avg(all1) * 100).toFixed(1)}% of the year-1 goal, ${(avg(all2) * 100).toFixed(1)}% of the year-2 goal`);
console.log(`against the idealised econ4 bot (with the Wood and spells): ${(avg(rows.flatMap(([, per]) => per.map((p, s) => (p.lo + p.hi) / 2 / bot[s]))) * 100).toFixed(1)}%`);
