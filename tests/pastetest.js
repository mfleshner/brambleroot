const { chromium, devices } = require('playwright'); const fs = require('fs');
(async () => {
  const save = fs.readFileSync('shot-save.json','utf8');
  const b = await chromium.launch(); const errs = [];
  const mk = async () => { const ctx = await b.newContext({ ...devices['iPhone 13'] });
    await ctx.route('**/firestore.googleapis.com/**', r => r.request().method() === 'GET' ? r.fulfill({ status:404, body:'{}' }) : r.fulfill({ status:200, body:'{}' }));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto('file://' + process.cwd() + '/local.html'); await p.waitForTimeout(300); return p; };
  // make a code the way the old game does
  const a = await mk(); await a.evaluate(s => localStorage.setItem('brambleroot-save-v1', s), save); await a.reload(); await a.waitForTimeout(300);
  await a.tap('#tContinue'); await a.waitForTimeout(200); while (await a.isVisible('#sheet')) { await a.tap('#shClose'); await a.waitForTimeout(100); }
  await a.tap('#bSleep'); await a.tap('[data-act="backup"]'); await a.waitForTimeout(800);
  const code = await a.inputValue('#codeOut'); console.log('code starts', code.slice(0, 10), code.length);
  const tryBox = async (box, text, label) => { const p = await mk(); await p.tap('#tRestore'); await p.waitForTimeout(200);
    await p.fill(box, text); await p.tap(box === '#cloudIn' ? '[data-act="cloudload"]' : '[data-act="restore"]'); await p.waitForTimeout(1200);
    const ok = await p.isHidden('#title'); console.log(label.padEnd(34), ok ? 'RESTORED ' + await p.textContent('#dayLbl') : 'msg: ' + (await p.textContent('#shBody')).match(/(No cloud|That |Couldn)[^.]*\./)?.[0]); await p.context().close(); };
  await tryBox('#cloudIn', code, 'code in save-name box');
  await tryBox('#codeIn', code, 'code in code box');
  await tryBox('#codeIn', 'Poppy Reed Vale 75', 'save name in code box');
  await tryBox('#codeIn', 'bramble2:' + code.slice(9), 'lowercase start in code box');
  await tryBox('#cloudIn', 'Bramble2:' + code.slice(9), 'mixed-case start in name box');
  await tryBox('#codeIn', code.toLowerCase(), 'whole code lowercased');
  await tryBox('#cloudIn', 'moss-fern-owl-42', 'unknown name');
  console.log('errors:', errs.length ? errs : 'none'); await b.close();
})();
