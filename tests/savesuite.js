const { chromium, devices } = require('playwright'); const fs = require('fs');
const KEY='brambleroot-save-v1', URL0='file://' + process.cwd() + '/local.html';
const results=[]; const ok=(name, cond, extra='') => { results.push([cond?'PASS':'FAIL', name, extra]); };
(async () => {
  const save = fs.readFileSync('shot-save.json','utf8');
  const cloud = {}; let pushes = 0;  // stateful mock Firestore
  const b = await chromium.launch(); const errs = [];
  const mk = async (dev='iPhone 13') => { const ctx = await b.newContext({ ...devices[dev], acceptDownloads:true });
    await ctx.route('**/firestore.googleapis.com/**', r => { const u = new URL(r.request().url()); const name = decodeURIComponent(u.pathname.split('/').pop());
      if (r.request().method() === 'PATCH') { cloud[name] = JSON.parse(r.request().postData()); pushes++; return r.fulfill({ status:200, body:'{}' }); }
      return cloud[name] ? r.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(cloud[name]) }) : r.fulfill({ status:404, body:'{}' }); });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(URL0); await p.waitForTimeout(300); return p; };
  const closeSheets = async p => { for (let i=0;i<10 && await p.isVisible('#sheet');i++) { await p.tap('#shClose').catch(()=>{}); await p.waitForTimeout(80); } };
  const st = p => p.evaluate(k => { const s = JSON.parse(localStorage.getItem(k) || 'null'); return s && { day:s.day, season:s.season, year:s.year, coins:s.coins, cloud:s.cloud && s.cloud.name }; }, KEY);
  const restoreVia = async (box, text) => { const p = await mk(); await p.tap('#tRestore'); await p.waitForTimeout(150); await p.fill(box, text);
    await p.tap(box === '#cloudIn' ? '[data-act="cloudload"]' : '[data-act="restore"]'); await p.waitForTimeout(1300); return p; };

  // 1. new game autosaves, survives reload, Continue restores it
  let p = await mk(); await p.tap('text=Begin'); await p.waitForTimeout(2200); await closeSheets(p);
  const s1 = await st(p); ok('new game saves to the phone', !!s1, JSON.stringify(s1));
  ok('new game gets a cloud name and uploads', !!(s1 && s1.cloud && cloud[s1.cloud]), s1 && s1.cloud);
  await p.tap('#bSleep'); await p.waitForTimeout(150); await p.tap('[data-act="sleep"]').catch(()=>{}); await p.waitForTimeout(1500); await closeSheets(p);
  const s1b = await st(p); ok('sleeping saves the next day', s1b && s1b.day === 2, 'day ' + (s1b && s1b.day));
  await p.reload(); await p.waitForTimeout(400);
  ok('after reload, Continue is offered', (await p.textContent('#titleBtns')).includes('Continue'));
  // 2. sitting on the title screen and leaving doesn't overwrite the save
  await p.evaluate(() => { dispatchEvent(new Event('pagehide')); document.dispatchEvent(new Event('visibilitychange')); }); await p.reload(); await p.waitForTimeout(300);
  const s2 = await st(p); ok('title screen never overwrites the save', s2 && s2.day === 2 && s2.cloud === s1.cloud);
  await p.tap('#tContinue'); await p.waitForTimeout(400); await closeSheets(p); ok('Continue loads day 2', (await p.textContent('#dayLbl')).includes('2'));
  const myName = s1.cloud; await p.context().close();

  // 3. cloud restore by name on a "new phone", including messy typing
  for (const typed of [myName, myName.toUpperCase().replace(/-/g, ' '), '  ' + myName + '  ']) {
    p = await restoreVia('#cloudIn', typed); const s = await st(p);
    ok(`cloud restore by name typed as "${typed.trim()}"`, s && s.day === 2 && s.cloud === myName, JSON.stringify(s)); await p.context().close();
  }
  // cloud restore keeps pushing under the SAME name (no duplicate cloud saves)
  p = await restoreVia('#codeIn', myName); const before = pushes; await closeSheets(p); await p.waitForTimeout(2200);
  ok('restored-from-cloud game keeps the same cloud name', (await st(p)).cloud === myName && Object.keys(cloud).length === 1, Object.keys(cloud).join(','));
  await p.close();

  // 4. old-game (artifact) save: code in either box, prefix case, line breaks, extra words around it
  p = await mk(); await p.evaluate(([k, s]) => localStorage.setItem(k, s), [KEY, save]); await p.reload(); await p.waitForTimeout(300);
  await p.tap('#tContinue'); await p.waitForTimeout(300); await closeSheets(p);
  await p.tap('#bSleep'); await p.tap('[data-act="backup"]'); await p.waitForTimeout(800);
  const code = await p.inputValue('#codeOut');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.tap('[data-act="savefile"]')]); const fpath = 'suite-' + dl.suggestedFilename(); await dl.saveAs(fpath);
  await p.context().close();
  const json = JSON.stringify(JSON.parse(save));
  const b1 = 'BRAMBLE1:' + Buffer.from(unescape(encodeURIComponent(json)), 'binary').toString('base64');
  const variants = { 'code as copied':code, 'lowercase "bramble2:"':'bramble2:' + code.slice(9), 'code with line breaks (Telegram)':code.replace(/(.{60})/g, '$1\n'),
    'code with words around it':'here is my save: ' + code + ' thanks!', 'old BRAMBLE1 code':b1, 'raw JSON save':json };
  for (const [label, text] of Object.entries(variants)) for (const box of ['#codeIn', '#cloudIn']) {
    p = await restoreVia(box, text); const s = await st(p);
    ok(`${label} -> ${box === '#codeIn' ? 'code box' : 'name box'}`, s && s.season === 1 && s.day === 14, s ? `${s.season}/${s.day}` : (await p.textContent('#shBody')).slice(0, 80));
    await p.context().close();
  }
  // imported old save gets its own new cloud name and uploads
  p = await restoreVia('#codeIn', code); await closeSheets(p); await p.waitForTimeout(2200); const si = await st(p);
  ok('imported old save gets a cloud name and uploads', !!(si.cloud && cloud[si.cloud] && si.cloud !== myName), si.cloud); await p.context().close();

  // 5. backup file (iPhone + Android) restores
  for (const dev of ['iPhone 13', 'Pixel 7']) { p = await mk(dev); await p.tap('#tRestore'); await p.setInputFiles('#fileIn', fpath); await p.waitForTimeout(800);
    ok(`backup file restores on ${dev}`, (await st(p) || {}).day === 14); await p.context().close(); }

  // 6. bad input: friendly error, existing save untouched
  p = await mk(); await p.evaluate(([k, s]) => localStorage.setItem(k, s), [KEY, save]); await p.reload(); await p.waitForTimeout(300);
  for (const [label, text] of [['empty box', ''], ['garbage', 'hello there'], ['half a code', code.slice(0, 1200)], ['unknown name', 'moss-fern-owl-42']]) {
    await p.tap('#tRestore'); await p.waitForTimeout(150); await p.fill('#codeIn', text); await p.tap('[data-act="restore"]'); await p.waitForTimeout(800);
    const msg = (await p.textContent('#shBody')); const s = await st(p);
    ok(`${label}: friendly error, save untouched`, s && s.day === 14 && /didn't work|No cloud save/.test(msg), msg.match(/(That|No cloud)[^.]*\./)?.[0]);
    await p.tap('#shClose'); await p.waitForTimeout(100);
  }
  fs.writeFileSync('notasave.txt', 'hi'); await p.tap('#tRestore'); await p.setInputFiles('#fileIn', 'notasave.txt'); await p.waitForTimeout(500);
  ok('wrong file: friendly error, save untouched', (await st(p)).day === 14 && (await p.textContent('#shBody')).includes("isn't a Brambleroot save"));
  await p.context().close();

  // 7. cloud offline: game still saves locally, no crash
  p = await mk(); await p.context().unroute('**/firestore.googleapis.com/**'); await p.context().route('**/firestore.googleapis.com/**', r => r.abort());
  await p.tap('text=Begin'); await p.waitForTimeout(2200); await closeSheets(p); const so = await st(p);
  ok('no internet: still saves on the phone', !!so); await p.tap('#bSleep'); await p.tap('[data-act="backup"]'); await p.waitForTimeout(300);
  ok('no internet: backup screen says the last try failed', (await p.textContent('#shBody')).includes("didn't work"));
  await p.context().close();

  for (const r of results) console.log(r[0], r[1], r[2] ? '  (' + String(r[2]).slice(0, 70) + ')' : '');
  console.log(`\n${results.filter(r => r[0] === 'PASS').length}/${results.length} passed; page errors:`, errs.length ? errs : 'none');
  await b.close();
})();
