# PRD：Phase A — 已处理语义与澄清回路

## Goal

在**不换一级壳**的前提下，让收集箱 / 下一步 / 今天按「未处理 vs 已处理」工作，并打通处理模式与「设日期即澄清」。

## Dependencies（写在正文，不靠目录树）

- **依赖规划决策**（父任务 `09-19-para-gtd-product-replan` 已锁定）：
  - 壳层最终目标是工作流优先（本阶段**不实现**换壳）
  - 收集箱 = `processed = false`
  - 主动设日期 ⇒ `processed = true`
- **不依赖** Phase B（`09-19-para-workflow-shell`）。本任务可单独合并验收。
- **必须同步更新** `.trellis/spec/frontend/para-workflow.md`（合同与代码一起改）。

## Confirmed facts

- 现状收集箱：`listId == null` ∧ 无日期（见 `filters.ts` / 现行 spec）
- 无 `processed` / `actionable` 字段（`types.ts`）
- 月历拖拽改期已存在，落期时需写入 `processed = true`

## Requirements

- R1. 任务增加 `processed`（及薄做的 `actionable`，默认 true）
- R2. 收集箱 / 下一步 / 今天过滤器改按父 PRD 合同
- R3. 收集箱「处理模式」：一次一条澄清动作
- R4. 今天按项目分组；从今天添加 = 已处理 ∧ 日期今天
- R5. 主动设日期路径（处理模式、今天/明天、日历落期）标已处理
- R6. 迁移：仅「无项目+无日期」的 open 任务 → 未处理；其余 open → 已处理
- R7. 项目缺下一步可见；勾完可追问下一条（可薄）
- R8. 回归：月历拖拽、存储重启、既有 PARA 删除守卫

## Acceptance

- [ ] AC1. 未处理项只出现在收集箱；已处理无日期的独立下一步出现在「下一步」不在收集箱
- [ ] AC2. 今天不含未处理项；手跑父 PRD 验收故事 1–4
- [ ] AC3. `para-workflow.md` 与测试断言反映新合同
- [ ] AC4. `pnpm test` + `tsc` 通过

## Out of scope

- 工作流优先导航换壳、迷你月历降级、习惯轨拆除（→ Phase B）
- 领域、完整归档区、AI、通知矩阵
