# Web Interface Guidelines 全量样式审阅

## Goal

对照 Vercel Web Interface Guidelines，审完 Cortex 全部样式（`src/styles.css`、`index.html`、组件内联 style），把可执行的样式层缺陷收成一份验收清单。是否改代码由规划确认后决定。

## Background

- 唯一全局样式表：`src/styles.css`（约 1436 行）。无其他 `.css` / `.scss`。
- 视觉主色是墨色纸感：`--bg #f3efe6`、`--ink #1a1612`、`--surface #fffdf8`。主按钮已用 `--ink`。
- `--accent` / `--accent-soft` 仍是 indigo `#4f46e5` / `#eef2ff`。用户已指出收集框选中高亮蓝和主色调不搭。
- `index.html` `theme-color` 已匹配 `--bg`。`color-scheme: light`。无暗色主题。
- `prefers-reduced-motion` 已覆盖。未见 `transition: all`。未见 `user-scalable=no`。

## Requirements

审阅范围：

- R1. 覆盖 `src/styles.css` 全部规则、`index.html` 视口/theme-color、组件 `style={{...}}` 颜色/outline/layout。
- R2. 对照 Web Interface Guidelines 的 Focus、Theming、Hover、Touch、Safe Area、Typography、Content Handling、Animation、Dark Mode（仅当存在暗色主题时）。
- R3. 样式层以外的 a11y/copy/日期/确认框问题可记为 out-of-scope 附件，不作为本任务实现范围，除非规划明确扩大。

若进入修复，样式层 P0（当前证据）：

- R4. `--accent` / `--accent-soft` 与墨纸主色冲突；焦点环、选中行、菜单高亮、日历 hover、搜索结果、周视图今日列都吃这两色。
- R5. `.composer:focus-within` 在鼠标点击时出环；应改为 `:has(:focus-visible)`（或等价），并保留可见键盘焦点。
- R6. 全局 `:focus { outline: none }` 必须继续配 `:focus-visible` 替代；composer 输入的 `outline: none` 不得留下无环缺口。
- R7. `touch-action: manipulation` 目前只在 `button`；`a`、composer 控件应对齐。
- R8. 全屏 shell / 固定 overlay / 窄屏 `.detail` 缺 `env(safe-area-inset-*)`。
- R9. 硬编码色应收到 token：`#fff`、`#b4ab9e`、`#2a2433`、`#c7c2ff`、`rgba(79, 70, 229, …)`、`#e11d48` 等。

## Confirmed findings (2026-09-19)

### src/styles.css

src/styles.css:9 - `--accent: #4f46e5` 与 ink/paper 主色冲突
src/styles.css:10 - `--accent-soft: #eef2ff` 选中/菜单/日历 hover 同冲突
src/styles.css:27 - `-webkit-tap-highlight-color: transparent` 已显式设置
src/styles.css:66 - `:focus { outline: none }` 有 `:focus-visible` 替代，配对须保持
src/styles.css:71 - `:focus-visible` 环用 indigo `--accent`
src/styles.css:86 - `.skip-link:focus` 未用 `:focus-visible`（跳过链接可保留 `:focus`）
src/styles.css:101 - `.app-shell` 全屏无 `safe-area-inset`
src/styles.css:62 - `touch-action: manipulation` 仅 `button`，未覆盖 `a`
src/styles.css:137 - `.brand` 字色 `#c7c2ff` 仍是 indigo 家族
src/styles.css:434 - `.composer` 背景 `#fff` 未用 `--surface`
src/styles.css:444 - `.composer input:focus { outline: none }` 依赖父级环
src/styles.css:448 - `.composer:focus-within` 点击也出环；改 `:has(:focus-visible)`
src/styles.css:493 - `.task-row.is-selected` 用 indigo wash；侧栏 active 是米纸
src/styles.css:505 - `.check` 边框 `#b4ab9e` 无 token
src/styles.css:501 - `.check` 18px，触控热区偏小
src/styles.css:695 - `.swatch` 22px，热区偏小
src/styles.css:787 - `.day-cell` 无 hover（仅 `.is-over`）
src/styles.css:1125 - `.week-slot` 无 hover
src/styles.css:326 - `.mini-day` 无 hover
src/styles.css:598 - `.fold-trigger` 无 hover
src/styles.css:953 - `.schedule-item` 无 hover
src/styles.css:974 - `.view-toggle a` 无 hover（仅 `.is-on`）
src/styles.css:847 - `.day-cell.is-over` 用 `--accent-soft`
src/styles.css:1122 - `.week-col.is-today` 硬编码 `rgba(79, 70, 229, 0.04)`
src/styles.css:1167 - `.now-line` `#e11d48` 与主色脱节
src/styles.css:1010 - `.habit-chip` 粉系独立色板
src/styles.css:1407 - 窄屏 `.detail` `position: fixed` 可能盖住焦点
src/styles.css:457 - `.task-scroll` 有 `content-visibility: auto`
src/styles.css:1426 - `prefers-reduced-motion` 已覆盖
src/styles.css:280 - `.count` / `.mini-day` / `.day-num` 已 `tabular-nums`
src/styles.css:364 - `.main-head h1` 已 `text-wrap: balance`
src/styles.css:1219 - overlay/dialog 已 `overscroll-behavior: contain`

### index.html

index.html:6 - viewport 未禁缩放
index.html:7 - `theme-color: #f3efe6` 匹配 `--bg`

### Inline styles

src/App.tsx:196 - skip 目标 `#main-view` 为 `display: contents`
src/components/CalendarWeek.tsx:243 - 选中 outline 硬编码 `#1a1612`（应为 `var(--ink)`）
src/components/CalendarWeek.tsx:316 - 同上
src/components/CalendarMonth.tsx:490 - 同上
src/components/CalendarWeek.tsx:89 - 无项目颜色回退 `#57534e`
src/components/TaskPane.tsx:685 - 未选标签硬编码 `#d6d3cd` / `#3f3a34`

### Pass

- 无 `transition: all`
- 无暗色主题，故不要求 `color-scheme: dark`
- 长标题 ellipsis + `min-width: 0` 在任务行、bar、侧栏已有
- 空状态 `.empty` / `.detail-empty` 存在

## Out of scope (unless expanded)

- 暗色模式
- 文案 Title Case（界面是中文）
- `Intl.DateTimeFormat` 替换 `formatChip` / `weekdayLabels`
- 放弃任务无确认框
- 搜索框缺 `aria-label` 等非样式 a11y
- 列表虚拟化（已有 `content-visibility`）

## Acceptance Criteria

- [ ] AC1. `prd.md` 列出 `src/styles.css` 全文件对照后的样式层 findings，带 `file:line`。
- [ ] AC2. 内联 style 的颜色/outline/layout 已列入 findings。
- [ ] AC3. 规划明确：只审不改 / 只修样式层 P0 / 全量修复。未确认前不改代码。
- [ ] AC4. 若确认修复：焦点环与选中态不再使用与主色冲突的 indigo；键盘焦点仍可见。

## Open questions

- Q1. 本任务要不要改代码？推荐：修样式层 P0（R4–R9），不扩到日期/文案/确认框。
