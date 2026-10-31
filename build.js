#!/usr/bin/env node
/* Shine build — zero dependencies.
   Reads src/index.css, inlines each @import into its @layer, expands variant
   blocks, writes dist/shine.css + dist/shine.min.css.

   Variant blocks (in any source file):
     /* @variants responsive hover focus *\/
     .flex { display: flex; }
     /* @end *\/
   generates  .sm\:flex .md\:flex .lg\:flex .xl\:flex  (min-width media queries)
              .hover\:flex:hover   .focus\:flex:focus-visible

   Usage:
     node build.js                      full build
     node build.js --exclude=alert,badge   drop modules by file name
     node build.js --only=tokens,reset,base,button   keep only these
*/
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280 };
const SRC = path.join(__dirname, 'src');
const DIST = path.join(__dirname, 'dist');

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v = ''] = a.replace(/^--/, '').split('=');
  return [k, v.split(',').filter(Boolean)];
}));

const index = fs.readFileSync(path.join(SRC, 'index.css'), 'utf8');
const layerDecl = (index.match(/@layer[^;{]+;/) || [''])[0];
const imports = [...index.matchAll(/@import\s+url\(["']?([^"')]+)["']?\)\s+layer\(([^)]+)\);/g)]
  .map(m => ({ file: m[1], layer: m[2], name: path.basename(m[1], '.css') }))
  .filter(i => !args.exclude || !args.exclude.includes(i.name))
  .filter(i => !args.only || args.only.includes(i.name));

const VARIANTS = ['responsive', 'hover', 'focus'];

// Split a selector list on top-level commas only (keeps :is(a, b) intact)
const splitSelectors = sel => {
  const parts = []; let depth = 0, cur = '';
  for (const ch of sel) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch;
  }
  return [...parts, cur];
};

const prefixSelector = (sel, prefix, pseudo = '') =>
  splitSelectors(sel).map(s => {
    const m = s.trim().match(/^\.((?:\\.|[\w-])+)([\s\S]*)$/);
    if (!m) throw new Error(`Variant blocks need class selectors, got: "${s.trim()}"`);
    return `.${prefix}\\:${m[1]}${pseudo}${m[2]}`;
  }).join(',');

const rulesOf = css => [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map(m => ({ sel: m[1].trim(), body: m[2].trim() }));

// Group by layer, preserving order
const layers = new Map();
const missing = [];
for (const imp of imports) {
  const file = path.join(SRC, imp.file);
  if (!fs.existsSync(file)) { missing.push(imp.file); continue; }
  let css = fs.readFileSync(file, 'utf8');
  if (!layers.has(imp.layer)) layers.set(imp.layer, { css: [], hover: [], focus: [], bp: Object.fromEntries(Object.keys(BREAKPOINTS).map(k => [k, []])) });
  const L = layers.get(imp.layer);
  css = css.replace(/\/\*\s*@variants([^*]*)\*\/([\s\S]*?)\/\*\s*@end\s*\*\//g, (_, kinds, block) => {
    const want = kinds.trim().split(/\s+/);
    const bad = want.filter(k => !VARIANTS.includes(k));
    if (bad.length) throw new Error(`${imp.file}: unknown variant "${bad.join(', ')}" (use ${VARIANTS.join(', ')})`);
    for (const r of rulesOf(block)) {
      if (want.includes('hover')) L.hover.push(`${prefixSelector(r.sel, 'hover', ':hover')}{${r.body}}`);
      if (want.includes('focus')) L.focus.push(`${prefixSelector(r.sel, 'focus', ':focus-visible')}{${r.body}}`);
      if (want.includes('responsive')) for (const bp in BREAKPOINTS) L.bp[bp].push(`${prefixSelector(r.sel, bp)}{${r.body}}`);
    }
    return block;
  });
  L.css.push(`/* ${imp.file} */\n${css.trim()}`);
}

let out = `/*! Shine CSS | MIT */\n${layerDecl}\n`;
for (const [name, L] of layers) {
  let body = L.css.join('\n\n');
  if (L.hover.length) body += `\n\n/* hover: */\n${L.hover.join('\n')}`;
  if (L.focus.length) body += `\n\n/* focus: */\n${L.focus.join('\n')}`;
  for (const bp in BREAKPOINTS) if (L.bp[bp].length)
    body += `\n\n@media (min-width: ${BREAKPOINTS[bp]}px) {\n${L.bp[bp].join('\n')}\n}`;
  out += `\n@layer ${name} {\n${body}\n}\n`;
}

const minify = css => css
  .replace(/\/\*(?!!)[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,>])\s*/g, '$1')
  .replace(/:\s+/g, ':')
  .replace(/;}/g, '}')
  .replace(/\b0\./g, '.')
  .trim();

fs.mkdirSync(DIST, { recursive: true });
const min = minify(out);
fs.writeFileSync(path.join(DIST, 'shine.css'), out);
fs.writeFileSync(path.join(DIST, 'shine.min.css'), min);

const kb = n => (n / 1024).toFixed(1) + ' KB';
const gz = zlib.gzipSync(min, { level: 9 }).length;
const br = zlib.brotliCompressSync(min).length;
if (missing.length) console.warn('missing (skipped):', missing.join(', '));
console.log(`dist/shine.min.css  ${kb(min.length)}  gzip ${kb(gz)}  brotli ${kb(br)}  (${imports.length - missing.length} modules)`);
const BUDGET_GZ = 16 * 1024;
if (gz > BUDGET_GZ) { console.error(`over gzip budget (${kb(BUDGET_GZ)})`); process.exitCode = 1; }
