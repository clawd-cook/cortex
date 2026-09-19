# Implement: PARA 工作流第一刀

不拆子任务。过滤器、侧栏、收集箱详情、今天分组改的是同一批文件，分开合入无法单独验收。

## Checklist

1. **规则层（先写测试）**
   - 改 `src/lib/filters.ts`：`inboxTasks` 改为无项目且无日期；新增 `nextTasks`（已离开收集箱的 open 工作任务）。
   - `todayTasks` / `tomorrowTasks` 改为「下一步 ∩ 当天/明天」，收集箱条目不得出现。
   - `groupByList`：无 `listId` 的组标题由调用方显示为「独立」，不再当「收集箱」。
   - 重写 `src/lib/filters.test.ts`。覆盖：收集箱与今天不重叠；项目内无日期任务在下一步、不在今天；独立有日期任务在下一步和今天、不在收集箱；完成态不进智能清单。
   - 校验：`pnpm test -- src/lib/filters.test.ts`

2. **存储键与删除拦截**
   - `src/lib/storage/contract.ts`：`STORAGE_KEY` → `cortex:v2`。
   - `src/state/store.tsx`：`deleteList` 若项目仍有 open 非习惯任务则拒绝（抛错或返回原因），UI 展示。
   - `src/lib/storage/web.ts` / Tauri 路径保持现有写入；不写 SQL migration。
   - 校验：给 store 加测试或组件可测的拒绝路径；`pnpm test`

3. **侧栏与路由**
   - `src/lib/route.ts`：增加 `next` 智能清单路由；补 `route.test.ts`。
   - `src/components/Shell.tsx`：智能清单加入「下一步」计数；清单组改为「项目」；新建文案；空态改为引导建项目；删除走 D6。
   - 去掉「先建项目清单和下一步行动池」。

4. **项目页与变成项目**
   - 打开 `#/lists/:id` 即项目页；中栏只显示该项目下一步；零下一步时提示。
   - 收集箱详情：所属项目下拉 + 「变成项目」动作（建项目、删原收集项、跳转；可写第一步或跳过）。
   - 详情标签「所属清单」改为「所属项目」，选项为「无项目」+ 项目列表。

5. **收集与今天**
   - 快捷添加：「现在做」→ 创建并完成；默认添加仍进收集箱（无日期、无项目）。
   - 「今天」composer：独立下一步 + 今天日期，不再进收集箱；占位文案改掉。
   - 「今天」分组按项目，「独立」组给无项目条目。
   - 项目页 composer：默认 `listId = 当前项目`。

6. **日历与 CSV 文案**
   - 月历清单过滤里的「收集箱」含义改为无项目；不要把有日期的独立下一步滤掉。
   - CSV 用户可见「清单」改为「项目」；导入逻辑仍复用 List。不验收旧滴答 CSV。

7. **回归**
   - `pnpm test`
   - 手跑 `prd.md` AC1–AC8（浏览器或 `pnpm tauri dev`）
   - 确认月历拖拽改期仍写回同一条任务

## Validation

```bash
pnpm test
pnpm test -- src/lib/filters.test.ts src/lib/route.test.ts
```

浏览器手跑：

1. 现在做一条 → 收集箱仍为 0
2. 三条进收集箱 → 一条变项目（可跳过第一步）、一条挂到该项目、一条设今天 → 收集箱为 0
3. 打开今天：只看到设了今天的那条，组头是项目或「独立」
4. 打开项目：能看见挂上的下一步；空项目有提示
5. 有下一步时删除项目被拒；移走或完成后能删
6. 刷新后归属还在

## Risky files / rollback

- `src/lib/filters.ts` + `filters.test.ts`：规则源。回滚先还这里。
- `src/components/TaskPane.tsx`、`Shell.tsx`：收集 / 今天 / 侧栏。
- `src/state/store.tsx`、`src/lib/storage/contract.ts`：删除拦截与 `cortex:v2`。换键后 Web 旧数据不会自动回来。
- `src-tauri/src/db.rs`：第一刀尽量不改级联；若改了 `list_id = NULL`，回滚要一起还原。

## Follow-up before start

- [ ] 用户已审 `prd.md` / `design.md` / `implement.md`
- [ ] `implement.jsonl` / `check.jsonl` 已有真实 spec 条目
- [ ] 用户明确说可以开始实现，再 `task.py start`
