# Changelog

## Unreleased

### Widgets add-on (`dist/shine-widgets.min.css`, ~3 KB gzip, load after `shine.css`)
Kept out of the core so `shine.min.css` stays within its 17.5 KB gzip budget.
- Data table (#14): toolbar, search/filter slots, page bar, empty state, selectable rows, resize handle, comfortable density, sticky header
- Timeline (#15): vertical, horizontal, alternating, icon/image/dot markers
- Stepper (#16): horizontal/vertical, done/current/error, small/large
- Star rating (#17): display (`--sh-rating`) and radio input, half stars, sizes
- Skeleton (#18): text, title, avatar, card placeholders
- Calendar (#19): month grid, today, selected, outside days, event dots, ranges

## v1.0.0

First stable release. One stylesheet, no JavaScript, no build step: about 17 KB gzipped.

### Master knobs
- `data-theme` (light / dark / auto, per section), `data-radius` 0–5, `data-btn-radius`, `data-card-radius`, `data-input-radius`, `data-shadow` 0–5, `data-density`
- Brand tokens `--sh-primary` … `--sh-info`, re-themable on any element; `tone-*` classes recolor any component
- Page rhythm: `--sh-space`, `--sh-center-max`, `--sh-section-gap`

### Components
- Buttons (solid, outline, soft, ghost, link, sizes, icon, block), button groups, split buttons (`btn-caret` + popover menu)
- Cards, forms (input, select, textarea, checkbox, radio, switch, range, file, input groups, floating labels, validation)
- Badges, avatars, avatar groups, dots, indicators, kbd, alerts, toasts
- Modal, off-canvas, dropdowns (details and popover), tooltips — native `dialog` / `popover` / `details`, no JS
- Navbar, breadcrumb, pagination, tabs, list groups, accordion, carousel (scroll-snap)
- Tables: striped, hover, bordered, highlighted rows, sort arrows, sticky header / column, phone stacking
- Progress, meter, stat, prose, skip link
- Layout: stack, cluster, center, section, full-bleed, grid-hairline, eyebrow, fluid display headings, banner, segmented switch
- Frosted glass (`glass`, `modal-blur`)

### Utilities
- Layout, flex/grid, spacing (incl. RTL-aware `ps/pe/ms/me`), sizing, typography, semantic colors + gray scale with opacity modifiers, borders and radius scaled by the radius knob, shadows (incl. `shadow-inner`, `shadow-tone`), backdrop blur, interactivity, background images, floats, container queries (`cq-md:`)
- Variants: `sm: md: lg: xl:`, `hover:`, `focus:`, `group-hover:`, `print:`

### Quality
- Cascade layers: utilities beat components, your CSS beats Shine, no `!important`
- AA contrast for brand text in light and dark themes, reduced-motion and reduced-transparency support, print styles
- Cross-browser smoke tests (Chromium, Firefox, WebKit) in CI

### Docs
- Theme builder, class playground with 16 section templates, component gallery
- Generated class reference
