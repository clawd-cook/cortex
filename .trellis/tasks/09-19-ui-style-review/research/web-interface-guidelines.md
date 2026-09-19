# Web Interface Guidelines (this pass)

Source: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md (fetched 2026-09-19)

Apply to Cortex:

- Visible `:focus-visible` (not click `:focus`); compound controls `:has(:focus-visible)` not always `:focus-within`.
- Never `outline: none` without replacement.
- `touch-action: manipulation`; tap-highlight already set.
- Full-bleed: `env(safe-area-inset-*)`.
- Hover on buttons/links; interactive more prominent than rest; theme-coherent.
- Display dates/numbers via `Intl.*`; ISO strings stay data keys.
- Form controls labeled; submit enabled until request; placeholders end with `…`.
- Destructive: confirm or undo.
- Unsaved: `beforeunload` when it matters.
- `prefers-reduced-motion` already present.
- Skip link + real heading target; `scroll-margin-top`.
- No dark `color-scheme` unless a dark theme exists (it does not).
- Chinese UI: do not force Title Case.
