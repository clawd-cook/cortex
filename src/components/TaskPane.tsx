import { Button } from "@base-ui/react/button";
import { Collapsible } from "@base-ui/react/collapsible";
import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Input } from "@base-ui/react/input";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { Toolbar } from "@base-ui/react/toolbar";
import { useMemo, useState } from "react";
import { IconInbox } from "../icons";
import { addIsoDays, formatChip, normalizeIsoDate, todayIso } from "../lib/dates";
import {
  completedInList,
  completedInboxTasks,
  groupByList,
  habitsOnDay,
  inboxTasks,
  isInboxTask,
  nextTasks,
  openHabits,
  projectsMissingNext,
  splitOpenCompleted,
  tasksForList,
  tasksForStatus,
  tasksForTag,
  todayTasks,
  tomorrowTasks,
} from "../lib/filters";
import { nowIso } from "../lib/id";
import type { Route } from "../lib/route";
import { toHash, withTask } from "../lib/route";
import { useCortex } from "../state/store";
import { LIST_COLORS, isHabit, type Draft, type List, type Task, type TaskStatus } from "../types";
import { AppScrollArea, AppSelect, AppSwitch, CheckControl, ConfirmDialog } from "./ui";

const PRIORITY_LABEL = ["无", "低", "中", "高"] as const;

export function viewTitle(route: Route, lists: { id: string; name: string }[], tags: { id: string; name: string }[]): string {
  switch (route.name) {
    case "inbox":
      return "收集箱";
    case "today":
      return "今天";
    case "tomorrow":
      return "明天";
    case "next":
      return "下一步";
    case "list":
      return lists.find((list) => list.id === route.listId)?.name ?? "项目";
    case "tag":
      return tags.find((tag) => tag.id === route.tagId)?.name ?? "标签";
    case "completed":
      return "已完成";
    case "abandoned":
      return "已放弃";
    case "trash":
      return "垃圾桶";
    case "search":
      return "搜索";
    case "calendar":
      return route.view === "week" ? "周视图" : "月历";
    case "summary":
      return "摘要";
    case "habits":
      return "习惯";
  }
}

function visibleTasks(route: Route, tasks: Task[]): Task[] {
  const today = todayIso();
  switch (route.name) {
    case "inbox":
      return inboxTasks(tasks);
    case "today":
      return todayTasks(tasks, today);
    case "tomorrow":
      return tomorrowTasks(tasks, addIsoDays(today, 1));
    case "next":
      return nextTasks(tasks);
    case "list":
      return tasksForList(tasks, route.listId);
    case "tag":
      return tasksForTag(tasks, route.tagId);
    case "completed":
      return tasksForStatus(tasks, "completed");
    case "abandoned":
      return tasksForStatus(tasks, "abandoned");
    case "trash":
      return tasksForStatus(tasks, "trash");
    case "habits":
      return openHabits(tasks);
    default:
      return [];
  }
}

export function TaskPane({
  route,
  draft,
  onDraft,
  onNavigate,
  onCommitDraft,
}: {
  route: Route;
  draft: Draft | null;
  onDraft: (draft: Draft | null) => void;
  onNavigate: (route: Route) => void;
  onCommitDraft: () => Promise<void>;
}) {
  const cortex = useCortex();
  const tasks = visibleTasks(route, cortex.tasks);
  const selectedId =
    "taskId" in route ? route.taskId : undefined;
  const selected = cortex.tasks.find((task) => task.id === selectedId) ?? null;
  const grouped = useMemo(() => {
    if (route.name === "today" || route.name === "tomorrow" || route.name === "next") {
      return groupByList(tasks, cortex.lists);
    }
    return [{ list: null, tasks }];
  }, [cortex.lists, route.name, tasks]);
  const emptyProjects =
    route.name === "next" ? projectsMissingNext(cortex.lists, cortex.tasks) : [];
  const clarifyTarget =
    route.name === "inbox" && tasks.length > 0
      ? tasks.find((task) => task.id === selectedId) ?? tasks[0]
      : null;

  const completed =
    route.name === "list"
      ? completedInList(cortex.tasks, route.listId)
      : route.name === "inbox"
        ? completedInboxTasks(cortex.tasks)
        : splitOpenCompleted(tasks).completed;

  return (
    <>
      <section className="main" aria-labelledby="view-title">
        <div className="main-head">
          <div>
            <h1 id="view-title">{viewTitle(route, cortex.lists, cortex.tags)}</h1>
            <p>
              {route.name === "today"
                ? "今天要动手的承诺，按项目分组。未处理的收集项不会出现在这里。"
                : route.name === "inbox"
                  ? "未处理的打断。一次澄清一条：设日期、挂项目、变成项目，或扔掉。"
                  : route.name === "next"
                    ? "已处理、可动手的下一步。点项目名可回到所属项目。"
                    : route.name === "list"
                      ? "这个项目里可执行的下一步。"
                      : route.name === "habits"
                        ? "只读叠层用的习惯。日历和今天能看见，不在这里打卡。"
                        : "同一条任务也会出现在日历上。"}
            </p>
          </div>
        </div>
        {clarifyTarget ? (
          <div className="composer" role="region" aria-label="处理模式">
            <p className="group-label" style={{ margin: 0, flex: 1 }}>
              处理：{clarifyTarget.title}
            </p>
            <Button
              type="button"
              className="ghost-btn"
              onClick={() => {
                const day = todayIso();
                void cortex.updateTask({
                  ...clarifyTarget,
                  startDate: day,
                  dueDate: day,
                  processed: true,
                });
              }}
            >
              设为今天
            </Button>
            <Button
              type="button"
              className="ghost-btn"
              onClick={() => {
                void cortex
                  .createList({
                    name: clarifyTarget.title,
                    color: LIST_COLORS[cortex.lists.length % LIST_COLORS.length],
                  })
                  .then(async (list) => {
                    await cortex.removeTask(clarifyTarget.id);
                    onNavigate({ name: "list", listId: list.id });
                  });
              }}
            >
              变成项目
            </Button>
            {clarifyTarget.id !== selectedId ? (
              <Button
                type="button"
                className="primary-btn"
                onClick={() => onNavigate(withTask(route, clarifyTarget.id))}
              >
                打开
              </Button>
            ) : null}
          </div>
        ) : null}
        {route.name === "completed" ||
        route.name === "abandoned" ||
        route.name === "trash" ||
        route.name === "summary" ||
        route.name === "next" ? null : (
          <Form
            className="composer"
            onSubmit={(event) => {
              event.preventDefault();
              void onCommitDraft();
            }}
          >
            <Input
              name="new-task"
              autoComplete="off"
              placeholder={
                route.name === "habits"
                  ? "添加习惯…"
                  : route.name === "today"
                    ? "添加今天的下一步…"
                    : route.name === "list"
                      ? "添加下一步…"
                      : route.name === "inbox"
                        ? "放进收集箱…"
                        : "添加任务…"
              }
              value={draft?.source === "list" || draft?.source === "toolbar" ? draft.title : ""}
              onValueChange={(title) =>
                onDraft({
                  title,
                  listId: route.name === "list" ? route.listId : null,
                  startDate:
                    route.name === "today"
                      ? todayIso()
                      : route.name === "tomorrow"
                        ? addIsoDays(todayIso(), 1)
                        : null,
                  dueDate:
                    route.name === "today"
                      ? todayIso()
                      : route.name === "tomorrow"
                        ? addIsoDays(todayIso(), 1)
                        : null,
                  tagIds: route.name === "tag" ? [route.tagId] : [],
                  source: "list",
                  kind: route.name === "habits" ? "habit" : "task",
                })
              }
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  onDraft(null);
                }
              }}
              aria-label="新任务标题"
            />
            {route.name === "habits" ? null : (
              <Button
                className="ghost-btn"
                type="button"
                onClick={() => {
                  const title = (
                    draft?.source === "list" || draft?.source === "toolbar" ? draft.title : ""
                  ).trim();
                  if (!title) return;
                  const day =
                    route.name === "tomorrow" ? addIsoDays(todayIso(), 1) : todayIso();
                  void cortex
                    .createTask({
                      title,
                      listId: route.name === "list" ? route.listId : null,
                      startDate: day,
                      dueDate: day,
                      tagIds: route.name === "tag" ? [route.tagId] : [],
                      kind: "task",
                      processed: true,
                      status: "completed",
                      completedAt: nowIso(),
                    })
                    .then(() => onDraft(null));
                }}
              >
                现在做
              </Button>
            )}
            <Button className="primary-btn" type="submit">
              添加
            </Button>
          </Form>
        )}
        <AppScrollArea className="task-scroll">
          {route.name !== "search" && grouped.every((group) => group.tasks.length === 0) ? (
            <div className="empty">
              <IconInbox />
              <strong>
                {route.name === "list"
                  ? "没有下一步"
                  : route.name === "next"
                    ? "没有可动手的事"
                    : route.name === "today"
                      ? "今天还没有承诺"
                      : route.name === "inbox"
                        ? "收集箱是空的"
                        : "这里还是空的"}
              </strong>
              <span>
                {route.name === "list"
                  ? "在上面写第一条可执行的下一步，也可以先空着。"
                  : route.name === "next"
                    ? "是真闲，还是都在等待？"
                    : route.name === "today"
                      ? "处理收集箱，或给下一步一个今天的日期。"
                      : route.name === "inbox"
                        ? "收好了。有空再处理。"
                        : "用 N 或上面的输入框抓住一件事。"}
              </span>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.list?.id ?? "independent-group"}>
                {route.name === "today" || route.name === "tomorrow" || route.name === "next" ? (
                  group.list ? (
                    <a className="group-label" href={toHash({ name: "list", listId: group.list.id })}>
                      {group.list.emoji} {group.list.name}
                    </a>
                  ) : (
                    <div className="group-label">独立</div>
                  )
                ) : null}
                {group.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    selected={task.id === selectedId}
                    hideCheck={isHabit(task)}
                    project={
                      group.list ??
                      cortex.lists.find((list) => list.id === task.listId) ??
                      null
                    }
                    showProject={
                      route.name === "today" ||
                      route.name === "tomorrow" ||
                      route.name === "next"
                    }
                    onSelect={() => onNavigate(withTask(route, task.id))}
                  />
                ))}
              </div>
            ))
          )}
          {emptyProjects.map((list) => (
            <a
              key={`empty-${list.id}`}
              className="group-label"
              href={toHash({ name: "list", listId: list.id })}
            >
              {list.emoji} {list.name} · 没有下一步
            </a>
          ))}
          {route.name === "today" && cortex.settings.showHabits ? <TodayHabits /> : null}
          {cortex.settings.showCompleted &&
          completed.length > 0 &&
          route.name !== "completed" ? (
            <Collapsible.Root className="fold" defaultOpen={false}>
              <Collapsible.Trigger className="fold-trigger">
                已完成 · {completed.length}
              </Collapsible.Trigger>
              <Collapsible.Panel className="fold-panel" hiddenUntilFound>
                {completed.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    selected={task.id === selectedId}
                    onSelect={() => onNavigate(withTask(route, task.id))}
                  />
                ))}
              </Collapsible.Panel>
            </Collapsible.Root>
          ) : null}
        </AppScrollArea>
      </section>
      <TaskDetail
        task={selected}
        onClose={() => onNavigate(withTask(route, undefined))}
        onNavigate={onNavigate}
      />
    </>
  );
}

function TodayHabits() {
  const { tasks } = useCortex();
  const habits = habitsOnDay(tasks, todayIso(), todayIso());
  if (habits.length === 0) return null;
  return (
    <div className="habits-strip" aria-label="习惯（只读）">
      <div className="group-label">习惯</div>
      {habits.map((habit) => (
        <span key={habit.id} className="habit-chip">
          {habit.title}
        </span>
      ))}
    </div>
  );
}

function TaskRow({
  task,
  selected,
  hideCheck,
  project,
  showProject,
  onSelect,
}: {
  task: Task;
  selected: boolean;
  hideCheck?: boolean;
  project?: List | null;
  showProject?: boolean;
  onSelect: () => void;
}) {
  const cortex = useCortex();
  const rangeChip = task.dueDate ?? task.startDate;
  const tags = cortex.tags.filter((tag) => task.tagIds.includes(tag.id));

  return (
    <div className={`task-row${selected ? " is-selected" : ""}${task.status === "completed" ? " is-done" : ""}`}>
      {hideCheck ? (
        <span className="habit-dot" aria-hidden="true" />
      ) : (
        <CheckControl
          checked={task.status === "completed"}
          label={task.status === "completed" ? "标为未完成" : "完成任务"}
          onCheckedChange={(checked) =>
            void cortex.setTaskStatus(task, checked ? "completed" : "open")
          }
        />
      )}
      <button type="button" onClick={onSelect}>
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          {rangeChip ? <span className="chip">{formatChip(rangeChip)}</span> : null}
          {task.priority > 0 ? (
            <span className="chip">优先 {PRIORITY_LABEL[task.priority]}</span>
          ) : null}
          {tags.map((tag) => (
            <span key={tag.id} className="pill" style={{ background: tag.color }}>
              {tag.name}
            </span>
          ))}
        </span>
      </button>
      {showProject ? (
        project ? (
          <a className="chip" href={toHash({ name: "list", listId: project.id })}>
            {project.emoji} {project.name}
          </a>
        ) : (
          <span className="chip">独立</span>
        )
      ) : null}
    </div>
  );
}

export function TaskDetail({
  task,
  onClose,
  onNavigate,
}: {
  task: Task | null;
  onClose: () => void;
  onNavigate?: (route: Route) => void;
}) {
  const cortex = useCortex();
  const [confirmKind, setConfirmKind] = useState<"trash" | "destroy" | "abandoned" | null>(null);

  if (!task) {
    return (
      <aside className="detail" aria-label="任务详情">
        <div className="detail-empty">
          <IconInbox />
          <p>选一条任务，改日期、标签和备注。不必跳页。</p>
        </div>
      </aside>
    );
  }

  const patch = (partial: Partial<Task>) => {
    const title = partial.title === undefined ? task.title : partial.title;
    if (partial.title !== undefined && !title.trim()) return;
    void cortex.updateTask({ ...task, ...partial, title: title.trim() });
  };

  const setStatus = (status: TaskStatus) => {
    void cortex.setTaskStatus(task, status);
  };

  const listItems = [
    { value: "none", label: "无项目" },
    ...cortex.lists.map((list) => ({
      value: list.id,
      label: `${list.emoji} ${list.name}`,
    })),
  ];

  return (
    <aside className="detail" aria-label="任务详情">
      <div className="detail-top">
        {isHabit(task) ? (
          <span className="group-label">习惯 · 只读叠层</span>
        ) : (
          <CheckControl
            checked={task.status === "completed"}
            label={task.status === "completed" ? "标为未完成" : "完成任务"}
            onCheckedChange={(checked) => setStatus(checked ? "completed" : "open")}
          />
        )}
        <Button type="button" className="ghost-btn" onClick={onClose}>
          关闭
        </Button>
      </div>
      <Field.Root className="field" name="task-title">
        <Field.Label className="live">标题</Field.Label>
        <Input
          className="title-input"
          autoComplete="off"
          value={task.title}
          onValueChange={(title) => patch({ title })}
        />
      </Field.Root>
      <Field.Root className="field" name="start-date">
        <Field.Label>开始</Field.Label>
        <Field.Control
          type="date"
          min="1970-01-01"
          max="2100-12-31"
          value={task.startDate ?? ""}
          onChange={(event) => {
            const raw = event.currentTarget.value;
            if (!raw) {
              patch({ startDate: null });
              return;
            }
            const iso = normalizeIsoDate(raw);
            if (!iso) return;
            patch({
              startDate: iso,
              dueDate: task.dueDate && task.dueDate < iso ? iso : task.dueDate ?? iso,
            });
          }}
        />
      </Field.Root>
      <Field.Root className="field" name="due-date">
        <Field.Label>到期</Field.Label>
        <Field.Control
          type="date"
          min="1970-01-01"
          max="2100-12-31"
          value={task.dueDate ?? ""}
          onChange={(event) => {
            const raw = event.currentTarget.value;
            if (!raw) {
              patch({ dueDate: null });
              return;
            }
            const iso = normalizeIsoDate(raw);
            if (!iso) return;
            patch({
              dueDate: iso,
              startDate: task.startDate && task.startDate > iso ? iso : task.startDate ?? iso,
            });
          }}
        />
      </Field.Root>
      <label className="field" style={{ gridTemplateColumns: "auto 1fr", alignItems: "center" }}>
        <AppSwitch
          name="all-day"
          checked={task.allDay}
          onCheckedChange={(checked) =>
            patch({
              allDay: checked,
              startTime: checked ? task.startTime : task.startTime ?? "09:00",
              endTime: checked ? task.endTime : task.endTime ?? "10:00",
            })
          }
        />
        <span>全天</span>
      </label>
      {task.allDay ? null : (
        <>
          <Field.Root className="field" name="start-time">
            <Field.Label>开始时间</Field.Label>
            <Field.Control
              type="time"
              value={task.startTime ?? ""}
              onChange={(event) => {
                const raw = event.currentTarget.value;
                if (!raw) {
                  patch({ startTime: null, allDay: true });
                  return;
                }
                patch({ startTime: raw, allDay: false });
              }}
            />
          </Field.Root>
          <Field.Root className="field" name="end-time">
            <Field.Label>结束时间</Field.Label>
            <Field.Control
              type="time"
              value={task.endTime ?? ""}
              onChange={(event) => {
                const raw = event.currentTarget.value;
                if (!raw) {
                  patch({ endTime: null });
                  return;
                }
                patch({ endTime: raw, allDay: false });
              }}
            />
          </Field.Root>
        </>
      )}
      <div className="field">
        <span>快捷日期</span>
        <Toolbar.Root className="priority-row" aria-label="快捷日期">
          <Toolbar.Button
            className="chip-toggle"
            onClick={() => {
              const day = todayIso();
              patch({ startDate: day, dueDate: day });
            }}
          >
            今天
          </Toolbar.Button>
          <Toolbar.Button
            className="chip-toggle"
            onClick={() => {
              const day = addIsoDays(todayIso(), 1);
              patch({ startDate: day, dueDate: day });
            }}
          >
            明天
          </Toolbar.Button>
          <Toolbar.Button
            className="chip-toggle"
            onClick={() => {
              const start = todayIso();
              patch({ startDate: start, dueDate: addIsoDays(start, 2) });
            }}
          >
            跨三天
          </Toolbar.Button>
          <Toolbar.Button
            className="chip-toggle"
            onClick={() => patch({ startDate: null, dueDate: null })}
          >
            清除日期
          </Toolbar.Button>
        </Toolbar.Root>
        {!task.processed ? (
          <p className="group-label">未处理：设日期或挂到项目后会离开收集箱。</p>
        ) : task.listId === null ? (
          <p className="group-label">已处理的独立下一步，即使没有日期也不会回到收集箱。</p>
        ) : null}
      </div>
      <div className="field">
        <span>优先级</span>
        <ToggleGroup
          className="priority-row"
          aria-label="优先级"
          value={[String(task.priority)]}
          onValueChange={(values) => {
            const next = values[0];
            if (next == null) return;
            patch({ priority: Number(next) as Task["priority"] });
          }}
        >
          {PRIORITY_LABEL.map((label, index) => (
            <Toggle key={label} value={String(index)} className="chip-toggle">
              {label}
            </Toggle>
          ))}
        </ToggleGroup>
      </div>
      <Field.Root className="field" name="list">
        <Field.Label>所属项目</Field.Label>
        <AppSelect
          name="list"
          aria-label="所属项目"
          value={task.listId ?? "none"}
          onValueChange={(value) => patch({ listId: value === "none" ? null : value })}
          items={listItems}
        />
      </Field.Root>
      {isInboxTask(task) ? (
        <div className="toolbar">
          <Button
            type="button"
            className="ghost-btn"
            onClick={() => {
              void cortex
                .createList({
                  name: task.title,
                  color: LIST_COLORS[cortex.lists.length % LIST_COLORS.length],
                })
                .then(async (list) => {
                  await cortex.removeTask(task.id);
                  onNavigate?.({ name: "list", listId: list.id });
                });
            }}
          >
            变成项目
          </Button>
        </div>
      ) : null}
      <div className="field">
        <span>标签</span>
        {cortex.tags.length === 0 ? (
          <p className="group-label">还没有标签。</p>
        ) : (
          <ToggleGroup
            className="tag-picks"
            multiple
            aria-label="标签"
            value={task.tagIds}
            onValueChange={(tagIds) => patch({ tagIds })}
          >
            {cortex.tags.map((tag) => {
              const on = task.tagIds.includes(tag.id);
              return (
                <Toggle
                  key={tag.id}
                  value={tag.id}
                  className={`pill${on ? "" : " is-off"}`}
                  style={on ? { background: tag.color } : undefined}
                >
                  {tag.name}
                </Toggle>
              );
            })}
          </ToggleGroup>
        )}
      </div>
      <Field.Root className="field" name="notes">
        <Field.Label>备注</Field.Label>
        <Field.Control
          className="notes-input"
          render={<textarea placeholder="输入内容…" />}
          value={task.notes}
          onValueChange={(notes) => patch({ notes })}
        />
      </Field.Root>
      <Toolbar.Root className="toolbar" aria-label="任务状态">
        {task.status !== "abandoned" ? (
          <Toolbar.Button className="ghost-btn" onClick={() => setConfirmKind("abandoned")}>
            放弃
          </Toolbar.Button>
        ) : (
          <Toolbar.Button className="ghost-btn" onClick={() => setStatus("open")}>
            恢复
          </Toolbar.Button>
        )}
        {task.status !== "trash" ? (
          <Toolbar.Button className="ghost-btn danger-btn" onClick={() => setConfirmKind("trash")}>
            移入垃圾桶
          </Toolbar.Button>
        ) : (
          <>
            <Toolbar.Button className="ghost-btn" onClick={() => setStatus("open")}>
              还原
            </Toolbar.Button>
            <Toolbar.Button className="ghost-btn danger-btn" onClick={() => setConfirmKind("destroy")}>
              彻底删除
            </Toolbar.Button>
          </>
        )}
      </Toolbar.Root>
      <ConfirmDialog
        open={confirmKind === "abandoned"}
        onOpenChange={(open) => {
          if (!open) setConfirmKind(null);
        }}
        title="放弃这条下一步？"
        description="放弃后可以在「已放弃」里恢复。"
        confirmLabel="放弃"
        onConfirm={() => setStatus("abandoned")}
      />
      <ConfirmDialog
        open={confirmKind === "trash"}
        onOpenChange={(open) => {
          if (!open) setConfirmKind(null);
        }}
        title="移入垃圾桶？"
        description="完成不是删除。垃圾桶里的任务还可以还原。"
        confirmLabel="移入垃圾桶"
        onConfirm={() => setStatus("trash")}
      />
      <ConfirmDialog
        open={confirmKind === "destroy"}
        onOpenChange={(open) => {
          if (!open) setConfirmKind(null);
        }}
        title="彻底删除？"
        description="彻底删除这条任务？此操作不能撤销。"
        confirmLabel="彻底删除"
        onConfirm={() => {
          void cortex.removeTask(task.id);
        }}
      />
    </aside>
  );
}
