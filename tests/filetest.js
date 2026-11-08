const { chromium, devices } = require('playwright'); const fs = require('fs');
(async () => {
  const save = fs.readFileSync('shot-save.json','utf8');
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['Pixel 7'], acceptDownloads:true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/local.html');
  await p.evaluate(s => localStorage.setItem('brambleroot-save-v1', s), save); await p.reload(); await p.waitForTimeout(300);
  await p.tap('#tContinue'); await p.waitForTimeout(200);
  while (await p.isVisible('#sheet')) { await p.tap('#shClose'); await p.waitForTimeout(100); }
  await p.tap('#bSleep'); await p.tap('[data-act="backup"]'); await p.waitForTimeout(300);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.tap('[data-act="savefile"]')]);
  const path = 'downloaded-' + dl.suggestedFilename(); await dl.saveAs(path);
  console.log('downloaded:', dl.suggestedFilename(), fs.statSync(path).size, 'bytes');
  console.log('message:', (await p.textContent('#shBody')).slice(0, 50));
  await p.screenshot({ path:'s13-backup.png' });
  // fresh browser, nothing saved
  const ctx2 = await b.newContext({ ...devices['Pixel 7'] }); const q = await ctx2.newPage(); q.on('pageerror', e => errs.push(e.message));
  await q.goto('file://' + process.cwd() + '/local.html'); await q.waitForTimeout(300);
  console.log('fresh title:', await q.textContent('#titleBtns'));
  await q.tap('#tRestore'); await q.waitForTimeout(200); await q.screenshot({ path:'s14-restore.png' });
  await q.setInputFiles('#fileIn', path); await q.waitForTimeout(600);
  console.log('after loading file:', await q.textContent('#dayLbl'), '| coins', await q.textContent('#coins'), '| title hidden', await q.isHidden('#title'));
  // a non-save file gives a friendly error
  fs.writeFileSync('notasave.txt', 'hello'); await q.evaluate(() => localStorage.clear()); await q.reload(); await q.waitForTimeout(300);
  await q.tap('#tRestore'); await q.setInputFiles('#fileIn', 'notasave.txt'); await q.waitForTimeout(400);
  console.log('bad file message:', (await q.textContent('#shBody')).includes("isn't a Brambleroot save"));
  console.log('errors:', errs.length ? errs : 'none');
  await b.close();
})();
