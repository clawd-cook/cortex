# Implement：Phase B workflow-first shell

## Order

1. Restructure `Rail` — drop task/habits as peer modules; keep brand + calendar tool + search/settings entry points (or collapse rail weight).
2. `Sidebar` — primary: 今天 / 收集箱 / 下一步 / 项目; tools: 日历·摘要·习惯列表链接·搜索; archive collapsed; inbox count emphasize when >0.
3. Remove default `MiniMonth` from sidebar bottom; optional setting `showMiniMonth` default **false**, or show only on calendar route.
4. Rename calendar aside「安排任务」→「未排期下一步」(`CalendarMonth` / `CalendarWeek`).
5. Habits: keep `#/habits` route; enter from tools link / command palette / today habits strip — not rail peer.
6. Default hash already today (`useHashRoute`) — verify cold start.
7. Empty-state copy per design.md.
8. `pnpm test` + `tsc --noEmit`. Do not change filter contracts.

## Validation

- AC1–AC4 in `prd.md`
- Filters tests still green
