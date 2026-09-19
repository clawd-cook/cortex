# PARA Workflow Contracts

> Cortex model: `List` is a project. Inbox / Next / Today are filters over the same `Task` rows.
> Phase A: membership is driven by `processed` / `actionable`, not “null list + no date”.

---

## Scenario: Inbox, next actions, and project containers

### 1. Scope / Trigger

- Trigger: any change to inbox membership, next/today grouping, project delete, calendar "no date" filter, hydrate migration, or web snapshot key.
- Why code-spec depth: the same `Task.processed` + `listId` + date fields are read by filters, store, routes, CSV, and UI. Treating `listId === null` as inbox (V1) silently puts processed independent next actions back in 收集箱.

### 2. Signatures

```ts
export const STORAGE_KEY = "cortex:v2";

export function isInboxTask(task: Task): boolean;
export function inboxTasks(tasks: Task[]): Task[];
export function isNextTask(task: Task): boolean;
export function nextTasks(tasks: Task[]): Task[];
export function todayTasks(tasks: Task[], todayIso: string): Task[];
export function undatedOpenTasks(tasks: Task[]): Task[];
export function completedInboxTasks(tasks: Task[]): Task[];
export function projectsMissingNext(lists: List[], tasks: Task[]): List[];
export function assertCanDeleteProject(tasks: Task[], projectId: string): void;
export const PROJECT_DELETE_BLOCKED: string;
```

- Membership: `Task.listId` points at `List.id`. There is no separate `projectId`.
- Inbox route: `#/lists/inbox`. Next route: `#/smart/next`. Today: `#/smart/today`.
- Calendar filter value for undated work is `"none"`, not `"inbox"`.

### 3. Contracts

| Field / key | Type | Constraint |
| --- | --- | --- |
| `Task.processed` | `boolean` | `false` + open + not habit → inbox. Active date or project attach sets `true`. |
| `Task.actionable` | `boolean` | Default `true`. `false` hides from 下一步 / 今天 (thin waiting). |
| `Task.listId` | `string \| null` | Non-null → project member. Null + processed → independent next (may be undated). |
| `taskDateRange(task)` | `{ start, end } \| null` | Today = next ∩ overlaps day. Date alone does not define inbox. |
| `STORAGE_KEY` | `"cortex:v2"` | Web localStorage. `cortex:v1` must be ignored. |
| Inbox completed fold | `completedInboxTasks` | Completed ∧ `!processed`. Do **not** use `completedInList(tasks, null)`. |
| Calendar undated queue | `undatedOpenTasks` | `nextTasks` ∩ no date (excludes unprocessed inbox). |
| `removeList(id)` | store | Calls `assertCanDeleteProject` **before** persistence. |
| Hydrate migration | `hydrateTask` | Missing `processed`: open + null list + no dates + not habit → `false`; else `true`. `actionable` defaults `true`. |

View rules:

| View | Rule |
| --- | --- |
| 收集箱 | open ∧ `processed === false` ∧ not habit |
| 下一步 | open ∧ `processed` ∧ `actionable` ∧ not habit |
| 今天 | 下一步 ∧ date overlaps today |
| 独立下一步 | processed ∧ no project; undated allowed |

Inbox exits / clarify (any one sets `processed = true`):

1. Do-now: write today's date (and usually complete).
2. Attach / become project: set `listId` (become-project deletes the capture row and uses its title as the project name).
3. Set any date (detail shortcuts, calendar drop/reschedule, 设为今天).

Store: `createTask` with no date and no list → `processed: false`. `createTask` / `updateTask` when start/due become non-null, or `listId` is set → `processed: true`.

### 4. Validation & Error Matrix

| Condition | Result |
| --- | --- |
| `tasksForList(tasks, projectId).length > 0` | `assertCanDeleteProject` throws `Error(PROJECT_DELETE_BLOCKED)` |
| Open next actions completed, trashed, or moved off the project | Delete allowed |
| Web load finds only `cortex:v1` | Empty snapshot; do not migrate |
| Snapshot task missing `processed` | Hydrate per migration rule above |

### 5. Good / Base / Bad Cases

- Good: open, `processed: false` → inbox. Same row with today date + processed → today + next, not inbox.
- Good: open, `processed: true`, null list, no date → next (independent), not inbox.
- Base: open, `listId` set, processed, no date → next under that project; today empty for that row.
- Bad: treat `listId === null` as inbox regardless of `processed`; put unprocessed in today; calendar filter `"inbox"`; delete project while open members remain; persist under `cortex:v1`.

### 6. Tests Required

- `src/lib/filters.test.ts`: processed inbox/next/today; undated independent next; unprocessed never in today; `completedInboxTasks`; `projectsMissingNext`; `assertCanDeleteProject`; hydrate migration.
- `src/state/store.test.tsx`: `removeList` guard; create/update date ⇒ processed.
- `src/lib/storage/web.test.ts`: writes `cortex:v2`; `cortex:v1` does not hydrate; missing processed migrates.
- `src/lib/route.test.ts`: `#/smart/next` parse/serialize.

### 7. Wrong vs Correct

#### Wrong

```ts
task.listId === null && !taskDateRange(task); // V1 inbox
completedInList(tasks, null);
calendar filter === "inbox";
localStorage key "cortex:v1";
```

#### Correct

```ts
isInboxTask(task); // !processed && open && !habit
completedInboxTasks(tasks);
undatedOpenTasks(tasks); // next ∩ no date
calendar filter === "none";
STORAGE_KEY === "cortex:v2";
assertCanDeleteProject(snapshot.tasks, id);
```

---

## Design Decision: List is the project

**Context**: First cut needed a project↔next-action link without a second object graph.

**Options considered**:

1. Add `Task.projectId` beside `listId`.
2. Reuse `List` as project; `listId` is membership.

**Decision**: Option 2. No ordinary lists. Empty projects must still appear on 下一步 / side nav (缺下一步) so they are not invisible.

**Extensibility**: Areas / Resources / full waiting UX / workflow-first shell stay out of this contract until a later slice (Phase B+).

---

## Common Mistake: Inbox completed fold

**Symptom**: Finished do-now or dated independent rows show under 收集箱 completed.

**Cause**: `completedInList(..., null)` matches any completed task with `listId === null`.

**Fix**: Use `completedInboxTasks` (`!processed` only).
