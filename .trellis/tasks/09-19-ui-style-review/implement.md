# Implement

1. Tokens + focus + hover + touch + safe-area + hit targets in `src/styles.css`.
2. `AppFrame`: wrap children in `#main-view`; drop `display: contents` on App.tsx.
3. Rail task `is-active` excludes `habits`.
4. Dates Intl + tests; summary uses `formatDayLabel`.
5. Search/select labels; abandon confirm; submit validation; `beforeunload` on non-empty draft.
6. Calendar/TaskPane: `LIST_FALLBACK_COLOR`, `.is-selected`, pill off tokens via CSS variables on unselected tags.
7. `pnpm test` && `pnpm exec tsc --noEmit`.

Validation: composer keyboard ring; today/inbox/next still filter as PARA spec; empty project create does not save.
