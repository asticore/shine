<p align="center">
  <a href="https://github.com/asticore/shine">
    <img src="docs/logo.svg" alt="Shine CSS logo" width="88" height="88">
  </a>
</p>

<h1 align="center">Shine CSS</h1>

<p align="center">
  <strong>Ultra-light, pure-CSS framework: utility classes, ready-made components and master design knobs.</strong>
  <br>
  One stylesheet. No JavaScript. No build step. ~15 KB gzipped.
  <br>
  <br>
  <a href="https://asticore.github.io/shine/docs/reference.html"><strong>Class reference</strong></a>
  ·
  <a href="https://asticore.github.io/shine/docs/">Theme builder &amp; playground</a>
  ·
  <a href="#quick-start">Quick start</a>
  ·
  <a href="https://github.com/asticore/shine/issues">Report a bug</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/gzip-15.7%20KB-4f46e5" alt="Size: 15.7 KB gzip">
  <img src="https://img.shields.io/badge/JavaScript-none-16a34a" alt="No JavaScript required">
  <img src="https://img.shields.io/badge/dependencies-0-16a34a" alt="Zero dependencies">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license"></a>
</p>

## Why Shine?

**Shine** is a lightweight CSS framework for building fast, accessible, SEO-friendly websites. It gives you utility classes for fine control and ready-made components for speed, all in a single file smaller than most hero images.

- **Master knobs.** Set your brand color, dark or light theme, corner roundness (levels 0–5), shadow depth and spacing density once on `<html>`. Every button, card, input and utility follows.
- **Utility classes, no compiler.** Write `flex`, `p-4`, `md:grid-cols-3` and `text-lg` straight in your HTML. Nothing to install or build.
- **Components without JavaScript.** Modals, off-canvas menus, dropdowns, tooltips, toasts, accordions and tabs run on native HTML: `<dialog>`, `popover` and `<details>`.
- **Small enough to forget about.** About 15 KB gzipped for the whole framework, or less with `node build.js --only=...`.
- **Semantic and accessible.** Styles target real HTML elements and ARIA states. Includes focus rings, a skip link, reduced-motion support and print styles.
- **No specificity fights.** Built on CSS cascade layers, so your own CSS always wins without `!important`.

## Quick start

Add one line to your `<head>`:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/asticore/shine@main/dist/shine.min.css">
```

Then build with classes:

```html
<html data-theme="auto" data-radius="3" style="--sh-primary:#0ea5e9">
  <body>
    <main class="center section stack">
      <h1 class="text-4xl font-bold">Hello, Shine</h1>
      <div class="card">
        <div class="card-body">
          <p class="text-muted">Change the knobs on &lt;html&gt; and everything restyles.</p>
          <button class="btn mt-4">Get started</button>
        </div>
      </div>
    </main>
  </body>
</html>
```

## Contents

- [How Shine compares](#how-shine-compares)
- [Master knobs](#1-master-knobs)
- [Tones](#2-tones)
- [Components](#3-components)
- [Utilities](#4-utilities)
- [Cascade](#5-cascade)
- [Build / customize](#build--customize)

## How Shine compares

| | **Shine** | Bootstrap 5 | Tailwind CSS 4 | UnoCSS | Angular Material | Foundation 6 | daisyUI 5 |
|---|---|---|---|---|---|---|---|
| Size (min + gzip) | **~15.7 KB** CSS, everything included | 30 KB CSS + 23 KB JS (5.3.8) | Usually under 10 KB **after** a build strips unused classes; the no-build browser script is 72 KB of JS | Depends on build; runtime script 57 KB of JS | Styles ship inside the Angular app JS | 17 KB CSS + 39 KB JS (6.9) | Depends on Tailwind build; full CDN CSS 96 KB |
| Works without a build step | **Yes**, one `<link>` | Yes | No (CLI / PostCSS / Vite) | No (or runtime script) | No (Angular app) | Yes | No (Tailwind plugin) |
| Modals, dropdowns, off-canvas without JS | **Yes** (native `dialog`, `popover`, `details`) | No (needs bootstrap.js) | No components | No components | No (Angular components) | No (JS plugins) | Mostly |
| Utility classes | **Yes** | Partial | Yes | Yes | No | Partial | Yes (via Tailwind) |
| Ready-made components | **Yes** | Yes | No | No | Yes | Yes | Yes |
| Framework-agnostic (plain HTML, React, Vue, Angular…) | **Yes** | Yes | Yes | Yes | Angular only | Yes | Yes |
| Global corner / shadow / density levels | **One attribute each** (`data-radius="0–5"`) | Sass / CSS variables | Theme config | Theme config | Sass theming API | Sass settings | Theme variables |
| Per-component overrides (e.g. only buttons pill-shaped) | **Yes** (`data-btn-radius`) | Sass variables | Per class | Per class | Sass mixins | Sass | Theme variables |
| Dark mode | `data-theme`, per section | `data-bs-theme`, per section | `dark:` variant | `dark:` variant | Theme classes | Custom | `data-theme`, per section |

Sizes measured with `gzip -9` on each project's npm distribution (Bootstrap 5.3.8, Foundation 6.9.0, daisyUI 5.7, @tailwindcss/browser 4.3, @unocss/runtime 66); they change between versions.

**Inspiration.** Shine's utility class names follow conventions popularized by [Tailwind CSS](https://tailwindcss.com), so they feel familiar. Its component set takes cues from [Bootstrap](https://getbootstrap.com). Unlike either, Shine is a single prebuilt stylesheet driven by a few global knobs.

## 1. Master knobs

Set them on `<html>` for the whole site, or on any element to scope them to that subtree.

```html
<html data-theme="dark" data-radius="3" data-shadow="2" data-density="comfortable"
      style="--sh-primary:#0ea5e9; --sh-accent:#f59e0b">
```

| Knob | Values | Affects |
|---|---|---|
| `data-theme` | `light` · `dark` · `auto` (follows OS) | background, surfaces, text, borders, shadows |
| `data-radius` | `0`–`5` | every rounded thing (`.btn`, `.card`, `.input`, `rounded-*`) |
| `data-btn-radius` · `data-card-radius` · `data-input-radius` | `0`–`5` | just that component (`5` = pill for buttons/inputs) |
| `data-shadow` | `0`–`5` | card elevation (and `.shadow-elevation`) |
| `data-density` | `compact` · `comfortable` | component padding |
| `--sh-primary` etc. | any color | brand: primary, secondary, accent, success, warning, danger, info |

Sections can flip theme on their own — a dark hero inside a light page:

```html
<section data-theme="dark" class="p-12">…</section>
```

Re-brand one area only:

```html
<div style="--sh-primary:#e11d48"> <button class="btn">Rose button</button> </div>
```

## 2. Tones

Any component takes a tone class:

```html
<button class="btn tone-danger">Delete</button>
<span class="badge tone-success">Live</span>
<div class="alert tone-warning">Heads up</div>
```

`tone-primary · secondary · accent · success · warning · danger · info · neutral`

## 3. Components

Small set, all driven by the knobs above:

- **Button** `btn` + `btn-sm btn-lg` · `btn-outline btn-soft btn-ghost btn-link` · `btn-block btn-icon`
- **Card** `card` · `card-header card-body card-footer card-title card-media` · `card-flat`
- **Form** `input select textarea` · `checkbox radio switch` · `label field hint` · `input-sm input-lg`
- **Badge** `badge` · `badge-solid badge-outline` · `avatar` · `divider`
- **Alert** `alert` · `alert-solid alert-title` · `kbd`
- **Modal** `<dialog class="modal">` opened by `<button command="show-modal" commandfor="id">` · `modal-header modal-body modal-footer` · `modal-sm modal-lg modal-full` · `btn-close`
- **Offcanvas** `<aside popover id="menu" class="offcanvas">` opened by `<button popovertarget="menu">` · `offcanvas-right offcanvas-top offcanvas-bottom`
- **Dropdown** `<details class="dropdown">` + `menu`, or `<div popover class="menu dropdown-menu">` (closes on outside click / Esc)
- **Tooltip** `data-tooltip="text"` · `data-tooltip-pos="bottom|left|right"`
- **Nav** `navbar navbar-brand navbar-nav navbar-end` · `breadcrumb` · `pagination` · `tabs tabs-pills`
- **Content** `accordion` (on `<details name>`) · `table table-striped table-hover` · `progress` · `prose` · `skip-link`

All of it works with zero JavaScript: native `<dialog>`, `popover` and `<details>` give you open/close, Esc and focus handling.

Full class guide: `docs/reference.html` (generated from the CSS by `node docs.js`).

## 4. Utilities

Layout, flex/grid, spacing, sizing, typography, color, borders, shadows, interactivity —
`flex items-center gap-4 p-6 md:grid-cols-3 text-lg font-semibold bg-surface rounded-lg hover:bg-primary`.

Differences from Tailwind, on purpose:
- **Colors are semantic**: `bg-primary`, `text-danger`, `bg-primary-soft`, `text-muted`, `bg-surface`, plus one `gray-50…950` scale. Add your own brand colors as tokens instead of shipping 250 colors.
- **Opacity** is a modifier class: `bg-primary bg-o-50` (instead of `bg-primary/50`).
- **Radius utilities scale** with `data-radius`: `rounded-lg` = 1.5 × the global radius.
- **Spacing scales** with `--sh-space` (default `.25rem`): `p-4` = 4 units.
- **No `dark:` variant** — themes handle dark mode via tokens.
- Variants: `sm: md: lg: xl:` on layout-critical utilities, `hover:` / `focus:` on colors, opacity, shadow.

Known limitation: `data-shadow` picks its shadow on the element that carries it, so with
`<html data-shadow="3">` a nested `data-theme="dark"` section keeps the light-theme shadow strength.
Put `data-shadow` on (or inside) the dark section if that matters.

## 5. Cascade

Built with `@layer shine.tokens, reset, base, components, utilities`.
Utilities always beat components; **your own CSS always beats Shine** — no specificity fights, no `!important`.

## Build / customize

```bash
node build.js                              # full build → dist/
node build.js --exclude=alert,badge        # drop modules
node build.js --only=tokens,reset,base,button,card   # just what you need
```

Tests: `npm install && npx playwright install && npm test` runs a smoke test in Chromium, Firefox and WebKit (also run by CI on every push and pull request).

No dependencies. Or skip the build and `@import "shine/src/index.css"` (variant classes need the build).

Adding a class: see [CONVENTIONS.md](CONVENTIONS.md). Live playground: `docs/index.html`.
