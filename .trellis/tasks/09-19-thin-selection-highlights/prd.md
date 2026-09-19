# PRD: Thin selection highlights

## Problem
Selection chrome is too heavy across the app: thick black rings on color swatches, chunky filled/ring today markers, and heavy toggles. Circular selection marks also look off-center (emoji in ring, digit in today disc), so a lighter underline or hairline ring reads cleaner.

## Goal
1. Thin every circular/pill selection indicator (swatch, emoji, view toggle, today).
2. Mini-calendar today: prefer a short underline under the day number instead of a circle that fights glyph centering.
3. Month/week today: match with a light underline or 1px hairline ring — no filled disc.
4. Color/emoji pickers: 1px selected ring, perfectly centered content; no thick outer padding ring.

## Acceptance
- Selected swatch/emoji use a 1px ink ring with no extra gap that looks like a double circle.
- Mini today is an underline (or equivalent hairline), number optically centered in its cell.
- View toggle selected state is a light wash or thin underline, not a solid black pill.
- Focus rings for a11y remain visible via :focus-visible (unchanged intent).
