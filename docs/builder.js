/* Shine docs: theme builder + class playground + copy buttons. Vanilla JS, no dependencies. */
(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
};

/* ---------- page theme + copy buttons ---------- */
const pt = $('#page-theme'), saved = store.get('shine-page-theme');
if (saved) { pt.value = saved; document.documentElement.dataset.theme = saved; }
pt.addEventListener('change', () => { document.documentElement.dataset.theme = pt.value; store.set('shine-page-theme', pt.value); builder(); });
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-copy]'); if (!b) return;
  const src = $(b.dataset.copy), text = src.value ?? src.textContent, old = b.textContent;
  try { await navigator.clipboard.writeText(text); b.textContent = 'Copied!'; }
  catch (err) { src.select?.(); b.textContent = 'Press Ctrl+C'; }
  setTimeout(() => b.textContent = old, 1600);
});

/* ---------- theme builder ---------- */
const COLORS = ['primary', 'secondary', 'accent', 'success', 'warning', 'danger', 'info'];
const D = { theme: 'light', primary: '#4f46e5', secondary: '#64748b', accent: '#db2777', success: '#15803d', warning: '#b45309', danger: '#dc2626', info: '#0369a1', auto: true,
  radius: 2, btn: '', card: '', input: '', shadow: 1, density: '', space: 0.25, font: '', size: 16,
  'ls.bg': '#ffffff', 'ls.surface': '#f8fafc', 'ls.surface-2': '#f1f5f9', 'ls.text': '#0f172a', 'ls.text-muted': '#64748b', 'ls.border': '#e2e8f0',
  'ds.bg': '#0b0f19', 'ds.surface': '#121826', 'ds.surface-2': '#1c2433', 'ds.text': '#f1f5f9', 'ds.text-muted': '#94a3b8', 'ds.border': '#263042' };
const PRESETS = {
  default: {},
  ocean: { primary: '#0284c7', secondary: '#475569', accent: '#06b6d4', info: '#0e7490', radius: 3, shadow: 2 },
  forest: { primary: '#15803d', secondary: '#57534e', accent: '#a16207', success: '#166534', radius: 2, shadow: 1, font: "ui-serif, Georgia, Cambria, 'Times New Roman', serif" },
  sunset: { primary: '#ea580c', secondary: '#78716c', accent: '#db2777', warning: '#ca8a04', radius: 4, shadow: 3, density: 'comfortable' },
  mono: { primary: '#27272a', secondary: '#52525b', accent: '#71717a', info: '#52525b', radius: 1, shadow: 0, font: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' },
  pill: { primary: '#7c3aed', accent: '#ec4899', btn: '5', input: '5', card: '4', radius: 3, shadow: 2 },
  brutal: { primary: '#facc15', secondary: '#111827', accent: '#ef4444', radius: 0, shadow: 5, font: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', 'ls.border': '#111827', 'ds.border': '#e5e7eb' }
};
const ATTRS = /^data-(theme|radius|btn-radius|card-radius|input-radius|shadow|density)$/;
const prev = $('#preview'), form = $('#bform'), mq = matchMedia('(prefers-color-scheme: dark)');
const fields = $$('[name]', form);
let S = { ...D };

const lum = h => { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const onColor = h => 1.05 / (lum(h) + 0.05) >= (lum(h) + 0.05) / 0.05 ? '#fff' : '#000';
const changed = pre => Object.fromEntries(Object.keys(D).filter(k => k.startsWith(pre) && S[k] !== D[k]).map(k => [k.slice(pre.length).replace(/^\./, ''), S[k]]));

/* Resolve state into data-attributes, CSS variables, light/dark surface overrides */
function calc() {
  const a = {}, v = {}, eff = S.theme === 'auto' ? (mq.matches ? 'dark' : 'light') : S.theme;
  if (S.theme !== 'light') a.theme = S.theme;
  if (S.radius != D.radius) a.radius = S.radius;
  ['btn', 'card', 'input'].forEach(k => S[k] !== '' && (a[k + '-radius'] = S[k]));
  if (S.shadow != D.shadow) a.shadow = S.shadow;
  if (S.density) a.density = S.density;
  COLORS.forEach(k => {
    if (S[k] === D[k]) return;
    v['--sh-' + k] = S[k];
    if (S.auto && onColor(S[k]) !== '#fff') v['--sh-on-' + k] = onColor(S[k]);
  });
  if (S.space != D.space) v['--sh-space'] = S.space + 'rem';
  if (S.font) v['--sh-font-sans'] = S.font;
  const surf = {}, ch = changed(eff === 'dark' ? 'ds' : 'ls');
  for (const k in ch) surf['--sh-' + k] = ch[k];
  return { a, v, surf, fs: S.size != D.size ? S.size + 'px' : '' };
}
function applyTo(el, o) {
  [...el.attributes].filter(x => ATTRS.test(x.name)).forEach(x => el.removeAttribute(x.name));
  Object.entries({ theme: 'light', ...o.a }).forEach(([k, val]) => el.setAttribute('data-' + k, val));
  el.style.cssText = '';
  Object.entries({ ...o.v, ...o.surf }).forEach(([k, val]) => el.style.setProperty(k, val));
  el.style.fontSize = o.fs;
}
const px = { 0: '0', 1: '.25rem', 2: '.5rem', 3: '.75rem', 4: '1.25rem', 5: '2rem' };
function exports(o) {
  const attrs = Object.entries(o.a).map(([k, val]) => ` data-${k}="${val}"`).join('');
  const style = Object.entries(o.v).map(([k, val]) => `${k}:${val.replace(/"/g, "'")}`).concat(o.fs ? ['font-size:' + o.fs] : []).join('; ');
  const css = { ...o.v };
  if (o.a.radius) css['--sh-radius'] = px[o.a.radius];
  ['btn', 'card', 'input'].forEach(k => { const l = o.a[k + '-radius']; if (l) css[`--sh-${k}-radius`] = l == 5 && k !== 'card' ? '9999px' : px[l]; });
  if (o.a.shadow) css['--sh-elevation'] = o.a.shadow == 0 ? 'none' : `var(--sh-shadow-${o.a.shadow})`;
  if (o.a.density) css['--sh-density'] = o.a.density === 'compact' ? '.75' : '1.25';
  const block = (sel, obj) => Object.keys(obj).length ? `${sel} {\n${Object.entries(obj).map(([k, val]) => `  ${k}: ${val};`).join('\n')}\n}\n` : '';
  const pre = k => Object.fromEntries(Object.entries(changed(k)).map(([n, val]) => ['--sh-' + n, val]));
  const ls = pre('ls'), ds = pre('ds');
  const text = block(':root', css) + (S.size != D.size ? `html {\n  font-size: ${S.size}px;\n}\n` : '') + block(':root, [data-theme="light"]', ls) + block('[data-theme="dark"]', ds) +
    (Object.keys(ds).length ? `@media (prefers-color-scheme: dark) {\n  [data-theme="auto"] {\n${Object.entries(ds).map(([k, val]) => `    ${k}: ${val};`).join('\n')}\n  }\n}\n` : '');
  return { html: `<html lang="en"${attrs}${style ? ` style="${style}"` : ''}>`, css: text || '/* defaults: nothing overridden */\n' };
}
function builder(skipSync) {
  const o = calc();
  applyTo(prev, o);
  const ex = exports(o);
  $('#out-html').textContent = ex.html;
  $('#out-css').textContent = ex.css;
  if (!skipSync) fields.forEach(f => { const val = S[f.name]; f.type === 'checkbox' ? f.checked = val : f.value = val; });
  $$('[data-out]').forEach(n => n.textContent = S[n.dataset.out]);
  const diff = Object.fromEntries(Object.keys(D).filter(k => S[k] !== D[k]).map(k => [k, S[k]])), json = JSON.stringify(diff);
  store.set('shine-builder', json);
  try { history.replaceState(null, '', Object.keys(diff).length ? '#b=' + encodeURIComponent(json) : location.pathname + location.search); } catch (e) { /* sandboxed */ }
  playTheme();
}
form.addEventListener('input', e => {
  const f = e.target; if (!f.name) return;
  S[f.name] = f.type === 'checkbox' ? f.checked : f.type === 'range' ? +f.value : f.value;
  builder(true);
});
form.addEventListener('click', e => {
  const p = e.target.closest('[data-preset]');
  if (p) { S = { ...D, ...PRESETS[p.dataset.preset], theme: S.theme }; builder(); }
});
$('#b-reset').addEventListener('click', () => { S = { ...D }; builder(); });
prev.addEventListener('click', e => e.target.closest('a[href^="#"]') && e.preventDefault());
mq.addEventListener?.('change', () => builder(true));
$('#dl-css').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([$('#out-css').textContent], { type: 'text/css' }));
  a.download = 'theme.css'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
(() => { // restore: URL hash wins over localStorage
  let raw = location.hash.startsWith('#b=') ? decodeURIComponent(location.hash.slice(3)) : store.get('shine-builder');
  try { S = { ...D, ...JSON.parse(raw || '{}') }; } catch (e) { S = { ...D }; }
})();

/* ---------- class playground ---------- */
const fr = $('#pg-frame'), ta = $('#pg-src'), tpl = $('#pg-tpl'), chipsEl = $('#pg-chips'), addIn = $('#pg-cls');
const cssUrl = new URL('../dist/shine.min.css', location.href).href;
let sel = null, known = null, timer;
const idoc = () => fr.contentDocument;
function loadTemplate() { ta.value = $('#tpl-' + tpl.value).innerHTML.trim(); render(); }
function render() {
  fr.srcdoc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${cssUrl}"><style>[data-sel]{outline:2px dashed #e11d48!important;outline-offset:2px}</style></head><body>${ta.value}</body></html>`;
}
function playTheme() { const d = idoc(); if (d && d.documentElement) applyTo(d.documentElement, calc()); }
function choose(el) {
  sel?.removeAttribute('data-sel');
  sel = el && el !== idoc().body && el !== idoc().documentElement ? el : null;
  sel?.setAttribute('data-sel', '');
  chips();
}
function chips() {
  $('#pg-tag').textContent = sel ? `Selected: <${sel.localName}>` : 'Click an element in the preview.';
  addIn.disabled = $('#pg-parent').disabled = !sel;
  chipsEl.replaceChildren(...(sel && sel.classList.length ? [...sel.classList] : []).map(c => {
    const li = document.createElement('li'), b = document.createElement('button');
    b.type = 'button'; b.className = 'badge cursor-pointer'; b.textContent = c + ' ×'; b.dataset.rm = c; b.setAttribute('aria-label', 'Remove class ' + c);
    li.append(b); return li;
  }));
  if (!chipsEl.children.length) chipsEl.innerHTML = `<li class="text-sm text-muted">${sel ? 'No classes yet.' : 'No element selected.'}</li>`;
}
function sync() { // push iframe DOM back to textarea
  const c = idoc().body.cloneNode(true);
  c.querySelectorAll('[data-sel]').forEach(n => n.removeAttribute('data-sel'));
  c.querySelectorAll('[class=""]').forEach(n => n.removeAttribute('class'));
  ta.value = c.innerHTML.trim();
}
function classList() { // every class in the stylesheet via CSSOM
  if (known) return;
  const set = new Set(), walk = rules => { for (const r of rules) { if (r.selectorText) for (const m of r.selectorText.matchAll(/\.((?:\\.|[\w-])+)/g)) set.add(m[1].replace(/\\(.)/g, '$1')); if (r.cssRules) walk(r.cssRules); } };
  let full = true;
  try { [...idoc().styleSheets].forEach(s => walk(s.cssRules)); } catch (e) { // file:// blocks CSSOM: fall back to classes used on this page
    full = false; $$('[class]').concat($$('template').flatMap(t => $$('[class]', t.content))).forEach(n => n.classList.forEach(c => set.add(c)));
  }
  known = [...set].sort();
  $('#pg-classes').replaceChildren(...known.map(c => Object.assign(document.createElement('option'), { value: c })));
  $('#pg-count').textContent = `${known.length} classes for autocomplete ` + (full ? '(read from the stylesheet).' : '(file:// blocks reading the stylesheet, so this is the set used on this page; serve over http for all).');
}
function setClass(fn) { if (!sel) return; fn(sel.classList); if (!sel.classList.length) sel.removeAttribute('class'); sync(); chips(); }
fr.addEventListener('load', () => {
  const d = idoc(); sel = null; chips(); playTheme(); classList();
  d.addEventListener('click', e => { if ($('#pg-inspect').checked) { e.preventDefault(); e.stopPropagation(); choose(e.target); } }, true);
});
ta.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(render, 250); });
tpl.addEventListener('change', loadTemplate);
$('#pg-reset').addEventListener('click', loadTemplate);
$('#pg-parent').addEventListener('click', () => sel?.parentElement && choose(sel.parentElement));
chipsEl.addEventListener('click', e => { const c = e.target.dataset.rm; if (c) setClass(l => l.remove(c)); });
$('#pg-add').addEventListener('submit', () => { const c = addIn.value.trim().split(/\s+/).filter(Boolean); if (c.length) setClass(l => l.add(...c)); addIn.value = ''; });
$('#pg-vw').addEventListener('click', e => {
  const b = e.target.closest('[data-vw]'); if (!b) return;
  fr.style.inlineSize = b.dataset.vw;
  $$('#pg-vw .btn').forEach(x => { const on = x === b; x.setAttribute('aria-pressed', on); x.classList.toggle('btn-outline', !on); });
});

fr.style.inlineSize = '100%';
builder();
loadTemplate();
})();
