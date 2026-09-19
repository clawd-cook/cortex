# Design: PARA 工作流第一刀

## Architecture

不新增「项目」表，也不加 `processed` / `projectId` 字段。第一刀没有普通清单，**现有 `List` 全部就是项目**，`Task.listId` 就是项目归属。

```
捕获 → Task（open）
  无 listId、无日期     → 收集箱
  有 listId             → 该项目的下一步（日期可选）
  无 listId、有日期     → 独立下一步（可进今天 / 日历）
  当场完成              → status=completed，不进收集箱
```

智能清单是过滤器，不是桶。日历仍投影带日期的同一条任务。

```
UI (Shell / TaskPane / Calendar)
  → filters.ts（唯一规则源）
  → store.tsx
  → CortexStore (web localStorage | tauri SQLite)
```

过滤器必须是唯一真相。组件不得再写一套「listId === null 就是收集箱」。

## Contracts

### 离开收集箱 / 智能清单

用已有 `taskDateRange()`（`src/lib/dates.ts:66`）。

| 视图 | 规则（工作任务、`status === open`、非习惯） |
| --- | --- |
| 收集箱 | `listId === null` 且 `taskDateRange(task) === null` |
| 下一步 | 不在收集箱 |
| 今天 | 在下一步，且日期与今天重叠（沿用 `taskOverlapsDay`） |
| 明天 | 在下一步，且日期与明天重叠 |

清掉独立下一步的日期 → 它回到收集箱（D1）。清掉项目内下一步的日期 → 仍在项目和下一步，离开今天。

习惯不进这三条智能清单，行为与 V1 相同。

### 详情「所属项目」

替换「所属清单」下拉。

- 选项：`无项目` + 每个项目
- `无项目` ⇒ `listId = null`
- 某个项目 ⇒ `listId = 该项目 id`

不要再用「收集箱」当归属选项。收集箱是推导结果，不是用户挑选的容器。

### 变成项目（D3）

1. `addList({ name: task.title })`
2. `deleteTask(task.id)`（原收集项不再当待办）
3. 导航到新项目；输入框可写第一条下一步，允许空着

### 删除项目（D6）

在 `store.deleteList` 入口拦截：若存在 `status === open` 且 `listId === projectId` 的非习惯任务，拒绝删除，UI 说明原因。SQLite `delete_list` 仍会把 `list_id` 置空（`src-tauri/src/db.rs`）；第一刀靠 store 挡住，不改 SQL 级联语义。已完成任务可随项目删除或变成 `listId null`（已完成不进收集箱）。

### 现在做

创建任务后立刻 `status: completed` + `completedAt`。`listId` 与日期可空。不增加收集箱计数。

### 从今天添加

`listId: null`，`startDate = dueDate = today`。这是独立下一步，不是收集箱。占位文案不再写「添加任务至收集箱」。

### 从项目页添加

`listId = 当前项目`，日期默认为空。

### 存储

Web：`STORAGE_KEY` 改为 `cortex:v2`，避免旧 V1 快照被当成「每个旧清单都是一个项目」读进来（D4）。

SQLite：表结构不用迁。桌面端旧库会被当成项目读；D4 允许。不写 migration。

CSV：`list` 列按项目名导入（现有 `csv.ts` 已按清单名建 List）。文案从「清单」改为「项目」即可。不验收从滴答导出的旧 CSV。

### 路由

继续 `#/lists/:id` 作为项目页。新增 `#/smart/next`（或同等）给「下一步」智能清单。Inbox / today 路由不变。

## Data flow

```
composer / 详情 patch
  → updateTask / addTask
  → saveTask
  → snapshot.tasks

inboxTasks / nextTasks / todayTasks / tasksForList
  → TaskPane 中栏
  → 今天用 groupByList；list=null 的组标题改为「独立」而不是「收集箱」
```

今天里不应再出现收集箱组：按规则收集箱条目没有日期，进不了今天。

## Trade-offs

- **List 即项目，不加新字段。** 少一张表、日历和 CSV 不用改形状。代价：以后若要恢复普通清单，需要 `List.kind` 或第二外键。第一刀明确不做普通清单（D5），可接受。
- **不加 `processed`。** 用「无项目且无日期」表达未处理，与 D1 三条路一一对应。代价：不能表达「已处理、无项目、无日期」的独立下一步。第一刀独立下一步必须带日期（D1 第③路），可接受。
- **删除拦截放在 store 而不是 SQL。** 改动面小。若将来有第二写入路径绕过 store，需要补后端校验。第一刀只有这一条删除路径。

## Compatibility / rollback

- 不兼容 V1 快照。回滚：还原代码并把 Web 键改回 `cortex:v1`（旧数据若还在 localStorage 才可能恢复）。SQLite 无 migration 可回滚。
- 行为回滚点：先改 `filters.ts` + 测试；UI 再跟。若过滤器回滚，侧栏「下一步」必须一起拿掉，否则规则与界面不一致。

## Risks

- `filters.test.ts` 当前断言今天含 12 条收集箱，必须改写，不能保绿再改产品。
- 详情「清除日期」对独立下一步会把它送回收集箱。这是规则，不是 bug；文案上要能理解。
- 日历「安排任务」用 `undatedOpenTasks`：将同时包含收集箱和项目内未排期下一步。拖进格子 = 设日期。收集箱条目因此走 D1 第③路离开收集箱。保留该行为。
