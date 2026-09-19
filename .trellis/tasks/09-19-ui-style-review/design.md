# Design: Web Interface Guidelines pass

## Tokens

Keep light paper theme. Repoint interactive chrome to ink:

| Token | After |
| --- | --- |
| `--accent` | `#1a1612` (same as `--ink`) |
| `--accent-soft` | warm wash `rgba(26, 22, 18, 0.08)` or `#ebe4d6` |
| `--stone` | `#b4ab9e` |
| `--now` | warm rust `#8b3a2a` (replaces `#e11d48`) |
| `--habit` / `--habit-soft` | clay `#7a4a3a` / `#efe4d8` |
| `--list-fallback` | `#57534e` |
| `--pill-off` / `--pill-off-ink` | `#d6d3cd` / `#3f3a34` |

Project/tag **user colors** in `LIST_COLORS` stay as-is (including indigo as a swatch choice).

## Focus

- Keep `:focus { outline: none }` + `:focus-visible { outline: 2px solid var(--accent) }`.
- Composer: `.composer:has(:focus-visible)` instead of `:focus-within`.
- Skip link may keep `:focus` so Tab reveals it.
- Selected calendar bars: class `.is-selected` + CSS outline `var(--ink)`, not inline hex.

## Layout

`#main-view` wraps `AppFrame` children as a real grid cell (`display: grid`, not `contents`) so skip-link and `scroll-margin-top` work. Rail + sidebar stay siblings; main+detail live inside `#main-view`.

## Dates

`src/lib/dates.ts` owns `formatDayLabel` via `Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" })`. `weekdayLabels` uses `{ weekday: "narrow" }` over a known week. `summary.ts` calls `formatDayLabel`, does not `date-fns` format for display.

## Destructive / forms

Reuse `ConfirmDialog` for abandon. Empty entity names: button stays enabled; `onSubmit` no-ops if `!name.trim()`.
