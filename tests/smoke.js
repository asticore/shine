// Cross-browser smoke test for dist/shine.css.
// Usage: node tests/smoke.js [chromium|firefox|webkit ...]   (default: chromium)
// Needs Playwright with the requested browsers installed.
const fs = require('fs');
const path = require('path');
const playwright = require('playwright');

const root = path.join(__dirname, '..');
const page = path.join(root, 'dist', '_smoke.html');
const B = ['primary', 'secondary', 'accent', 'success', 'warning', 'danger', 'info'];

const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="shine.css"></head><body>
<div data-radius="5"><button id="btn" class="btn">Button</button><div id="card" class="card">Card</div></div>
<div data-btn-radius="5"><button id="pill" class="btn btn-outline tone-danger">Pill</button></div>
<section id="dark" data-theme="dark" style="--sh-primary:#e11d48">
  <span id="op" class="bg-primary bg-o-50">x</span>
  ${B.map(b => `<p class="text-${b}">${b}</p>`).join('')}
</section>
<div id="bd" class="border border-primary">b</div>
<div id="resp" class="block md:flex">r</div>
<div id="pr" class="print:hidden block">p</div>
<div class="btn-group"><button id="g1" class="btn">1</button><button id="g2" class="btn">2</button></div>
<dialog id="modal" class="modal"><div class="modal-body">Hi</div></dialog>
<button id="mt" popovertarget="menu" class="btn">Menu</button>
<div id="menu" popover class="menu dropdown-menu"><a href="#">One</a></div>
</body></html>`;

const lum = ([r, g, b]) => {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

async function run(name) {
  const browser = await playwright[name].launch();
  const p = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  const errors = [];
  p.on('pageerror', e => errors.push(String(e)));
  await p.goto('file://' + page);

  // Resolve any CSS color (incl. oklab/color-mix) to sRGB bytes via canvas.
  const css = (sel, prop) => p.$eval(sel, (e, prop) => {
    const v = getComputedStyle(e)[prop];
    if (!/color/i.test(prop)) return v;
    const c = document.createElement('canvas').getContext('2d');
    c.fillStyle = '#000'; c.fillStyle = v; c.fillRect(0, 0, 1, 1);
    return [...c.getImageData(0, 0, 1, 1).data];
  }, prop);

  const fails = [];
  const check = (label, ok, got) => { if (!ok) fails.push(`${label}: got ${JSON.stringify(got)}`); };

  check('data-radius=5 on .btn', (await css('#btn', 'borderTopLeftRadius')) === '32px', await css('#btn', 'borderTopLeftRadius'));
  check('data-btn-radius=5 pill', (await css('#pill', 'borderTopLeftRadius')) === '9999px', await css('#pill', 'borderTopLeftRadius'));
  const darkBg = await css('#dark', 'backgroundColor');
  check('dark section paints bg', darkBg[0] < 40 && darkBg[2] < 60, darkBg);
  const op = await css('#op', 'backgroundColor');
  check('bg-o-50 alpha', op[3] > 100 && op[3] < 160, op);
  for (const b of B) {
    const fg = await css(`#dark .text-${b}`, 'color');
    const c = contrast(fg, darkBg);
    check(`text-${b} contrast on dark ≥ 4.5`, c >= 4.5, c.toFixed(2));
  }
  const bd = await css('#bd', 'borderTopColor');
  check('border-primary wins over default border color', bd[2] > 150 && bd[0] < 150, bd);
  check('md:flex at 1000px', (await css('#resp', 'display')) === 'flex', await css('#resp', 'display'));
  check('btn-group inner radius', (await css('#g1', 'borderTopRightRadius')) === '0px', await css('#g1', 'borderTopRightRadius'));
  check('popover menu hidden when closed', (await css('#menu', 'display')) === 'none', await css('#menu', 'display'));
  await p.click('#mt');
  check('popover menu shown when open', (await css('#menu', 'display')) !== 'none', await css('#menu', 'display'));
  const box = await p.$eval('#menu', e => { const r = e.getBoundingClientRect(); return [r.top, r.bottom]; });
  check('popover menu on screen', box[0] >= 0 && box[1] <= 700, box);
  await p.keyboard.press('Escape');
  await p.$eval('#modal', d => d.showModal());
  const m = await p.$eval('#modal', d => { const r = d.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  check('modal roughly centered', Math.abs(m[0] - 500) < 20 && Math.abs(m[1] - 350) < 40, m);
  await p.emulateMedia({ media: 'print' });
  check('print:hidden', (await css('#pr', 'display')) === 'none', await css('#pr', 'display'));
  check('no page errors', errors.length === 0, errors);

  await browser.close();
  return fails;
}

(async () => {
  const names = process.argv.slice(2).length ? process.argv.slice(2) : ['chromium'];
  fs.writeFileSync(page, html);
  let failed = 0;
  try {
    for (const n of names) {
      const fails = await run(n);
      console.log(`${n}: ${fails.length ? 'FAIL' : 'ok'}`);
      fails.forEach(f => console.log('  - ' + f));
      failed += fails.length;
    }
  } finally {
    fs.unlinkSync(page);
  }
  process.exitCode = failed ? 1 : 0;
})();
