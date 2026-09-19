import { useMemo, useState } from "react";
import { IconCheck, IconInbox } from "../icons";
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
          <form
            className="composer"
            onSubmit={(event) => {
              event.preventDefault();
              void onCommitDraft();
            }}
          >
            <input
              name="new-task"
              autoComplete="off"
              placeholder={composerPlaceholder}
              value={draft?.source === "list" || draft?.source === "toolbar" ? draft.title : ""}
              onChange={(event) =>
                onDraft({
                  title: event.target.value,
                  listId:
                    route.name === "list"
                      ? route.listId
                      : route.name === "tag"
                        ? null
                        : null,
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
            <button className="primary-btn" type="submit">
              添加
            </button>
          </form>
        )}
        <div className="task-scroll">
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
            <details className="fold">
              <summary>已完成 · {completed.length}</summary>
              {completed.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  selected={task.id === selectedId}
                  onSelect={() => onNavigate(withTask(route, task.id))}
                />
              ))}
            </details>
          ) : null}
        </div>
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
      <button
        type="button"
        className={`check${task.status === "completed" ? " is-on" : ""}`}
        aria-label={task.status === "completed" ? "标为未完成" : "完成任务"}
        onClick={() =>
          void cortex.setTaskStatus(
            task,
            task.status === "completed" ? "open" : "completed",
          )
        }
      >
        <IconCheck />
      </button>
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
    </div>
  );
}

export function TaskDetail({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const cortex = useCortex();
  const [confirmTrash, setConfirmTrash] = useState(false);

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

  return (
    <aside className="detail" aria-label="任务详情">
      <div className="detail-top">
        <button
          type="button"
          className={`check${task.status === "completed" ? " is-on" : ""}`}
          aria-label={task.status === "completed" ? "标为未完成" : "完成任务"}
          onClick={() => setStatus(task.status === "completed" ? "open" : "completed")}
        >
          <IconCheck />
        </button>
        <button type="button" className="ghost-btn" onClick={onClose}>
          关闭
        </button>
      </div>
      <label className="field">
        <span className="live">标题</span>
        <input
          className="title-input"
          name="task-title"
          autoComplete="off"
          value={task.title}
          onChange={(event) => patch({ title: event.target.value })}
        />
      </label>
      <label className="field">
        <span>开始</span>
        <input
          type="date"
          name="start-date"
          min="1970-01-01"
          max="2100-12-31"
          value={task.startDate ?? ""}
          onChange={(event) => {
            const raw = event.target.value;
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
      </label>
      <label className="field">
        <span>到期</span>
        <input
          type="date"
          name="due-date"
          min="1970-01-01"
          max="2100-12-31"
          value={task.dueDate ?? ""}
          onChange={(event) => {
            const raw = event.target.value;
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
      </label>
      <div className="field">
        <span>快捷日期</span>
        <div className="priority-row">
          <button
            type="button"
            onClick={() => {
              const day = todayIso();
              patch({ startDate: day, dueDate: day });
            }}
          >
            今天
          </button>
          <button
            type="button"
            onClick={() => {
              const day = addIsoDays(todayIso(), 1);
              patch({ startDate: day, dueDate: day });
            }}
          >
            明天
          </button>
          <button
            type="button"
            onClick={() => {
              const start = todayIso();
              patch({ startDate: start, dueDate: addIsoDays(start, 2) });
            }}
          >
            跨三天
          </button>
          <button type="button" onClick={() => patch({ startDate: null, dueDate: null })}>
            清除日期
          </button>
        </div>
      </div>
      <div className="field">
        <span>优先级</span>
        <div className="priority-row">
          {PRIORITY_LABEL.map((label, index) => (
            <button
              key={label}
              type="button"
              className={task.priority === index ? "is-on" : ""}
              onClick={() => patch({ priority: index as Task["priority"] })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <label className="field">
        <span>所属清单</span>
        <select
          name="list"
          value={task.listId ?? ""}
          onChange={(event) => patch({ listId: event.target.value || null })}
        >
          <option value="">收集箱</option>
          {cortex.lists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.emoji} {list.name}
            </option>
          ))}
        </select>
      </label>
      <div className="field">
        <span>标签</span>
        <div className="tag-picks">
          {cortex.tags.map((tag) => {
            const on = task.tagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                className={`pill${on ? "" : ""}`}
                style={{ background: on ? tag.color : "#d6d3cd", color: on ? "white" : "#3f3a34" }}
                onClick={() =>
                  patch({
                    tagIds: on
                      ? task.tagIds.filter((id) => id !== tag.id)
                      : [...task.tagIds, tag.id],
                  })
                }
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      </div>
      <label className="field">
        <span>备注</span>
        <textarea
          className="notes-input"
          name="notes"
          placeholder="输入内容…"
          value={task.notes}
          onChange={(event) => patch({ notes: event.target.value })}
        />
      </label>
      <div className="toolbar">
        {task.status !== "abandoned" ? (
          <button type="button" className="ghost-btn" onClick={() => setStatus("abandoned")}>
            放弃
          </button>
        ) : (
          <button type="button" className="ghost-btn" onClick={() => setStatus("open")}>
            恢复
          </button>
        )}
        {task.status !== "trash" ? (
          <button type="button" className="ghost-btn danger-btn" onClick={() => setConfirmTrash(true)}>
            移入垃圾桶
          </button>
        ) : (
          <>
            <button type="button" className="ghost-btn" onClick={() => setStatus("open")}>
              还原
            </button>
            <button
              type="button"
              className="ghost-btn danger-btn"
              onClick={() => {
                if (confirm("彻底删除这条任务？")) void cortex.removeTask(task.id);
              }}
            >
              彻底删除
            </button>
          </>
        )}
      </div>
      {confirmTrash ? (
        <div className="overlay" role="presentation" onClick={() => setConfirmTrash(false)}>
          <div className="dialog-card" role="dialog" aria-labelledby="trash-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="trash-title">移入垃圾桶？</h2>
            <p>完成不是删除。垃圾桶里的任务还可以还原。</p>
            <div className="toolbar">
              <button type="button" className="ghost-btn" onClick={() => setConfirmTrash(false)}>
                留下
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  setStatus("trash");
                  setConfirmTrash(false);
                }}
              >
                移入垃圾桶
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
