# PARA Workflow Contracts

> First-cut Cortex model: `List` is a project. Inbox / Next / Today are filters over the same `Task` rows.

---

## Scenario: Inbox, next actions, and project containers

### 1. Scope / Trigger

- Trigger: any change to inbox membership, next/today grouping, project delete, calendar "no date" filter, or web snapshot key.
- Why code-spec depth: the same `Task.listId` + date range fields are read by filters, store, routes, CSV, and UI. Duplicating a V1 check (`listId === null` means inbox) silently puts dated or completed work back in 收集箱.

### 2. Signatures

```ts
export const STORAGE_KEY = "cortex:v2";

export function isInboxTask(task: Task): boolean;
export function inboxTasks(tasks: Task[]): Task[];
export function nextTasks(tasks: Task[]): Task[];
export function todayTasks(tasks: Task[], todayIso: string): Task[];
export function completedInboxTasks(tasks: Task[]): Task[];
export function assertCanDeleteProject(tasks: Task[], projectId: string): void;
export const PROJECT_DELETE_BLOCKED: string;
```

- Membership: `Task.listId` points at `List.id`. There is no separate `projectId`.
- Inbox route: `#/smart/inbox`. Next route: `#/smart/next`.
- Calendar filter value for undated work is `"none"`, not `"inbox"`.

### 3. Contracts

| Field / key | Type | Constraint |
| --- | --- | --- |
| `Task.listId` | `string \| null` | `null` + no date + open + not habit → inbox. Non-null → project member. |
| `taskDateRange(task)` | `{ start, end } \| null` | Any date (including today) exits inbox. |
| `STORAGE_KEY` | `"cortex:v2"` | Web localStorage. `cortex:v1` must be ignored; do not treat old lists as projects. |
| Inbox completed fold | `completedInboxTasks` | Same membership as inbox (null list, no date). Do **not** use `completedInList(tasks, null)`. |
| `removeList(id)` | store | Calls `assertCanDeleteProject` **before** persistence. SQL `delete_list` may still null `list_id`; the store/UI guard is the first-cut contract. |

Inbox exits (any one is enough):

1. Do-now: keep `listId` null, write today's date.
2. Attach / become project: set `listId` (become-project deletes the capture row and uses its title as the project name).
3. Set any other date.

Today = `nextTasks` ∩ `taskOverlapsDay(..., todayIso)`. Independent next = open, not inbox, `listId` null, has a date.

### 4. Validation & Error Matrix

| Condition | Result |
| --- | --- |
| `tasksForList(tasks, projectId).length > 0` | `assertCanDeleteProject` throws `Error(PROJECT_DELETE_BLOCKED)` |
| Open next actions completed, trashed, or moved off the project | Delete allowed |
| Web load finds only `cortex:v1` | Empty snapshot; do not migrate |

### 5. Good / Base / Bad Cases

- Good: open, `listId` null, no date → inbox. Same row with today date → today + next, not inbox.
- Base: open, `listId` set, no date → next under that project; today empty for that row.
- Bad: treat `listId === null` as inbox regardless of date/status; calendar filter `"inbox"`; delete project while open next actions remain; persist under `cortex:v1`.

### 6. Tests Required

- `src/lib/filters.test.ts`: `isInboxTask` / `nextTasks` / `todayTasks` / `completedInboxTasks` / `assertCanDeleteProject` assertion points above.
- `src/state/store.test.tsx`: `removeList` rejects with `PROJECT_DELETE_BLOCKED` when open members exist; succeeds after they are gone.
- `src/lib/storage/web.test.ts`: writes `cortex:v2`; `cortex:v1` does not hydrate.
- `src/lib/route.test.ts`: `#/smart/next` parse/serialize.

### 7. Wrong vs Correct

#### Wrong

```ts
task.listId === null; // V1 inbox
completedInList(tasks, null);
calendar filter === "inbox";
localStorage key "cortex:v1";
```

#### Correct

```ts
isInboxTask(task);
completedInboxTasks(tasks);
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

**Decision**: Option 2. No ordinary lists. Empty projects must still appear on 下一步 so they are not invisible.

**Extensibility**: Areas / Resources / waiting / inbox-processing mode stay out of this contract until a later slice.

---

## Common Mistake: Inbox completed fold

**Symptom**: Finished do-now or dated-null-list rows show under 收集箱 completed.

**Cause**: `completedInList(..., null)` matches any completed task with `listId === null`.

**Fix**: Use `completedInboxTasks`.
