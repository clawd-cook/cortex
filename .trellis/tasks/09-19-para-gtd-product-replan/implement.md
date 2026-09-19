# Implement：分期落地（规划）

> 本任务为规划阶段，**不启动写业务代码**。下列顺序供后续子任务拆分。

---

## Phase 0 — 规划收敛（本 PR）

- [x] 从最新 `master` 建分支
- [x] `prd.md` / `design.md` / 本文件
- [x] 壳层决策：**A 工作流优先**
- [x] 收集箱语义：**2 显式未处理**
- [x] 设日期 / 日历拖拽：**自动 `processed = true`（排期即澄清）**
- [x] 拆分：**先 A 后 B**；子任务 PRD 已写明硬依赖
- [x] **用户审阅**本规划包后，批准启动 Phase A（`09-19-para-semantics-clarify`）— 2026-09-19 采纳

退出标准：✓ 用户已同意；Phase A 已 `task.py start`。

### 子任务

1. `09-19-para-semantics-clarify` — 语义闭环（进行中）
2. `09-19-para-workflow-shell` — 换壳（依赖 1）

---

## Phase A — 语义闭环（实现任务另开）

1. 数据模型：`processed` / `actionable` / `List.kind`（或等价）
2. 过滤器与 `para-workflow.md` 合同同步
3. 收集箱处理模式 UX
4. 今天按项目分组；从今天添加的默认语义
5. 项目缺下一步提示 + 完成后追问
6. 迁移向导（旧清单用法）
7. 回归：月历拖拽、存储重启

---

## Phase B — 展现换壳

1. 导航信息架构按 `design.md` 替换左轨/侧栏
2. 迷你月历降级
3. 日历入口改为工具；右栏文案与数据源调整
4. 习惯入口降级
5. 空态与侧栏强调（收集箱 >0）
6. Web Guidelines 回归（焦点、截断、Intl）

---

## Phase C — 领域与归档

按 `prd.md` Release 阶段 C。

---

## Validation plan（实现阶段）

- 手跑 PRD 验收故事
- `pnpm test` + `tsc`
- 过滤器单测覆盖新收集箱 / 今天定义
- 不引入第二套日历对象
