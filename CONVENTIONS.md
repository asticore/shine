# Shine conventions

Rules every source file follows. Read this before adding a class.

## Goals
1. **Pure CSS.** No JS runtime. `build.js` is optional, zero-dep, only concatenates/minifies/expands variants.
2. **Ultra light.** Budget: `dist/shine.min.css` ≤ 16 KB gzip. Ship the 90% case, not every Tailwind value.
3. **Master knobs first, granular second.** Change one token → whole site follows. Utilities override anything locally.

## Files & layers
- `src/index.css` lists every module and its `@layer`. Add new files there.
- Source files do **not** wrap themselves in `@layer` — `index.css` / `build.js` do it.
- Order: `shine.tokens, shine.reset, shine.base, shine.components, shine.utilities`.
  Utilities beat components regardless of specificity. User unlayered CSS beats all.

## Tokens (`src/tokens.css`)
- Prefix `--sh-`. Only **base** tokens at `:root`.
- **Derive at use-site**, never at `:root`. CSS resolves `var()` where a property is declared,
  so `:root { --x-soft: color-mix(... var(--sh-primary) ...) }` would NOT update when a section
  overrides `--sh-primary`. Write the `color-mix()` inside the utility/component rule instead.
- Component knobs are **not defined at root**; read them with fallbacks:
  `border-radius: var(--sh-btn-radius, var(--sh-radius));`
- Spacing uses the unit: `padding: calc(var(--sh-space) * 4);`
- Component padding also multiplies by `--sh-density`.

## Global knobs (data attributes, work on `<html>` or any element)
| attribute | values | sets |
|---|---|---|
| `data-theme` | `light` `dark` `auto` | surfaces/text/border; element paints its own bg |
| `data-radius` | `0`–`5` | `--sh-radius` (everything rounded) |
| `data-btn-radius` / `data-card-radius` / `data-input-radius` | `0`–`5` | per component |
| `data-shadow` | `0`–`5` | `--sh-elevation` (cards etc.) |
| `data-density` | `compact` `comfortable` | `--sh-density` |
| `style="--sh-primary:#e11d48"` | any token | re-themes the subtree |

## Tones
`.tone-{primary,secondary,accent,success,warning,danger,info,neutral}` set `--sh-tone` / `--sh-on-tone`.
Components color themselves with `var(--sh-tone, var(--sh-primary))` and
`var(--sh-on-tone, var(--sh-on-primary))`. So `btn tone-danger`, `badge tone-success`, `alert tone-warning`.
Soft/outline/ghost styles derive from the tone with `color-mix(in oklab, <tone> 15%, transparent)`.

## Colors
- Semantic only (primary…info, bg, surface, surface-2, text, text-muted, border) + one neutral `gray-50…950` scale. No full Tailwind palette — it is the main source of bloat. Users add brand colors as tokens.
- Opacity without generating classes: color utilities use
  `color-mix(in oklab, <color> var(--sh-bg-o, 100%), transparent)` and `.bg-o-50 { --sh-bg-o: 50% }` (same for `--sh-text-o`, `--sh-border-o`).

## Variants (build only)
Wrap rules that need prefixes:
```css
/* @variants responsive hover focus */
.flex { display: flex; }
/* @end */
```
- `responsive` → `sm: md: lg: xl:` (640/768/1024/1280, mobile-first).
- `hover` → `hover:x:hover`, `focus` → `focus:x:focus-visible`.
- Inside a block: flat rules only, every selector starts with one class. No nested `@media`.
- Use variants sparingly (each responsive block costs ×5). Good candidates: display, flex/grid
  direction/cols/span, gap, padding, margin (common steps), width/max-width, text size/align, order.
  Hover: colors, opacity, shadow, underline. No `dark:` variant — themes handle dark mode.

## Naming
- Follow Tailwind names where they exist (`flex`, `p-4`, `text-lg`, `rounded-lg`, `grid-cols-3`).
- Escape specials: `.w-1\/2`, `.p-0\.5`, `.-mt-2`.
- Components: short noun + modifiers: `.btn .btn-sm .btn-lg .btn-outline .btn-ghost .btn-soft .btn-block`.
- No `!important`, no IDs, no element-qualified utilities.

## Style
- 2-space indent, one declaration per line in components; utilities may be one rule per line.
- Short comment header per file. No vendor prefixes unless still required (`-webkit-` for `backdrop-filter`, `appearance`, text-size-adjust).
