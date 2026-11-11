# E-Dukan Design System

A macOS-inspired visual language for the E-Dukan dashboard: calm neutral surfaces, translucent "glass" chrome, a single system-blue accent, and the platform's own system font. This file is the source of truth for humans and AI agents.

| Where | What |
| --- | --- |
| `src/index.css` | All tokens (`@theme`), semantic CSS variables (`:root` / `.dark`), utilities (`material`, `surface-card`, `menu-item-*`) |
| `docs/design-tokens.json` | Same tokens, machine-readable (W3C design-tokens format) |
| `src/components/ui/*` | Primitives (Button, Input, Select, Dialog, Badge, Alert…) already styled with these tokens |

## 1. Principles

1. **Content first, chrome recedes.** App chrome (sidebar, toolbar, sticky bars) uses translucent `material`; content sits on opaque `surface-card` panels.
2. **One accent.** System blue (`accent`, `brand-*`) marks primary actions, selection and links, and nothing else. Status is shown with success/warning/danger, never with the accent.
3. **Hairlines over heavy borders.** Separate with `border-separator` (8% black / 9% white) and soft shadows, not dark lines.
4. **Both appearances, always.** Every surface and text colour must work in light and dark. Semantic tokens do this for you, so prefer them over raw `gray-*` + `dark:` pairs.
5. **Accessible by default.** Body text ≥ 4.5:1 contrast, visible focus rings, `prefers-reduced-transparency` respected, RTL via logical properties.

## 2. Tokens

### Semantic colours (preferred in new code)

Defined as CSS variables that switch under `.dark`, exposed to Tailwind via `@theme inline`. Use them as `bg-*`, `text-*`, `border-*`, `ring-*`.

| Token | Light | Dark | Use for |
| --- | --- | --- | --- |
| `canvas` | `#F5F5F7` | `#161618` | App background (body) |
| `surface` | `#FFFFFF` | `#1E1E20` | Cards, tables, form sections |
| `surface-raised` | `#FFFFFF` | `#2A2A2D` | Dialogs, popovers |
| `separator` | `rgb(0 0 0 / 8%)` | `rgb(255 255 255 / 9%)` | Borders, dividers, rings |
| `label` | `#1D1D1F` | `#F5F5F7` | Primary text, headings |
| `label-secondary` | `#6E6E73` | `#A1A1A6` | Descriptions, metadata, table secondary text |
| `label-tertiary` | `#8E8E93` | `#7C7C80` | Placeholders, disabled text, captions |
| `fill` / `fill-strong` | grey 12% / 20% | grey 24% / 36% | Hover backgrounds, chips, code |
| `accent` | `#007AFF` | `#0A84FF` | Primary action, links, selection |
| `accent-soft` | blue 10% | blue 18% | Active nav item, selected row |
| `success` / `warning` / `danger` | `#248A3D` / `#C93400` / `#D70015` | `#30D158` / `#FF9F0A` / `#FF453A` | Status text and icons |

### Scales (existing code, charts, badges)

- `brand-50 … brand-950`: system blue. `brand-500` = `#007AFF`, `brand-400` ≈ the dark-mode accent.
- `gray-25 … gray-950`: neutral macOS greys. Contrast on white: `gray-500` 5.0:1, `gray-600` 7.6:1, `gray-800` 14:1. **Do not use `gray-400` for text** except placeholders.
- Status palettes (`green-*`, `red-*`, `amber-*`, `sky-*`) are Tailwind defaults and are used by `Badge` and `Alert`.

### Typography

System stack: `-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, "Segoe UI Variable", system-ui`. That gives San Francisco on Apple devices and Inter (loaded from Google Fonts) elsewhere. `font-outfit` is a legacy alias of `font-sans`.

| Role | Classes |
| --- | --- |
| Page title (breadcrumb) | `text-title-lg font-semibold text-label` |
| Section heading | `text-lg font-semibold text-label` |
| Card heading | `text-base font-semibold text-label` |
| Body / table | `text-sm text-label` |
| Secondary | `text-sm text-label-secondary` |
| Caption / hint | `text-xs text-label-secondary` |
| Numbers in tables | add `tabular-nums` |
| Code / IDs | `font-mono` |

### Radii, elevation, motion

| Token | Value | Use |
| --- | --- | --- |
| `--radius-control` | 10px | Buttons, inputs, selects (`rounded-[10px]`, `rounded-lg`) |
| `--radius-card` | 16px | `surface-card`, floating sidebar |
| `--radius-window` | 22px | Dialogs |
| `shadow-card` | hairline + 3px | Cards (built into `surface-card`) |
| `shadow-theme-lg` | soft lift | Floating sidebar |
| `shadow-window` | deep, diffuse | Dialogs, menus, selects, popovers |
| `--ease-mac` | `cubic-bezier(0.32, 0.72, 0, 1)` | Open/close transitions (`ease-(--ease-mac)`) |

### Materials (glass)

| Utility | Use |
| --- | --- |
| `material` | Sidebar panel, sticky toolbar/header, sticky bottom action bars |
| `material-thick` | Dropdown menus, select lists, mobile sidebar sheet |

Both fall back to opaque `surface` when the user prefers reduced transparency. **Never put body content directly on glass**; content goes on `surface-card`.

## 3. Components

Use the primitives in `src/components/ui`; do not hand-roll buttons or inputs.

| Need | Use | Notes |
| --- | --- | --- |
| Primary action | `<Button>` | One per view region. Destructive: `variant="destructive"` |
| Secondary action | `<Button variant="outline">` | Cancel, filters, "Add variant" |
| Icon action in tables | `<Button variant="ghost" size="icon-sm" aria-label=…>` | Always give an `aria-label` |
| Status | `<Badge variant="light" color="success\|warning\|error\|gray\|primary">` | Use `size="sm"` in tables |
| Inline message | `<Alert variant="success\|info\|warning\|destructive">` | Icon first, `AlertTitle` + optional `AlertDescription` |
| Text field | `<Field>` + `<FieldLabel>` + `<Input>` + `<FieldError>` | React Hook Form + Zod; see any `schema.ts` |
| Choice | `<Select items=…>` | Pass `items` so the trigger shows labels |
| On/off | `<Switch>` | Labels on the left, switch on the right in settings rows |
| Modal | `<Dialog>` + `<DialogContent>` | Mount the form *inside* the content so it resets on each open |
| Panel | `surface-card` utility or `<Card>` | Default padding `p-5 sm:p-6` |

## 4. Page recipes

Copy the closest existing page instead of starting from scratch.

| Page type | Canonical example |
| --- | --- |
| List + filters + pagination | `src/pages/main/products/index.tsx` |
| CRUD list with dialogs | `src/pages/main/catalog/shared/category-manager.tsx` |
| Full-page editor with sticky save bar | `src/pages/main/products/editor/index.tsx` |
| Settings sections | `src/pages/main/profile/` |

Layout rules:

- Every page starts with `<PageMeta>` + `<PageBreadcrumb pageTitle=…>`.
- Panels: `surface-card`, gaps `space-y-6` between sections, `gap-3`/`gap-5` inside.
- Tables: header row `border-y border-separator`, body `divide-y divide-separator`, cells `px-4 py-3.5`, first/last cell `ps-5 sm:ps-6` / `pe-5 sm:pe-6`.
- Empty, loading (skeleton rows) and error (message + "Try again") states are required for every list.
- Sticky bottom bars use `material border-t border-separator` and `lg:ps-(--sidebar-width)`.

## 5. Do / Don't

| Do | Don't |
| --- | --- |
| `bg-surface text-label border-separator` | `bg-white dark:bg-gray-900 text-gray-800 dark:text-white/90` in new code |
| `text-label-secondary` for descriptions | `text-gray-400` for readable text (fails contrast) |
| `accent` for the one primary action | Blue for status or decoration |
| Logical spacing: `ms-*`, `pe-*`, `inset-s-*`, `text-start` | `ml-*`, `pr-*`, `left-*`, `text-left` (breaks Arabic RTL) |
| Add every new string to all four `src/messages/*.json` | Hard-coded English in JSX |
| `material` only for chrome | Glass behind paragraphs or tables |

## 6. Accessibility checklist

- Text contrast ≥ 4.5:1 (use `label` / `label-secondary`, never `gray-400` for text).
- Every icon-only button has `aria-label`; decorative icons get `aria-hidden="true"`.
- Inputs have a visible `FieldLabel`; errors render with `FieldError` and `aria-invalid`.
- Keep the default focus rings; don't remove `outline` without a replacement ring.
- Test light, dark, and Arabic (RTL) before finishing UI work.

## 7. Changing the system

1. Edit tokens in `src/index.css` (`@theme` for scales, `:root` / `.dark` for semantic variables).
2. Mirror the change in `docs/design-tokens.json` and the tables in this file.
3. New utilities need a matching group in `src/utils/cn.ts` (tailwind-merge).
4. Run `npm run build && npm run lint`, then check a list page and a form page in light, dark and Arabic (RTL).
