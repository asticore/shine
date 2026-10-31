# Shine

Pure-CSS utility framework. Tailwind class names, no build step required, ~16 KB gzip ceiling.
Turn a few **master knobs** and the whole site follows; drop to utility classes when you want granular control.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/asticore/shine/dist/shine.min.css">
```

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

## 4. Utilities (Tailwind names)

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

No dependencies. Or skip the build and `@import "shine/src/index.css"` (variant classes need the build).

Adding a class: see [CONVENTIONS.md](CONVENTIONS.md). Live playground: `docs/index.html`.
