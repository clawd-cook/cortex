# Research：Web Interface Guidelines × 展现换壳

来源：https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md（2026-09-19 拉取）

## 与本重规划相关的约束

| Guidelines 主题 | 对 Cortex 换壳的含义 |
| --- | --- |
| Navigation & State | 工作流视图必须进 URL；日历工具态可深链 |
| Focus / Hover | 换壳后所有新导航项保持可见 `:focus-visible` 与 hover |
| Typography | 今天/项目计数用 `tabular-nums`；标题 `text-wrap: balance` |
| Content handling | 项目名、下一步标题、处理模式大标题要能容忍短/长输入 |
| Touch | `touch-action: manipulation` 覆盖新控件 |
| Destructive | 扔掉收集项、删项目继续要确认或撤销 |
| Copy | 空态与处理按钮用具体动词（「放进收集箱」「变成项目」） |

## 刻意不做的指南项

- 英文 Title Case（产品中文）
- 为指南而做暗色模式
- 为指南而引入虚拟化库（列表规模仍小）

## 与「脱离滴答」的关系

指南管**质量**，不管**像不像滴答**。像不像滴答由 IA（`design.md`）决定：减少模块矩阵与常驻迷你月历，把注意力留给今天与项目。
