# Component Guidelines

> How components are built in this project.

## Theming and focus

- Interactive chrome uses ink/paper tokens: `--accent` matches `--ink`; `--accent-soft` is a warm wash. Do not reintroduce indigo `#4f46e5` for focus or selection.
- Compound fields (`.composer`) use `:has(:focus-visible)`, not `:focus-within`, so mouse click does not draw a ring.
- Keep global `:focus { outline: none }` paired with `:focus-visible`.
- Skip target `#main-view` must be a real box (not `display: contents`).
- Display dates via `formatDayLabel` / `weekdayLabels` (`Intl`, `zh-CN`). ISO `yyyy-MM-dd` stays a data key.
