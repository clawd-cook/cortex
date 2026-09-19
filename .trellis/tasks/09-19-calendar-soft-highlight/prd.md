# PRD: Soften calendar “today” highlight

## Problem

The mini-calendar (and matching month/week “today” chips) use a solid `--ink` fill with inverted white text. Against the warm beige sidebar and soft active states elsewhere, that filled black disc reads as abrupt and heavy.

Marked days in the mini-calendar are plain `<a>` links without `text-decoration: none`, so default underlines also fight the grid and make rows look uneven.

## Goal

1. Soften the “today” treatment so it is clearly current without a hard black punch.
2. Keep today identifiable in mini, month, and week calendars with one shared visual language.
3. Remove link underlines from mini-day cells; optional quiet task marker if a day has tasks.

## Acceptance

- Today is still obvious at a glance, but contrast is closer to sidebar `.is-active` softness than a solid black button.
- Mini-day links have no underlines; number baselines stay level across the row.
- Month `.day-num` and week-head today styles match the softer language.
- Hover on mini-day remains visible; out-of-month days stay muted.
