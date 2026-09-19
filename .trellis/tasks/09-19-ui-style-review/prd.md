# Web Interface Guidelines 全量样式审阅

## Goal

对照 Vercel Web Interface Guidelines，修完 Cortex 现有界面里已确认的违规项：墨纸主题焦点/选中态、键盘焦点环、触控与安全区、hover、标签与确认、展示日期用 `Intl`。不新做暗色模式，不把中文改成 Title Case。

## Background

- 用户 2026-09-19 确认：**全量按照指南修**，规划完毕后自动开发、提交、推送。
- 唯一全局样式表 `src/styles.css`。主色墨纸（`--ink` / `--bg` / `--surface`）；`--accent` 仍是 indigo `#4f46e5`，收集框点击高亮与主色冲突。
- `color-scheme: light`。无暗色主题。`prefers-reduced-motion` 已有。无 `transition: all`。未禁缩放。
- PARA 过滤合同见 `.trellis/spec/frontend/para-workflow.md`，本任务不得改 inbox/next/today 规则。

## Requirements

- R1. `--accent` / `--accent-soft` 收到墨纸；焦点环、选中行、菜单、日历 hover、搜索结果、周视图今日列不再用 indigo。
- R2. 键盘焦点可见：全局保持 `:focus` + `:focus-visible` 配对；composer 用 `:has(:focus-visible)`，鼠标点击不出蓝/墨环。
- R3. `touch-action: manipulation` 覆盖 `a`、表单控件；全屏 shell / overlay / 窄屏详情加 `env(safe-area-inset-*)`。
- R4. 硬编码色收到 token（`#fff`、`#b4ab9e`、`#c7c2ff`、`rgba(79,70,229,…)`、`#e11d48` 等）。日历选中 outline 用 `var(--ink)` / class，不用 hex。
- R5. 缺 hover 的可点控件补上：`.day-cell`、`.week-slot`、`.mini-day`、`.fold-trigger`、`.schedule-item`、`.view-toggle a`。
- R6. `.check` / `.swatch` 热区至少 24px。
- R7. 跳过链接目标不能是 `display: contents`；`#main-view` 在盒模型里且 `scroll-margin-top`。
- R8. 展示用日期走 `Intl.DateTimeFormat("zh-CN")`（chip、星期、周范围、摘要）。ISO `yyyy-MM-dd` 仍作数据键。
- R9. 表单：搜索框 `aria-label`；自定义 Select 有 `aria-label`；提交按钮空标题时仍可点，在 submit 里校验。
- R10. 「放弃」需确认。有未提交草稿标题时 `beforeunload` 提示。
- R11. 侧栏「任务」在习惯页不得与「习惯」同时高亮。
- R12. 长备注 `overflow-wrap`。不改 PARA 语义，不加暗色主题，不加列表虚拟化库。

## Acceptance Criteria

- [ ] AC1. 焦点环与选中态不再出现 indigo；键盘 Tab 进 composer 仍有可见环。
- [ ] AC2. `pnpm test` 与 `pnpm exec tsc --noEmit` 通过；`formatChip` / `weekdayLabels` / `weekRangeLabel` 有 Intl 断言。
- [ ] AC3. 搜索输入、设置星期 Select、所属项目 Select 均有可访问名。
- [ ] AC4. 放弃走确认框；空名称提交不创建项目/标签。
- [ ] AC5. 跳过链接能落到可见的 `#main-view`。

## Out of scope

- 暗色模式
- 英文 Title Case（界面中文）
- 引入 `virtua`（已有 `content-visibility`）
- 改 inbox / next / today 过滤规则
