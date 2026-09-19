# PRD: Calendar day alignment & typography

## Problem

In the month calendar, date number circles sit on uneven baselines across each week. Mondays render `W##` above the day number inside a column flex, which pushes only those circles down. Variable lunar/holiday lines make the header look even less steady.

## Goal

1. Align every day-number circle on a shared horizontal baseline within each week (and across weeks).
2. Apply Web Interface Guidelines typography rules that touch the calendar chrome (tabular nums, ellipsis, heading wrap) without redesigning the product look.
3. Keep week numbers, lunar labels, and 休/班 badges when those settings are on.

## Acceptance

- With `showWeekNumbers` on, Mon–Sun day circles share the same top edge in a week row.
- With `showWeekNumbers` off, circles remain top-aligned and no empty week-number gutter remains.
- Festival / 休 / 班 / lunar text never shifts the day circle vertically.
- Week-bar overlay still clears the day header (no collision with circles).
- No regression to create-task popover on the day number control.
