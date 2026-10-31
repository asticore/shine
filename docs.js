#!/usr/bin/env node
/* Shine docs generator — zero dependencies.
   Reads src/*.css and writes docs/reference.html (fully static, crawlable HTML).
   Utilities, tokens, knobs, tones and component class lists are PARSED from the CSS,
   so the reference cannot drift. Only descriptions/examples below are hand-written;
   a class without a description prints a warning.
   Usage: node docs.js */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unesc = s => s.replace(/\\(.)/g, '$1');
const stripComments = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const warnings = [];

/* ------------------------------------------------------------------ tokens */
const tokensCss = read('src/tokens.css');

function parseRoot(css) {
  const start = css.indexOf(':root {');
  const end = css.indexOf('\n}', start);
  const out = []; let group = '';
  for (const line of css.slice(start, end).split('\n')) {
    const g = line.match(/^\s*\/\*\s*-+\s*(.*?)\s*-*\s*\*\/\s*$/);
    if (g) { group = g[1]; continue; }
    const m = line.match(/^\s*(--sh-[\w-]+)\s*:\s*([^;]+);\s*(?:\/\*\s*(.*?)\s*\*\/)?/);
    if (m) out.push({ name: m[1], value: m[2].trim(), note: m[3] || '', group });
  }
  return out;
}
const tokens = parseRoot(tokensCss);

/* data-* knobs: attribute -> [{v, css}] */
const knobs = new Map();
for (const m of tokensCss.matchAll(/\[(data-[\w-]+)="([\w-]+)"\]\s*(?:\{([^}]*)\})/g)) {
  if (!knobs.has(m[1])) knobs.set(m[1], []);
  const decl = (m[3] || '').trim().replace(/^--sh-[\w-]+:\s*/, '').replace(/;$/, '').split(';')[0].trim();
  knobs.get(m[1]).push({ v: m[2], css: decl });
}
// `data-theme="auto"` only appears inside a media query; add it by hand if it was seen there.
if (/\[data-theme="auto"\]/.test(tokensCss) && !knobs.get('data-theme').some(x => x.v === 'auto')) knobs.get('data-theme').push({ v: 'auto', css: 'follows the OS setting' });

const tones = [...tokensCss.matchAll(/^\.tone-([\w-]+)/gm)].map(m => m[1]);

const KNOB_INFO = {
  'data-theme': ['Page background, surfaces, text, borders and shadows. A themed element paints its own background, so a dark section can sit inside a light page.', 'html or any section'],
  'data-radius': ['Corner level for every rounded thing: buttons, cards, inputs, modals and the rounded-* utilities.', 'html or any element'],
  'data-btn-radius': ['Corner level for buttons only (and pagination, tabs pills, close buttons). 5 makes pills.', 'any element'],
  'data-card-radius': ['Corner level for cards, modals, menus and accordions.', 'any element'],
  'data-input-radius': ['Corner level for text inputs, selects and textareas. 5 makes pills.', 'any element'],
  'data-shadow': ['Elevation of cards, from none (0) to very high (5). Also drives the shadow-elevation utility.', 'html or any element'],
  'data-density': ['Component padding multiplier: compact = .75, comfortable = 1.25, default = 1.', 'html or any element'],
};

/* ---------------------------------------------------------------- breakpoints / layers */
const buildJs = read('build.js');
const bpMatch = buildJs.match(/BREAKPOINTS\s*=\s*\{([^}]*)\}/);
const BREAKPOINTS = bpMatch ? Object.fromEntries([...bpMatch[1].matchAll(/(\w+)\s*:\s*(\d+)/g)].map(m => [m[1], +m[2]])) : { sm: 640, md: 768, lg: 1024, xl: 1280 };
const layerDecl = (read('src/index.css').match(/@layer[^;{]+;/) || ['@layer shine.tokens, shine.reset, shine.base, shine.components, shine.utilities;'])[0];

/* ---------------------------------------------------------------- components */
const COMPONENTS = [
  {
    id: 'button', file: 'button', title: 'Button',
    intro: 'A <code>btn</code> is solid by default. Add a style (outline, soft, ghost, link), a size, and a tone class to recolor it.',
    desc: {
      btn: 'Base solid button. Works on button, a and summary.',
      'btn-sm': 'Smaller padding and text.', 'btn-lg': 'Larger padding and text.',
      'btn-outline': 'Transparent with a tone-colored border.', 'btn-soft': 'Light tinted background.',
      'btn-ghost': 'No background until hover.', 'btn-link': 'Looks like an underlined text link.',
      'btn-block': 'Full-width, block-level button.', 'btn-icon': 'Square button for a single icon or glyph.',
    },
    examples: [{ html: `<button class="btn">Solid</button>
<button class="btn btn-outline">Outline</button>
<button class="btn btn-soft tone-success">Soft</button>
<button class="btn btn-ghost">Ghost</button>
<button class="btn btn-link">Link</button>
<button class="btn btn-sm">Small</button>
<button class="btn btn-lg tone-danger">Large</button>
<button class="btn btn-icon" aria-label="Star">★</button>
<button class="btn" disabled>Disabled</button>` }],
  },
  {
    id: 'card', file: 'card', title: 'Card',
    intro: 'A bordered surface. Radius follows <code>data-card-radius</code>, elevation follows <code>data-shadow</code>.',
    desc: {
      card: 'Bordered surface with radius and shadow.', 'card-flat': 'Removes the shadow.',
      'card-header': 'Padded top area with a bottom border.', 'card-body': 'Padded main area.',
      'card-footer': 'Padded bottom area with a top border.', 'card-title': 'Heading style for a card.',
      'card-media': 'Full-width image at the top, rounded to match the card.',
    },
    examples: [{ html: `<article class="card">
  <div class="card-header"><h3 class="card-title">Title</h3></div>
  <div class="card-body">Body text. Radius and shadow follow the knobs.</div>
  <div class="card-footer"><button class="btn btn-sm">Save</button></div>
</article>` }],
  },
  {
    id: 'form', file: 'form', title: 'Form',
    intro: 'Native controls, styled. Wrap a label, control and hint in <code>field</code> for even spacing. Mark errors with <code>is-invalid</code> or <code>aria-invalid="true"</code>.',
    desc: {
      input: 'Text input.', select: 'Dropdown select with a custom arrow.', textarea: 'Multi-line text input.',
      'is-invalid': 'Red error state (aria-invalid="true" does the same). Turns the next hint red.',
      'input-sm': 'Smaller input.', 'input-lg': 'Larger input.',
      checkbox: 'Checkbox tinted with the tone.', radio: 'Radio button tinted with the tone.',
      switch: 'Toggle switch (use on a checkbox input).', label: 'Form label.',
      field: 'Groups label, control and hint in a tidy grid.', hint: 'Small helper text under a control.',
    },
    examples: [{ html: `<div class="field">
  <label class="label" for="ex-name">Name</label>
  <input class="input" id="ex-name" placeholder="Ada Lovelace">
  <span class="hint">Helper text</span>
</div>
<div class="field">
  <label class="label" for="ex-mail">Email</label>
  <input class="input is-invalid" id="ex-mail" value="nope" aria-invalid="true">
  <span class="hint">Enter a valid email</span>
</div>
<div class="field">
  <label class="label" for="ex-plan">Plan</label>
  <select class="select" id="ex-plan"><option>Free</option><option>Pro</option></select>
</div>
<div class="field">
  <label class="label" for="ex-msg">Message</label>
  <textarea class="textarea" id="ex-msg"></textarea>
</div>
<label class="flex items-center gap-2"><input type="checkbox" class="checkbox" checked> Checkbox</label>
<label class="flex items-center gap-2"><input type="radio" class="radio" name="ex-r" checked> Radio</label>
<label class="flex items-center gap-2"><input type="checkbox" class="switch" checked> Switch</label>`, wrap: 'grid grid-cols-1 md:grid-cols-2 gap-4' }],
  },
  {
    id: 'badge', file: 'badge', title: 'Badge, avatar, divider',
    intro: 'Small status chips, round avatars and separators. Badges take tone classes.',
    desc: {
      badge: 'Small tinted pill.', 'badge-solid': 'Solid tone fill.', 'badge-outline': 'Outlined, no fill.',
      avatar: 'Round box for initials or an image.', divider: 'Horizontal rule; put text inside for a labelled divider.',
    },
    examples: [{ html: `<span class="badge">Default</span>
<span class="badge tone-success">Success</span>
<span class="badge badge-solid tone-danger">Solid</span>
<span class="badge badge-outline tone-info">Outline</span>
<span class="avatar">AB</span>
<hr class="divider">
<div class="divider">or</div>`, wrap: 'flex flex-wrap items-center gap-2' }],
  },
  {
    id: 'alert', file: 'alert', title: 'Alert and kbd',
    intro: 'Inline messages and keyboard keys. Alerts take tone classes.',
    desc: { alert: 'Tinted message box.', 'alert-solid': 'Solid tone fill.', 'alert-title': 'Bold first line.', kbd: 'Keyboard key cap.' },
    examples: [{ html: `<div class="alert tone-info"><span class="alert-title">Heads up</span> Soft alert.</div>
<div class="alert alert-solid tone-danger"><span class="alert-title">Failed</span> Solid alert.</div>
<p>Press <kbd class="kbd">Ctrl</kbd> + <kbd class="kbd">K</kbd></p>`, wrap: 'grid gap-3' }],
  },
  {
    id: 'overlay', file: 'overlay', title: 'Overlays: modal, offcanvas, dropdown, tooltip',
    intro: 'No JavaScript. Modals use <code>&lt;dialog&gt;</code> with <code>command</code> / <code>commandfor</code> (Invoker Commands). Offcanvas uses the Popover API. Dropdowns use <code>&lt;details&gt;</code>. Tooltips use a data attribute.',
    desc: {
      modal: 'Centered dialog. Put it on a &lt;dialog&gt;.', 'modal-sm': 'Narrower modal.', 'modal-lg': 'Wider modal.',
      'modal-full': 'Nearly full-screen modal.', 'modal-header': 'Top bar of a modal.', 'modal-body': 'Padded content of a modal.',
      'modal-footer': 'Bottom bar for action buttons.', offcanvas: 'Side panel that slides in. Put it on an element with the popover attribute.',
      'offcanvas-right': 'Slides in from the right.', 'offcanvas-top': 'Slides in from the top.', 'offcanvas-bottom': 'Slides in from the bottom.',
      'offcanvas-header': 'Top bar of an offcanvas.', 'offcanvas-body': 'Padded content of an offcanvas.',
      'btn-close': 'Round close button with a multiplication sign.', dropdown: 'Wrapper for a details/summary dropdown.',
      'dropdown-end': 'Aligns the menu to the right edge.', menu: 'Vertical list of links or buttons.',
      'menu-divider': 'Thin separator line between menu items.', active: 'Highlights the current menu or tab item.',
      'data-tooltip': 'Attribute: text shown on hover or focus.', 'data-tooltip-pos': 'Attribute: top (default), bottom, left or right.',
    },
    examples: [
      { title: 'Modal', html: `<button class="btn" command="show-modal" commandfor="demo-modal">Open modal</button>
<dialog id="demo-modal" class="modal" aria-labelledby="demo-modal-title">
  <div class="modal-header">
    <h3 class="card-title" id="demo-modal-title">Modal title</h3>
    <button class="btn-close" command="close" commandfor="demo-modal" aria-label="Close"></button>
  </div>
  <div class="modal-body">Esc or the backdrop closes it. Focus is trapped natively.</div>
  <div class="modal-footer">
    <button class="btn btn-ghost" command="close" commandfor="demo-modal">Cancel</button>
    <button class="btn" command="close" commandfor="demo-modal">OK</button>
  </div>
</dialog>`, note: 'Browsers without Invoker Commands: write <code>&lt;dialog class="modal" popover id="…"&gt;</code> and open it with <code>popovertarget="…"</code> instead; the CSS styles both.' },
      { title: 'Offcanvas', html: `<button class="btn" popovertarget="demo-oc">Open panel</button>
<aside id="demo-oc" popover class="offcanvas" aria-label="Demo panel">
  <div class="offcanvas-header">
    <strong>Panel</strong>
    <button class="btn-close" popovertarget="demo-oc" popovertargetaction="hide" aria-label="Close"></button>
  </div>
  <div class="offcanvas-body">Slides in from the left. Add offcanvas-right, -top or -bottom to change the side.</div>
</aside>` },
      { title: 'Dropdown', html: `<details class="dropdown">
  <summary class="btn btn-outline">Menu</summary>
  <ul class="menu">
    <li><a href="#overlay" class="active">Profile</a></li>
    <li><a href="#overlay">Settings</a></li>
    <li><hr class="menu-divider"></li>
    <li><button type="button">Sign out</button></li>
  </ul>
</details>`, wrap: 'pb-16' },
      { title: 'Tooltip', html: `<button class="btn btn-outline" data-tooltip="Saved to your account">Hover me</button>
<button class="btn btn-outline" data-tooltip="Below" data-tooltip-pos="bottom">Bottom</button>
<button class="btn btn-outline" data-tooltip="Right" data-tooltip-pos="right">Right</button>`, wrap: 'flex flex-wrap items-center gap-6 py-6' },
    ],
  },
  {
    id: 'nav', file: 'nav', title: 'Navigation',
    intro: 'Navbar, breadcrumb, pagination and tabs. Use real <code>&lt;nav&gt;</code>, lists, and <code>aria-current="page"</code> for the active item.',
    desc: {
      navbar: 'Horizontal bar that wraps on small screens.', 'navbar-brand': 'Logo or site name link.',
      'navbar-nav': 'List of navbar links.', 'navbar-end': 'Pushes an item to the right edge.',
      breadcrumb: 'Slash-separated trail (use on ol/ul).', pagination: 'Row of page links (use on ul).',
      tabs: 'Underlined tab row (use on ul).', 'tabs-pills': 'Combine with tabs for pill-shaped tabs.',
      active: 'Marks the current tab or menu item (aria-current works too).',
    },
    examples: [{ html: `<nav class="navbar" aria-label="Demo">
  <a class="navbar-brand" href="#nav">Brand</a>
  <ul class="navbar-nav">
    <li><a href="#nav" aria-current="page">Home</a></li>
    <li><a href="#nav">Docs</a></li>
  </ul>
  <a class="navbar-end btn btn-sm" href="#nav">Sign in</a>
</nav>

<nav aria-label="Breadcrumb">
  <ol class="breadcrumb">
    <li><a href="#nav">Home</a></li>
    <li><a href="#nav">Docs</a></li>
    <li aria-current="page">Navigation</li>
  </ol>
</nav>

<ul class="tabs">
  <li><a href="#nav" aria-current="page">Overview</a></li>
  <li><a href="#nav">Usage</a></li>
  <li><a href="#nav">API</a></li>
</ul>

<ul class="tabs tabs-pills">
  <li><a href="#nav" aria-current="page">One</a></li>
  <li><a href="#nav">Two</a></li>
</ul>

<nav aria-label="Pages">
  <ul class="pagination">
    <li><a href="#nav">Prev</a></li>
    <li><a href="#nav" aria-current="page">1</a></li>
    <li><a href="#nav">2</a></li>
    <li><a href="#nav">Next</a></li>
  </ul>
</nav>`, wrap: 'grid gap-5' }],
  },
  {
    id: 'content', file: 'content', title: 'Content: accordion, table, progress, prose',
    intro: 'Building blocks for documents. The accordion is plain <code>&lt;details&gt;</code>; the progress bar is a native <code>&lt;progress&gt;</code>; <code>prose</code> styles long-form HTML such as articles.',
    desc: {
      accordion: 'Bordered stack of &lt;details&gt; items with a chevron.', table: 'Full-width table with row borders.',
      'table-striped': 'Zebra rows.', 'table-hover': 'Highlights the row under the pointer.',
      'table-compact': 'Tighter cell padding.', 'table-wrap': 'Scrolls a wide table sideways.',
      progress: 'Rounded progress bar (use on &lt;progress&gt;).', prose: 'Styles plain h1-h4, p, lists, code, tables and quotes inside it.',
      'skip-link': 'Hidden link that appears on keyboard focus; place first in body.',
    },
    examples: [{ html: `<div class="accordion">
  <details open><summary>First item</summary><p>Opens and closes natively.</p></details>
  <details><summary>Second item</summary><p>More content.</p></details>
</div>

<div class="table-wrap">
  <table class="table table-striped table-hover">
    <thead><tr><th>Name</th><th>Role</th></tr></thead>
    <tbody>
      <tr><td>Ada</td><td>Engineer</td></tr>
      <tr><td>Grace</td><td>Admiral</td></tr>
    </tbody>
  </table>
</div>

<progress class="progress" value="60" max="100" aria-label="Upload"></progress>
<progress class="progress tone-success" value="30" max="100" aria-label="Done"></progress>

<a class="skip-link" href="#main">Skip to content</a>`, wrap: 'grid gap-5' }],
  },
];

/* ------------------------------------------------------------------ helpers */
function classesOf(file) {
  const css = stripComments(read(`src/components/${file}.css`));
  const found = [];
  for (const m of css.matchAll(/([^{}]+)\{[^{}]*\}/g)) {
    if (m[1].trim().startsWith('@')) continue;
    for (const c of m[1].matchAll(/\.([a-zA-Z][\w-]*)|\[(data-[\w-]+)\]/g)) {
      const name = c[1] || c[2];
      if (!found.includes(name)) found.push(name);
    }
  }
  return found;
}

const code = s => `<code class="font-mono text-sm bg-surface-2 px-1 rounded">${esc(s)}</code>`;
const pre = s => `<pre class="bg-surface-2 p-4 text-sm overflow-x-auto m-0"><code>${esc(s)}</code></pre>`;
const table = (head, rows, cls = 'table table-compact table-striped') =>
  `<div class="table-wrap"><table class="${cls}"><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>\n${rows.join('\n')}\n</tbody></table></div>`;

/* ----------------------------------------------------------------- utilities */
function parseUtilities(css) {
  const rules = []; let i = 0, kinds = [], group = '', header = '', seenToken = false;
  while (i < css.length) {
    if (css.startsWith('/*', i)) {
      const e = css.indexOf('*/', i);
      const t = css.slice(i + 2, e).trim(); i = e + 2;
      let m;
      if ((m = t.match(/^@variants\s+(.*)$/))) kinds = m[1].trim().split(/\s+/);
      else if (t === '@end') kinds = [];
      else if (!seenToken) header = t;
      else group = t;
      seenToken = true; continue;
    }
    if (/\s/.test(css[i])) { i++; continue; }
    seenToken = true;
    const b = css.indexOf('{', i);
    const prelude = css.slice(i, b).trim();
    let d = 1, j = b + 1;
    while (d && j < css.length) { if (css[j] === '{') d++; else if (css[j] === '}') d--; j++; }
    const body = css.slice(b + 1, j - 1).trim(); i = j;
    if (prelude.startsWith('@')) continue;
    rules.push({ sel: prelude, body, kinds: [...kinds], group });
  }
  return { header, rules };
}

const splitTop = sel => { const out = []; let d = 0, cur = ''; for (const ch of sel) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { out.push(cur); cur = ''; } else cur += ch; } return [...out, cur].map(s => s.trim()).filter(Boolean); };
const tidyBody = b => b.replace(/\s+/g, ' ').replace(/;\s*$/, '').replace(/\s*;\s*/g, '; ').replace(/;\s*$/, '').trim();

const utilFiles = fs.readdirSync(path.join(ROOT, 'src/utilities')).filter(f => f.endsWith('.css')).sort();
const UTIL_ORDER = ['layout', 'flex-grid', 'spacing', 'sizing', 'typography', 'color', 'borders', 'effects', 'interactivity'];
utilFiles.sort((a, b) => (UTIL_ORDER.indexOf(a.slice(0, -4)) + 99) % 99 - (UTIL_ORDER.indexOf(b.slice(0, -4)) + 99) % 99);
let utilCount = 0, variantCount = 0;
const utilSections = utilFiles.map(f => {
  const name = f.slice(0, -4);
  const { header, rules } = parseUtilities(read(`src/utilities/${f}`));
  let lastGroup = null; const rows = [];
  for (const r of rules) {
    if (r.group !== lastGroup) {
      lastGroup = r.group;
      if (r.group) rows.push(`<tr data-g><th colspan="3" scope="colgroup" class="text-left">${esc(r.group)}</th></tr>`);
    }
    const names = splitTop(r.sel).map(unesc);
    const v = [];
    if (r.kinds.includes('responsive')) v.push(...Object.keys(BREAKPOINTS));
    if (r.kinds.includes('hover')) v.push('hover');
    if (r.kinds.includes('focus')) v.push('focus');
    utilCount++; variantCount += v.length * names.length;
    rows.push(`<tr data-c="${esc(names.join(' ').toLowerCase())}"><td class="font-mono text-sm"><code>${esc(names.join(', '))}</code></td><td class="text-sm font-mono break-all">${esc(tidyBody(r.body))}</td><td class="text-sm">${v.length ? v.join(' ') : '-'}</td></tr>`);
  }
  return { name, header, rows, count: rules.length };
});

/* ---------------------------------------------------------------------- page */
const toc = []; // {id,label,sub:[{id,label}]}
const sections = [];

// 1. Getting started
toc.push({ id: 'getting-started', label: 'Getting started' });
sections.push(`<section id="getting-started" aria-labelledby="h-getting-started" class="space-y-4">
<h2 id="h-getting-started" class="text-3xl font-bold tracking-tight">Getting started</h2>
<div class="prose max-w-none">
<p>Shine is a pure-CSS utility framework. Add one stylesheet and use class names. There is no JavaScript to load and no build step to run.</p>
</div>
${pre('<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/asticore/shine/dist/shine.min.css">')}
<div class="prose max-w-none">
<h3>How classes combine</h3>
<p>A component class gives you the base look. Modifier classes change it. Tone classes recolor it. Utilities adjust it locally.</p>
</div>
${pre('<button class="btn btn-outline tone-danger mt-4 md:mt-0">Delete</button>\n<!--     base   style       tone         utilities    -->')}
<div class="prose max-w-none">
<h3>Knobs first, utilities second</h3>
<p>Start by setting a few <a href="#knobs">master knobs</a> on <code>&lt;html&gt;</code>: theme, corner radius, shadow, density and brand colors. The whole site follows. Reach for utility classes only when one element needs to differ. Your own CSS always wins over Shine, so you never need <code>!important</code>.</p>
</div>
${pre('<html data-theme="auto" data-radius="3" data-shadow="2" style="--sh-primary:#0ea5e9">')}
</section>`);

// 2. Knobs
const knobRows = [...knobs].map(([attr, vals]) => {
  const info = KNOB_INFO[attr] || ['', 'any element']; if (!KNOB_INFO[attr]) warnings.push(`no description for ${attr}`);
  return `<tr><td>${code(attr)}</td><td>${vals.map(x => `<code class="font-mono text-sm" title="${esc(x.css)}">${esc(x.v)}</code>`).join(' · ')}</td><td>${info[0]} <span class="text-muted">Set on: ${info[1]}.</span></td></tr>`;
});
const swatch = t => {
  if (/^(#[0-9a-f]{3,8}|rgb|hsl)/i.test(t.value) && !/\//.test(t.value) || /^#/.test(t.value)) return `<span class="inline-block size-5 rounded border" style="background:var(${t.name})" role="img" aria-label="${esc(t.value)}"></span>`;
  if (/^--sh-shadow-/.test(t.name)) return `<span class="inline-block size-5 rounded bg-surface" style="box-shadow:var(${t.name})" role="img" aria-label="shadow preview"></span>`;
  return '';
};
const tokenRows = tokens.map(t => `<tr><td>${code(t.name)}</td><td class="font-mono text-sm break-all">${esc(t.value)}</td><td>${swatch(t)}</td><td class="text-sm text-muted">${esc(t.note || t.group)}</td></tr>`);
const demo = (label, inner) => `<div class="card card-flat"><div class="card-body space-y-3"><p class="text-sm font-semibold m-0">${code(label)}</p>${inner}</div></div>`;
const levels = [0, 1, 2, 3, 4, 5];
toc.push({ id: 'knobs', label: 'Master knobs', sub: [{ id: 'knob-attrs', label: 'Data attributes' }, { id: 'knob-tokens', label: 'CSS variables' }] });
sections.push(`<section id="knobs" aria-labelledby="h-knobs" class="space-y-6">
<h2 id="h-knobs" class="text-3xl font-bold tracking-tight">Master knobs</h2>
<p class="max-w-prose">Knobs are data attributes and CSS variables. Set them on <code>&lt;html&gt;</code> for the whole site, or on any element to restyle just that subtree.</p>
<section id="knob-attrs" aria-labelledby="h-knob-attrs" class="space-y-4">
<h3 id="h-knob-attrs" class="text-xl font-semibold">Data attributes</h3>
${table(['Attribute', 'Values', 'What it changes'], knobRows)}
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
${demo('data-theme', `<div class="grid grid-cols-3 gap-2">${['light', 'dark', 'auto'].map(v => `<div data-theme="${v}" class="p-3 rounded border text-sm text-center">${v}</div>`).join('')}</div>`)}
${demo('data-radius', `<div class="flex flex-wrap gap-2">${levels.map(v => `<button class="btn btn-sm" data-radius="${v}">${v}</button>`).join('')}</div>`)}
${demo('data-btn-radius', `<div class="flex flex-wrap gap-2">${levels.map(v => `<button class="btn btn-sm btn-outline" data-btn-radius="${v}">${v}</button>`).join('')}</div>`)}
${demo('data-input-radius', `<div class="grid grid-cols-3 gap-2">${[0, 2, 5].map(v => `<input class="input input-sm" data-input-radius="${v}" value="${v}" aria-label="input radius ${v}">`).join('')}</div>`)}
${demo('data-card-radius', `<div class="grid grid-cols-3 gap-2">${[0, 2, 5].map(v => `<div class="card card-flat p-3 text-sm text-center" data-card-radius="${v}">${v}</div>`).join('')}</div>`)}
${demo('data-shadow', `<div class="grid grid-cols-3 gap-3">${[0, 1, 3, 5].map(v => `<div class="card p-3 text-sm text-center" data-shadow="${v}">${v}</div>`).join('')}</div>`)}
${demo('data-density', `<div class="flex flex-wrap items-center gap-2">${['compact', 'default', 'comfortable'].map(v => `<button class="btn btn-sm"${v === 'default' ? '' : ` data-density="${v}"`}>${v}</button>`).join('')}</div>`)}
</div>
</section>
<section id="knob-tokens" aria-labelledby="h-knob-tokens" class="space-y-4">
<h3 id="h-knob-tokens" class="text-xl font-semibold">CSS variables (tokens)</h3>
<p class="max-w-prose">Every <code>--sh-*</code> variable defined on <code>:root</code>. Override any of them on any element: <code>style="--sh-primary:#e11d48"</code> re-brands that subtree.</p>
${table(['Variable', 'Default', 'Preview', 'Note'], tokenRows)}
<p class="max-w-prose">Components also read optional variables that are not set by default. Set them to override one component: ${['--sh-tone', '--sh-on-tone', '--sh-btn-radius', '--sh-card-radius', '--sh-input-radius', '--sh-badge-radius', '--sh-card-shadow', '--sh-elevation', '--sh-ring'].map(code).join(' ')}.</p>
</section>
</section>`);

// 3. Tones
toc.push({ id: 'tones', label: 'Tones' });
sections.push(`<section id="tones" aria-labelledby="h-tones" class="space-y-4">
<h2 id="h-tones" class="text-3xl font-bold tracking-tight">Tones</h2>
<p class="max-w-prose">Tone classes recolor any component: buttons, badges, alerts, tabs, progress bars, switches. Without a tone, components use <code>--sh-primary</code>.</p>
${table(['Class', 'Preview'], tones.map(t => `<tr><td>${code('tone-' + t)}</td><td class="flex flex-wrap items-center gap-2"><button class="btn btn-sm tone-${t}">Button</button><button class="btn btn-sm btn-outline tone-${t}">Outline</button><span class="badge tone-${t}">Badge</span></td></tr>`))}
${pre('<button class="btn tone-danger">Delete</button>\n<span class="badge tone-success">Live</span>\n<div class="alert tone-warning">Heads up</div>')}
</section>`);

// 4. Components
const compToc = { id: 'components', label: 'Components', sub: [] };
toc.push(compToc);
const compSections = COMPONENTS.map(c => {
  compToc.sub.push({ id: 'c-' + c.id, label: c.title.split(':')[0] });
  const classes = classesOf(c.file);
  const missing = classes.filter(k => !(k in c.desc));
  if (missing.length) warnings.push(`${c.file}.css: no description for ${missing.join(', ')}`);
  const rows = classes.map(k => {
    const attr = k.startsWith('data-');
    return `<tr><td>${code(attr ? k : '.' + k)}</td><td>${c.desc[k] || ''}</td></tr>`;
  });
  const examples = c.examples.map(ex => `<div class="card card-flat overflow-hidden">
${ex.title ? `<div class="card-header"><h4 class="font-semibold m-0">${ex.title}</h4></div>` : ''}<div class="card-body ${ex.wrap || 'flex flex-wrap items-center gap-3'}">
${ex.html}
</div>
${pre(ex.html)}${ex.note ? `<p class="card-footer text-sm m-0">${ex.note}</p>` : ''}
</div>`).join('\n');
  return `<section id="c-${c.id}" aria-labelledby="h-c-${c.id}" class="space-y-4">
<h3 id="h-c-${c.id}" class="text-2xl font-semibold">${c.title}</h3>
<p class="max-w-prose">${c.intro}</p>
${examples}
${table(['Class', 'What it does'], rows)}
</section>`;
});
sections.push(`<section id="components" aria-labelledby="h-components" class="space-y-8">
<h2 id="h-components" class="text-3xl font-bold tracking-tight">Components</h2>
<p class="max-w-prose">Eight small files. Each example below is live, followed by its exact HTML and a table of every class in the source file.</p>
${compSections.join('\n')}
</section>`);

// 5. Utilities
const utilToc = { id: 'utilities', label: 'Utilities', sub: utilSections.map(u => ({ id: 'u-' + u.name, label: u.name })) };
toc.push(utilToc);
sections.push(`<section id="utilities" aria-labelledby="h-utilities" class="space-y-8">
<h2 id="h-utilities" class="text-3xl font-bold tracking-tight">Utilities</h2>
<p class="max-w-prose">${utilCount} utility rules, generated from <code>src/utilities/*.css</code> when this page is built. Class names follow Tailwind. The last column lists the prefixed versions that the build creates, such as <code>md:p-4</code> or <code>hover:bg-primary</code>.</p>
<div class="field max-w-md" id="util-search-box" hidden>
<label class="label" for="util-search">Filter utilities by class name</label>
<input class="input" id="util-search" type="search" placeholder="e.g. flex, p-4, bg-primary" autocomplete="off">
<span class="hint" id="util-count" aria-live="polite"></span>
</div>
${utilSections.map(u => `<section id="u-${u.name}" aria-labelledby="h-u-${u.name}" class="space-y-3">
<h3 id="h-u-${u.name}" class="text-2xl font-semibold">${esc(u.name)}</h3>
<p class="text-muted text-sm m-0">${esc(u.header)} (${u.count} rules)</p>
${table(['Class', 'CSS', 'Variants'], u.rows, 'table table-compact table-hover util-table')}
</section>`).join('\n')}
</section>`);

// 6. Variants
const bpRows = Object.entries(BREAKPOINTS).map(([k, v]) => `<tr><td>${code(k + ':')}</td><td>${v}px and up</td><td>${code(`${k}:grid-cols-3`)}</td></tr>`);
toc.push({ id: 'variants', label: 'Variants and cascade', sub: [{ id: 'v-responsive', label: 'Responsive' }, { id: 'v-state', label: 'Hover and focus' }, { id: 'v-layers', label: 'Cascade layers' }, { id: 'v-opacity', label: 'Opacity modifiers' }, { id: 'v-tailwind', label: 'Differences from Tailwind' }] });
sections.push(`<section id="variants" aria-labelledby="h-variants" class="space-y-8">
<h2 id="h-variants" class="text-3xl font-bold tracking-tight">Variants and cascade</h2>
<section id="v-responsive" aria-labelledby="h-v-responsive" class="space-y-3">
<h3 id="h-v-responsive" class="text-xl font-semibold">Responsive prefixes</h3>
<p class="max-w-prose">Mobile first. An unprefixed class applies everywhere; a prefixed class applies at that width and up. Only layout-critical utilities have them (see the Variants column above).</p>
${table(['Prefix', 'Min width', 'Example'], bpRows)}
${pre('<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">…</div>')}
</section>
<section id="v-state" aria-labelledby="h-v-state" class="space-y-3">
<h3 id="h-v-state" class="text-xl font-semibold">Hover and focus</h3>
<p class="max-w-prose">${code('hover:')} applies on pointer hover. ${code('focus:')} applies on <code>:focus-visible</code>, so it only shows for keyboard focus. They exist on colors, opacity, shadow and underline.</p>
${pre('<a class="text-muted hover:text-primary focus:underline" href="#">Link</a>')}
<p class="max-w-prose">There is no <code>dark:</code> variant. Themes switch dark mode through tokens, so the same classes work in both.</p>
</section>
<section id="v-layers" aria-labelledby="h-v-layers" class="space-y-3">
<h3 id="h-v-layers" class="text-xl font-semibold">Cascade layers</h3>
<p class="max-w-prose">Shine is built with CSS <code>@layer</code>. Utilities beat components, components beat base, and your own unlayered CSS beats everything, with no specificity fights.</p>
${pre(layerDecl)}
</section>
<section id="v-opacity" aria-labelledby="h-v-opacity" class="space-y-3">
<h3 id="h-v-opacity" class="text-xl font-semibold">Opacity modifiers</h3>
<p class="max-w-prose">Opacity is a second class, not a slash. Add ${code('bg-o-50')} next to a background color (also ${code('text-o-*')} and ${code('border-o-*')}).</p>
<div class="flex overflow-x-auto" role="img" aria-label="primary at 10, 25, 50, 75 and 100 percent"><div class="bg-primary bg-o-10 h-12 w-16 flex-none"></div><div class="bg-primary bg-o-25 h-12 w-16 flex-none"></div><div class="bg-primary bg-o-50 h-12 w-16 flex-none"></div><div class="bg-primary bg-o-75 h-12 w-16 flex-none"></div><div class="bg-primary bg-o-100 h-12 w-16 flex-none"></div></div>
${pre('<div class="bg-primary bg-o-50 p-4">Half-transparent primary</div>')}
</section>
<section id="v-tailwind" aria-labelledby="h-v-tailwind" class="space-y-3">
<h3 id="h-v-tailwind" class="text-xl font-semibold">Differences from Tailwind</h3>
<ul class="list-disc list-inside space-y-1 max-w-prose">
<li><strong>Semantic colors.</strong> <code>bg-primary</code>, <code>text-danger</code>, <code>bg-primary-soft</code>, <code>text-muted</code>, <code>bg-surface</code>, plus one <code>gray-50</code> to <code>gray-950</code> scale. Add brand colors as tokens.</li>
<li><strong>Opacity modifier classes</strong> (<code>bg-o-50</code>) instead of <code>bg-primary/50</code>.</li>
<li><strong>Radius scales</strong> with <code>data-radius</code>: <code>rounded-lg</code> is 1.5 times the global radius.</li>
<li><strong>Spacing scales</strong> with <code>--sh-space</code> (default .25rem): <code>p-4</code> is 4 units.</li>
<li><strong>No arbitrary values</strong> like <code>w-[13px]</code>; use inline styles or your own CSS.</li>
<li><strong>No <code>dark:</code> variant.</strong> Use <code>data-theme</code>.</li>
<li><strong>Fewer variants.</strong> Only responsive on layout, hover and focus on colors and effects.</li>
</ul>
</section>
</section>`);

/* TOC html */
const tocHtml = (cls) => `<ul class="${cls}">${toc.map(t => `<li><a href="#${t.id}" class="link font-medium">${t.label}</a>${t.sub ? `<ul class="list-none text-sm space-y-1 mt-1 mb-2 pl-4">${t.sub.map(s => `<li><a href="#${s.id}" class="link text-muted">${esc(s.label)}</a></li>`).join('')}</ul>` : ''}</li>`).join('')}</ul>`;

const DESC = `Reference for every Shine CSS class and data attribute: master knobs, tones, components with live examples, and ${utilCount} utility classes with their CSS.`;
const html = `<!doctype html>
<html lang="en" data-theme="auto">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Shine CSS reference: classes, data attributes and tokens</title>
<meta name="description" content="${esc(DESC)}">
<meta property="og:type" content="website">
<meta property="og:title" content="Shine CSS reference: classes, data attributes and tokens">
<meta property="og:description" content="${esc(DESC)}">
<link rel="stylesheet" href="../dist/shine.min.css">
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="border-b">
<nav class="navbar container mx-auto" aria-label="Main">
<a class="navbar-brand" href="reference.html">Shine</a>
<ul class="navbar-nav hidden md:flex">
<li><a href="#getting-started">Getting started</a></li>
<li><a href="#knobs">Knobs</a></li>
<li><a href="#components">Components</a></li>
<li><a href="#utilities">Utilities</a></li>
<li><a href="index.html">Playground</a></li>
</ul>
<div class="navbar-end flex items-center gap-2">
<a class="btn btn-sm btn-ghost md:hidden" href="index.html">Playground</a>
<button class="btn btn-sm btn-outline" type="button" id="theme-toggle" hidden>Toggle theme</button>
</div>
</nav>
</header>
<button class="btn lg:hidden fixed bottom-0 right-0 m-4 z-40 shadow-lg" type="button" popovertarget="toc">Contents</button>
<nav id="toc" popover class="offcanvas" aria-label="Table of contents">
<div class="offcanvas-header"><strong>Contents</strong><button class="btn-close" type="button" popovertarget="toc" popovertargetaction="hide" aria-label="Close contents"></button></div>
<div class="offcanvas-body">${tocHtml('list-none p-0 m-0 space-y-2')}</div>
</nav>
<div class="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-4 gap-8">
<aside class="hidden lg:block lg:col-span-1 border-r pr-4">
<nav class="sticky top-0 max-h-screen overflow-y-auto py-8" aria-label="Table of contents">
${tocHtml('list-none p-0 m-0 space-y-2')}
</nav>
</aside>
<main id="main" class="lg:col-span-3 min-w-0 py-8 space-y-8">
<header class="space-y-3">
<h1 class="text-4xl font-bold tracking-tight">Shine CSS reference</h1>
<p class="text-lg text-muted max-w-prose">Every class and data attribute in Shine, with live examples. This page is generated from the CSS source, so it always matches the code. <a class="link" href="index.html">Try the playground</a>.</p>
</header>
${sections.join('\n')}
</main>
</div>
<footer class="border-t">
<div class="container mx-auto px-4 py-6 text-sm text-muted flex flex-wrap justify-between gap-2">
<span>Shine CSS. MIT license. Generated from <code>src/</code> by <code>node docs.js</code>.</span>
<a class="link" href="index.html">Playground</a>
</div>
</footer>
<script>
(function () {
  var q = function (s) { return document.querySelector(s); };
  var t = q('#theme-toggle'), h = document.documentElement;
  t.hidden = false;
  t.onclick = function () {
    var dark = getComputedStyle(h).colorScheme.indexOf('dark') > -1;
    h.setAttribute('data-theme', dark ? 'light' : 'dark');
  };
  var box = q('#util-search-box'), s = q('#util-search'), c = q('#util-count');
  var rows = [].slice.call(document.querySelectorAll('.util-table tr[data-c]'));
  box.hidden = false;
  s.oninput = function () {
    var v = s.value.trim().toLowerCase(), n = 0;
    rows.forEach(function (r) { var m = !v || r.dataset.c.indexOf(v) > -1; r.hidden = !m; if (m) n++; });
    document.querySelectorAll('.util-table tr[data-g]').forEach(function (g) { g.hidden = !!v; });
    c.textContent = v ? n + ' of ' + rows.length + ' match' : '';
  };
})();
</script>
</body>
</html>
`;

fs.mkdirSync(path.join(ROOT, 'docs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'docs/reference.html'), html);
warnings.forEach(w => console.warn('docs: ' + w));
console.log(`docs/reference.html  ${(html.length / 1024).toFixed(1)} KB  (${utilCount} utility rules, ${tokens.length} tokens, ${knobs.size} knobs)`);
