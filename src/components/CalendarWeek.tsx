import { Button } from "@base-ui/react/button";
import { Form } from "@base-ui/react/form";
import { Input } from "@base-ui/react/input";
import { Toolbar } from "@base-ui/react/toolbar";
import { addWeeks, format, startOfWeek } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconPlus } from "../icons";
import { layoutMonthBars } from "../lib/calendar-layout";
import { dayCulture } from "../lib/culture";
import {
  todayIso,
  weekDays,
  weekRangeLabel,
  weekdayLabels,
} from "../lib/dates";
import { habitsOnDay, undatedOpenTasks } from "../lib/filters";
import { eventMinutes, hourLabel, minutesToHm } from "../lib/times";
import { isTimedTask, layoutTimedEvents } from "../lib/week-layout";
import { useCortex } from "../state/store";
import { isHabit, LIST_FALLBACK_COLOR, type Draft, type Task } from "../types";
import { CalendarViewToggle } from "./CalendarChrome";
import { AppSelect } from "./ui";

const HOUR_HEIGHT = 48;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

function calendarTasks(tasks: Task[], showCompleted: boolean): Task[] {
  return tasks.filter((task) => {
    if (isHabit(task)) return false;
    if (task.status === "trash" || task.status === "abandoned") return false;
    if (task.status === "completed") return showCompleted;
    return true;
  });
}

export function CalendarWeek({
  weekDate,
  onWeekDate,
  draft,
  selectedTaskId,
  onSelectTask,
  onDraft,
  onCommitDraft,
}: {
  weekDate: Date;
  onWeekDate: (date: Date) => void;
  draft: Draft | null;
  selectedTaskId?: string;
  onSelectTask: (taskId?: string) => void;
  onDraft: (draft: Draft | null) => void;
  onCommitDraft: () => Promise<void>;
}) {
  const cortex = useCortex();
  const [filterList, setFilterList] = useState("all");
  const [now, setNow] = useState(() => new Date());
  const scrollRef = useRef<HTMLDivElement>(null);
  const days = weekDays(weekDate, cortex.settings.weekStartsOn);
  const today = todayIso();
  const matchesList = (task: Task) => {
    if (filterList === "all") return true;
    if (filterList === "none") return task.listId === null;
    return task.listId === filterList;
  };
  const visible = calendarTasks(cortex.tasks, cortex.settings.showCompleted).filter(matchesList);
  const allDayTasks = visible.filter((task) => !isTimedTask(task));
  const { bars } = useMemo(() => layoutMonthBars(allDayTasks, [days]), [allDayTasks, days]);
  const taskById = useMemo(
    () => new Map(cortex.tasks.map((task) => [task.id, task])),
    [cortex.tasks],
  );
  const undated = undatedOpenTasks(cortex.tasks).filter(matchesList);
  const monthKey = format(weekDate, "yyyy-MM");
  const weekKey = days[0];

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const top = Math.max(0, now.getHours() * HOUR_HEIGHT - HOUR_HEIGHT * 2);
    node.scrollTop = top;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only jump once when the week loads
  }, [days[0]]);

  const colorFor = (task: Task) =>
    cortex.lists.find((list) => list.id === task.listId)?.color ?? LIST_FALLBACK_COLOR;

  const filterItems = [
    { value: "all", label: "全部项目" },
    { value: "none", label: "无项目" },
    ...cortex.lists.map((list) => ({ value: list.id, label: list.name })),
  ];

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const todayIndex = days.indexOf(today);

  return (
    <>
    <section className="main calendar-wrap" aria-labelledby="cal-title">
      <Toolbar.Root className="cal-toolbar" aria-label="周视图">
        <Toolbar.Button className="icon-btn" aria-label="上一周" onClick={() => onWeekDate(addWeeks(weekDate, -1))}>
          ‹
        </Toolbar.Button>
        <h1 id="cal-title">{weekRangeLabel(days)}</h1>
        <Toolbar.Button className="icon-btn" aria-label="下一周" onClick={() => onWeekDate(addWeeks(weekDate, 1))}>
          ›
        </Toolbar.Button>
        <Toolbar.Button
          className="ghost-btn"
          onClick={() => onWeekDate(startOfWeek(new Date(), { weekStartsOn: cortex.settings.weekStartsOn }))}
        >
          今天
        </Toolbar.Button>
        <CalendarViewToggle view="week" month={monthKey} week={weekKey} />
        <div className="toolbar">
          <label className="field" style={{ margin: 0 }}>
            <span className="live">按项目筛选</span>
            <AppSelect
              name="week-list-filter"
              aria-label="按项目筛选"
              value={filterList}
              onValueChange={setFilterList}
              items={filterItems}
            />
          </label>
          <Toolbar.Button
            className="primary-btn"
            onClick={() =>
              onDraft({
                title: "",
                listId: null,
                startDate: today,
                dueDate: today,
                tagIds: [],
                source: "toolbar",
                anchorDate: today,
                allDay: true,
              })
            }
          >
            <IconPlus /> 添加
          </Toolbar.Button>
        </div>
      </Toolbar.Root>
      {draft && draft.source !== "list" ? (
        <Form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            void onCommitDraft();
          }}
        >
          <Input
            name="week-task"
            autoComplete="off"
            placeholder={draft.allDay === false ? "此时段要做的事…" : "这天要做的事…"}
            value={draft.title}
            onValueChange={(title) => onDraft({ ...draft, title })}
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
      ) : null}
      <div className="week-board">
        <div className="week-head">
          <span className="week-gutter-label" />
          {days.map((iso, index) => {
            const culture = dayCulture(iso);
            const date = iso.slice(8);
            return (
              <div key={iso} className={`week-day-head${iso === today ? " is-today" : ""}`}>
                <strong>
                  {weekdayLabels(cortex.settings.weekStartsOn)[index]} {Number(date)}
                </strong>
                <span className="day-culture">
                  {cortex.settings.showHolidays && culture.rest ? (
                    <b className={`rest-badge is-${culture.rest}`}>{culture.rest === "off" ? "休" : "班"}</b>
                  ) : null}
                  {cortex.settings.showLunar ? <span>{culture.lunar}</span> : null}
                  {cortex.settings.showLunar && culture.festival ? (
                    <span className="fest">{culture.festival}</span>
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>
        <div className="week-allday">
          <span className="week-gutter-label">全天</span>
          <div className="week-allday-cols">
            {days.map((iso) => (
              <button
                key={iso}
                type="button"
                className="week-allday-cell"
                aria-label={`${iso}，创建全天任务`}
                onClick={() =>
                  onDraft({
                    title: "",
                    listId: filterList === "all" || filterList === "none" ? null : filterList,
                    startDate: iso,
                    dueDate: iso,
                    tagIds: [],
                    source: "cell",
                    anchorDate: iso,
                    allDay: true,
                  })
                }
              >
                {habitsOnDay(cortex.tasks, iso, today)
                  .filter(() => cortex.settings.showHabits)
                  .map((habit) => (
                    <span key={habit.id} className="habit-chip">
                      {habit.title}
                    </span>
                  ))}
              </button>
            ))}
            <div className="week-bars week-allday-bars">
              {bars.map((bar) => {
                const task = taskById.get(bar.taskId);
                if (!task) return null;
                return (
                  <button
                    key={`${bar.taskId}-${bar.startCol}`}
                    type="button"
                    className={`task-bar${task.status === "completed" ? " is-done" : ""}${task.id === selectedTaskId ? " is-selected" : ""}`}
                    style={{
                      gridColumn: `${bar.startCol + 1} / span ${bar.span}`,
                      gridRow: bar.lane + 1,
                      background: colorFor(task),
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectTask(task.id);
                    }}
                  >
                    {bar.showTitle ? <span className="bar-title">{task.title}</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="week-scroll" ref={scrollRef}>
          <div className="week-gutter">
            {HOURS.map((hour) => (
              <div key={hour} className="week-hour-label" style={{ height: HOUR_HEIGHT }}>
                {hourLabel(hour)}
              </div>
            ))}
          </div>
          <div className="week-cols">
            {days.map((iso, dayIndex) => {
              const timed = visible.filter(
                (task) => isTimedTask(task) && (task.startDate === iso || task.dueDate === iso),
              );
              const placements = layoutTimedEvents(
                timed.flatMap((task) => {
                  const minutes = eventMinutes(task);
                  return minutes ? [{ id: task.id, ...minutes }] : [];
                }),
              );
              return (
                <div key={iso} className={`week-col${iso === today ? " is-today" : ""}`}>
                  {HOURS.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      className="week-slot"
                      style={{ height: HOUR_HEIGHT }}
                      aria-label={`${iso} ${hourLabel(hour)}，创建任务`}
                      onClick={() =>
                        onDraft({
                          title: "",
                          listId: filterList === "all" || filterList === "none" ? null : filterList,
                          startDate: iso,
                          dueDate: iso,
                          tagIds: [],
                          source: "slot",
                          anchorDate: iso,
                          allDay: false,
                          startTime: minutesToHm(hour * 60),
                          endTime: hour === 23 ? "23:59" : minutesToHm((hour + 1) * 60),
                        })
                      }
                    />
                  ))}
                  {placements.map((place) => {
                    const task = taskById.get(place.taskId);
                    if (!task) return null;
                    const width = 100 / place.cols;
                    return (
                      <button
                        key={task.id}
                        type="button"
                        className={`timed-event${task.status === "completed" ? " is-done" : ""}${task.id === selectedTaskId ? " is-selected" : ""}`}
                        style={{
                          top: (place.startMin / 60) * HOUR_HEIGHT,
                          height: ((place.endMin - place.startMin) / 60) * HOUR_HEIGHT,
                          left: `calc(${place.col * width}% + 2px)`,
                          width: `calc(${width}% - 4px)`,
                          background: colorFor(task),
                        }}
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectTask(task.id);
                        }}
                      >
                        <strong>{task.title}</strong>
                        <span>
                          {task.startTime}
                          {task.endTime ? `–${task.endTime}` : ""}
                        </span>
                      </button>
                    );
                  })}
                  {todayIndex === dayIndex ? (
                    <div
                      className="now-line"
                      style={{ top: (nowMinutes / 60) * HOUR_HEIGHT }}
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
      <aside className="schedule week-schedule" aria-label="未排期下一步">
        <h2>未排期下一步</h2>
        <p className="group-label">已处理但还没有日期。点「添加」排到今天，或去月历里拖进某一天。</p>
        {undated.length === 0 ? (
          <p className="group-label">暂时没有未排期的下一步。</p>
        ) : (
          undated.map((task) => (
            <p key={task.id} className="schedule-item">
              {task.title}
            </p>
          ))
        )}
      </aside>
    </>
  );
}
