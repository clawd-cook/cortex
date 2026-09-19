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
  groupByList,
  inboxTasks,
  splitOpenCompleted,
  tasksForList,
  tasksForStatus,
  tasksForTag,
  todayTasks,
  tomorrowTasks,
} from "../lib/filters";
import type { Route } from "../lib/route";
import { withTask } from "../lib/route";
import { useCortex } from "../state/store";
import type { Draft, Task, TaskStatus } from "../types";
import { AppScrollArea, AppSelect, CheckControl, ConfirmDialog } from "./ui";

const PRIORITY_LABEL = ["无", "低", "中", "高"] as const;

export function viewTitle(route: Route, lists: { id: string; name: string }[], tags: { id: string; name: string }[]): string {
  switch (route.name) {
    case "inbox":
      return "收集箱";
    case "today":
      return "今天";
    case "tomorrow":
      return "明天";
    case "list":
      return lists.find((list) => list.id === route.listId)?.name ?? "清单";
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
      return "月历";
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
    if (route.name === "today" || route.name === "tomorrow") {
      return groupByList(tasks, cortex.lists);
    }
    return [{ list: null, tasks }];
  }, [cortex.lists, route.name, tasks]);

  const completed =
    route.name === "list"
      ? completedInList(cortex.tasks, route.listId)
      : route.name === "inbox"
        ? completedInList(cortex.tasks, null)
        : splitOpenCompleted(tasks).completed;

  const composerPlaceholder =
    route.name === "today" ? "添加任务至收集箱…" : "添加任务…";

  return (
    <>
      <section className="main" aria-labelledby="view-title">
        <div className="main-head">
          <div>
            <h1 id="view-title">{viewTitle(route, cortex.lists, cortex.tags)}</h1>
            <p>
              {route.name === "today"
                ? "到期今天或跨天包含今天的未完成任务，按来源清单分组。"
                : route.name === "inbox"
                  ? "还没放进清单的事。标题为空按 Esc 不会落库。"
                  : "同一条任务也会出现在日历上。"}
            </p>
          </div>
        </div>
        {route.name === "completed" ||
        route.name === "abandoned" ||
        route.name === "trash" ? null : (
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
              placeholder={composerPlaceholder}
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
            <Button className="primary-btn" type="submit">
              添加
            </Button>
          </Form>
        )}
        <AppScrollArea className="task-scroll">
          {route.name !== "search" && grouped.every((group) => group.tasks.length === 0) ? (
            <div className="empty">
              <IconInbox />
              <strong>这里还是空的</strong>
              <span>用 N 或上面的输入框抓住一件事。</span>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.list?.id ?? "inbox-group"}>
                {route.name === "today" || route.name === "tomorrow" ? (
                  <div className="group-label">
                    {group.list ? `${group.list.emoji} ${group.list.name}` : "收集箱"}
                  </div>
                ) : null}
                {group.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    selected={task.id === selectedId}
                    onSelect={() => onNavigate(withTask(route, task.id))}
                  />
                ))}
              </div>
            ))
          )}
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
      <TaskDetail task={selected} onClose={() => onNavigate(withTask(route, undefined))} />
    </>
  );
}

function TaskRow({
  task,
  selected,
  onSelect,
}: {
  task: Task;
  selected: boolean;
  onSelect: () => void;
}) {
  const cortex = useCortex();
  const rangeChip = task.dueDate ?? task.startDate;
  const tags = cortex.tags.filter((tag) => task.tagIds.includes(tag.id));

  return (
    <div className={`task-row${selected ? " is-selected" : ""}${task.status === "completed" ? " is-done" : ""}`}>
      <CheckControl
        checked={task.status === "completed"}
        label={task.status === "completed" ? "标为未完成" : "完成任务"}
        onCheckedChange={(checked) =>
          void cortex.setTaskStatus(task, checked ? "completed" : "open")
        }
      />
      <Button type="button" nativeButton={false} render={<button type="button" />} onClick={onSelect}>
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
      </Button>
    </div>
  );
}

export function TaskDetail({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const cortex = useCortex();
  const [confirmKind, setConfirmKind] = useState<"trash" | "destroy" | null>(null);

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
    { value: "inbox", label: "收集箱" },
    ...cortex.lists.map((list) => ({
      value: list.id,
      label: `${list.emoji} ${list.name}`,
    })),
  ];

  return (
    <aside className="detail" aria-label="任务详情">
      <div className="detail-top">
        <CheckControl
          checked={task.status === "completed"}
          label={task.status === "completed" ? "标为未完成" : "完成任务"}
          onCheckedChange={(checked) => setStatus(checked ? "completed" : "open")}
        />
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
        <Field.Label>所属清单</Field.Label>
        <AppSelect
          name="list"
          value={task.listId ?? "inbox"}
          onValueChange={(value) => patch({ listId: value === "inbox" ? null : value })}
          items={listItems}
        />
      </Field.Root>
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
                  className="pill"
                  style={{ background: on ? tag.color : "#d6d3cd", color: on ? "white" : "#3f3a34" }}
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
          <Toolbar.Button className="ghost-btn" onClick={() => setStatus("abandoned")}>
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
