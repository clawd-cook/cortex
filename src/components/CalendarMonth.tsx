import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { addMonths, format, isSameMonth, parseISO } from "date-fns";
import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { IconPlus } from "../icons";
import { layoutMonthBars } from "../lib/calendar-layout";
import {
  addIsoDays,
  buildMonthGrid,
  durationDays,
  monthTitle,
  taskDateRange,
  todayIso,
  weekdayLabels,
} from "../lib/dates";
import { undatedOpenTasks } from "../lib/filters";
import { useCortex } from "../state/store";
import type { Draft, Task } from "../types";

function calendarTasks(tasks: Task[], showCompleted: boolean): Task[] {
  return tasks.filter((task) => {
    if (task.status === "trash" || task.status === "abandoned") return false;
    if (task.status === "completed") return showCompleted;
    return true;
  });
}

export function CalendarMonth({
  monthDate,
  onMonthDate,
  draft,
  selectedTaskId,
  onSelectTask,
  onDraft,
  onCommitDraft,
}: {
  monthDate: Date;
  onMonthDate: (date: Date) => void;
  draft: Draft | null;
  selectedTaskId?: string;
  onSelectTask: (taskId?: string) => void;
  onDraft: (draft: Draft | null) => void;
  onCommitDraft: () => Promise<void>;
}) {
  const cortex = useCortex();
  const [filterList, setFilterList] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const draggedRef = useRef(false);
  const grid = buildMonthGrid(monthDate, cortex.settings.weekStartsOn);
  const matchesList = (task: Task) => {
    if (filterList === "all") return true;
    if (filterList === "inbox") return task.listId === null;
    return task.listId === filterList;
  };
  const visible = calendarTasks(cortex.tasks, cortex.settings.showCompleted).filter(
    matchesList,
  );
  const { bars, overflow } = useMemo(
    () => layoutMonthBars(visible, grid.weeks),
    [grid.weeks, visible],
  );
  const taskById = useMemo(
    () => new Map(cortex.tasks.map((task) => [task.id, task])),
    [cortex.tasks],
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const undated = undatedOpenTasks(cortex.tasks).filter(matchesList);

  const colorFor = (task: Task) =>
    cortex.lists.find((list) => list.id === task.listId)?.color ?? "#57534e";

  const applyDrop = (task: Task, iso: string) => {
    const range = taskDateRange(task);
    if (!range) {
      void cortex.updateTask({ ...task, startDate: iso, dueDate: iso });
      return;
    }
    const days = durationDays(task);
    void cortex.updateTask({
      ...task,
      startDate: iso,
      dueDate: addIsoDays(iso, days),
    });
  };

  const onDragStart = (event: DragStartEvent) => {
    draggedRef.current = true;
    setActiveId(String(event.active.id));
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const overId = event.over?.id ? String(event.over.id) : "";
    if (!overId.startsWith("day:")) return;
    const iso = overId.slice(4);
    const active = String(event.active.id);
    const taskId = active.startsWith("task:")
      ? active.slice(5)
      : active.startsWith("undated:")
        ? active.slice(8)
        : null;
    if (!taskId) return;
    const task = taskById.get(taskId);
    if (task) applyDrop(task, iso);
    window.setTimeout(() => {
      draggedRef.current = false;
    }, 300);
  };

  const activeTask = activeId
    ? taskById.get(activeId.replace(/^(task:|undated:)/, ""))
    : undefined;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        draggedRef.current = false;
      }}
    >
      <section className="main calendar-wrap" aria-labelledby="cal-title">
        <div className="cal-toolbar">
          <button
            type="button"
            className="icon-btn"
            aria-label="上个月"
            onClick={() => onMonthDate(addMonths(monthDate, -1))}
          >
            ‹
          </button>
          <h1 id="cal-title">{monthTitle(monthDate)}</h1>
          <button
            type="button"
            className="icon-btn"
            aria-label="下个月"
            onClick={() => onMonthDate(addMonths(monthDate, 1))}
          >
            ›
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => onMonthDate(parseISO(`${todayIso()}`))}
          >
            今天
          </button>
          <div className="toolbar">
            <label className="field" style={{ margin: 0 }}>
              <span className="live">按清单筛选</span>
              <select
                name="calendar-list-filter"
                value={filterList}
                onChange={(event) => setFilterList(event.target.value)}
                aria-label="按清单筛选"
              >
                <option value="all">全部清单</option>
                <option value="inbox">收集箱</option>
                {cortex.lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="primary-btn"
              onClick={() =>
                onDraft({
                  title: "",
                  listId: null,
                  startDate: todayIso(),
                  dueDate: todayIso(),
                  tagIds: [],
                  source: "toolbar",
                  anchorDate: todayIso(),
                })
              }
            >
              <IconPlus /> 添加
            </button>
          </div>
        </div>
        {draft?.source === "toolbar" ? (
          <form
            className="composer"
            onSubmit={(event) => {
              event.preventDefault();
              void onCommitDraft();
            }}
          >
            <input
              name="toolbar-task"
              autoComplete="off"
              autoFocus
              placeholder="今天要做的事…"
              value={draft.title}
              onChange={(event) => onDraft({ ...draft, title: event.target.value })}
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
        ) : null}
        <div className="weekdays">
          {weekdayLabels(cortex.settings.weekStartsOn).map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="month-body">
          {grid.weeks.map((week, weekIndex) => (
            <div className="week" key={week[0]}>
              {week.map((iso) => (
                <DayCell
                  key={iso}
                  iso={iso}
                  monthDate={monthDate}
                  overflow={overflow.get(iso) ?? 0}
                  onCreate={() => {
                    if (draggedRef.current) return;
                    onDraft({
                      title: "",
                      listId: filterList === "all" || filterList === "inbox" ? null : filterList,
                      startDate: iso,
                      dueDate: iso,
                      tagIds: [],
                      source: "cell",
                      anchorDate: iso,
                    });
                  }}
                />
              ))}
              <div className="week-bars">
                {bars
                  .filter((bar) => bar.weekIndex === weekIndex)
                  .map((bar) => {
                    const task = taskById.get(bar.taskId);
                    if (!task) return null;
                    return (
                      <CalendarBar
                        key={`${bar.taskId}-${bar.weekIndex}-${bar.startCol}`}
                        task={task}
                        bar={bar}
                        color={colorFor(task)}
                        selected={task.id === selectedTaskId}
                        onSelect={() => onSelectTask(task.id)}
                      />
                    );
                  })}
              </div>
              {draft?.source === "cell" &&
              draft.anchorDate &&
              week.includes(draft.anchorDate) ? (
                <form
                  className="popover cell-pop"
                  style={{
                    left: `calc(${(week.indexOf(draft.anchorDate) / 7) * 100}% + 8px)`,
                    top: 36,
                  }}
                  onSubmit={(event) => {
                    event.preventDefault();
                    void onCommitDraft();
                  }}
                >
                  <label className="field">
                    <span>准备做什么？</span>
                    <input
                      name="cell-task"
                      autoComplete="off"
                      autoFocus
                      placeholder="输入标题…"
                      value={draft.title}
                      onChange={(event) =>
                        onDraft({ ...draft, title: event.target.value })
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          event.preventDefault();
                          onDraft(null);
                        }
                      }}
                    />
                  </label>
                  <p className="group-label">{draft.anchorDate} · Esc 取消空标题</p>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      </section>
      <aside className="schedule" aria-label="安排任务">
        <h2>安排任务</h2>
        <p className="group-label">没有日期的任务。拖进某一天即排期。</p>
        {undated.length === 0 ? (
          <p className="group-label">收集箱里暂时没有未排期的事。</p>
        ) : (
          undated.map((task) => <UndatedItem key={task.id} task={task} />)
        )}
      </aside>
      <DragOverlay>
        {activeTask ? (
          <div className="task-bar" style={{ background: colorFor(activeTask) }}>
            <span className="bar-title">{activeTask.title}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function DayCell({
  iso,
  monthDate,
  overflow,
  onCreate,
}: {
  iso: string;
  monthDate: Date;
  overflow: number;
  onCreate: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${iso}`, data: { iso } });
  const date = parseISO(iso);
  const today = iso === todayIso();
  return (
    <div
      ref={setNodeRef}
      className={`day-cell${isOver ? " is-over" : ""}${today ? " is-today" : ""}${
        isSameMonth(date, monthDate) ? "" : " is-out"
      }`}
      data-date={iso}
      onClick={onCreate}
    >
      <button
        type="button"
        className="day-num"
        onClick={(event) => {
          event.stopPropagation();
          onCreate();
        }}
        aria-label={`${iso}，创建任务`}
      >
        {format(date, "d")}
      </button>
      {overflow > 0 ? <div className="overflow">+{overflow}</div> : null}
    </div>
  );
}

function CalendarBar({
  task,
  bar,
  color,
  selected,
  onSelect,
}: {
  task: Task;
  bar: {
    startCol: number;
    span: number;
    lane: number;
    showTitle: boolean;
    continuesBefore: boolean;
    continuesAfter: boolean;
  };
  color: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const cortex = useCortex();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task:${task.id}`,
    data: { taskId: task.id },
  });
  const resizing = useRef<"start" | "end" | null>(null);

  const onPointerMove = (event: PointerEvent) => {
    const edge = resizing.current;
    if (!edge) return;
    const node = document
      .elementsFromPoint(event.clientX, event.clientY)
      .find((el) => el instanceof HTMLElement && el.dataset.date);
    const iso = node instanceof HTMLElement ? node.dataset.date : undefined;
    if (!iso) return;
    const range = taskDateRange(task);
    if (!range) return;
    if (edge === "start") {
      const start = iso <= range.end ? iso : range.end;
      if (start !== task.startDate) {
        void cortex.updateTask({ ...task, startDate: start, dueDate: range.end });
      }
    } else {
      const end = iso >= range.start ? iso : range.start;
      if (end !== task.dueDate) {
        void cortex.updateTask({ ...task, startDate: range.start, dueDate: end });
      }
    }
  };

  const stopResize = () => {
    resizing.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", stopResize);
  };

  const startResize = (edge: "start" | "end") => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    resizing.current = edge;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopResize);
  };

  return (
    <div
      ref={setNodeRef}
      className={`task-bar${task.status === "completed" ? " is-done" : ""}`}
      style={{
        gridColumn: `${bar.startCol + 1} / span ${bar.span}`,
        gridRow: bar.lane + 1,
        background: color,
        outline: selected ? "2px solid #1a1612" : undefined,
        opacity: isDragging ? 0.35 : 1,
        borderRadius: bar.continuesBefore
          ? "0 3px 3px 0"
          : bar.continuesAfter
            ? "3px 0 0 3px"
            : 3,
      }}
      {...listeners}
      {...attributes}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <button
        type="button"
        className="handle left"
        aria-label="改开始日期"
        onPointerDown={startResize("start")}
      />
      <input
        type="checkbox"
        checked={task.status === "completed"}
        aria-label={`完成 ${task.title}`}
        onChange={() =>
          void cortex.setTaskStatus(
            task,
            task.status === "completed" ? "open" : "completed",
          )
        }
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      />
      {bar.showTitle ? <span className="bar-title">{task.title}</span> : null}
      <button
        type="button"
        className="handle right"
        aria-label="改结束日期"
        onPointerDown={startResize("end")}
      />
    </div>
  );
}

function UndatedItem({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `undated:${task.id}`,
    data: { taskId: task.id },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      className="schedule-item"
      {...listeners}
      {...attributes}
    >
      {task.title}
    </button>
  );
}
