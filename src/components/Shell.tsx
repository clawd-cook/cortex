import {
  addMonths,
  format,
  isSameMonth,
  parseISO,
} from "date-fns";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  IconCalendar,
  IconCheck,
  IconCountdown,
  IconHabit,
  IconInbox,
  IconPlus,
  IconSettings,
  IconSun,
  IconTrash,
} from "../icons";
import {
  addIsoDays,
  buildMonthGrid,
  monthTitle,
  todayIso,
  weekdayLabels,
} from "../lib/dates";
import {
  countOpen,
  inboxTasks,
  tasksForStatus,
  tasksForTag,
  todayTasks,
  tomorrowTasks,
} from "../lib/filters";
import type { Route } from "../lib/route";
import { toHash } from "../lib/route";
import { useCortex } from "../state/store";
import { EMOJI_CHOICES, LIST_COLORS, TAG_COLORS, type List, type Tag } from "../types";

function isRoute(route: Route, name: Route["name"], id?: string): boolean {
  if (route.name !== name) return false;
  if (name === "list" && route.name === "list") return route.listId === id;
  if (name === "tag" && route.name === "tag") return route.tagId === id;
  return true;
}

export function Rail({
  route,
  onOpenSettings,
}: {
  route: Route;
  onOpenSettings: () => void;
}) {
  return (
    <nav className="rail" aria-label="模块">
      <a className="brand" href="#/smart/today" translate="no">
        Cx
      </a>
      <div className="rail-nav">
        <a
          className={`rail-btn${route.name !== "calendar" && route.name !== "search" ? " is-active" : ""}`}
          href="#/smart/today"
        >
          <IconInbox />
          任务
        </a>
        <a
          className={`rail-btn${route.name === "calendar" ? " is-active" : ""}`}
          href="#/calendar/month"
        >
          <IconCalendar />
          日历
        </a>
        <button type="button" className="rail-btn is-soon" disabled>
          <IconHabit />
          习惯
        </button>
        <button type="button" className="rail-btn is-soon" disabled>
          <IconCountdown />
          倒数
        </button>
      </div>
      <div className="rail-spacer" />
      <button
        type="button"
        className="rail-btn"
        onClick={onOpenSettings}
        aria-label="设置"
      >
        <IconSettings />
        设置
      </button>
    </nav>
  );
}

function EntityEditor({
  title,
  name,
  color,
  colors,
  emoji,
  onName,
  onColor,
  onEmoji,
  onSubmit,
  onDelete,
  submitLabel,
}: {
  title: string;
  name: string;
  color: string;
  colors: readonly string[];
  emoji?: string;
  onName: (value: string) => void;
  onColor: (value: string) => void;
  onEmoji?: (value: string) => void;
  onSubmit: () => void;
  onDelete?: () => void;
  submitLabel: string;
}) {
  return (
    <form
      className="dialog-card"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <h2>{title}</h2>
      {onEmoji ? (
        <div className="field">
          <span>图标</span>
          <div className="swatches">
            {EMOJI_CHOICES.map((item) => (
              <button
                key={item}
                type="button"
                className={`swatch${emoji === item ? " is-on" : ""}`}
                onClick={() => onEmoji(item)}
                aria-label={`图标 ${item}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <label className="field">
        <span>名称</span>
        <input
          name={title}
          autoComplete="off"
          value={name}
          onChange={(event) => onName(event.target.value)}
          placeholder="例如：项目清单…"
        />
      </label>
      <div className="field">
        <span>颜色</span>
        <div className="swatches">
          {colors.map((item) => (
            <button
              key={item}
              type="button"
              className={`swatch${color === item ? " is-on" : ""}`}
              style={{ background: item }}
              onClick={() => onColor(item)}
              aria-label={`颜色 ${item}`}
            />
          ))}
        </div>
      </div>
      <div className="toolbar">
        {onDelete ? (
          <button type="button" className="ghost-btn danger-btn" onClick={onDelete}>
            删除
          </button>
        ) : null}
        <button type="submit" className="primary-btn" disabled={!name.trim()}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export function Sidebar({
  route,
  monthDate,
  onMonthDate,
}: {
  route: Route;
  monthDate: Date;
  onMonthDate: (date: Date) => void;
}) {
  const cortex = useCortex();
  const today = todayIso();
  const tomorrow = addIsoDays(today, 1);
  const [listEditor, setListEditor] = useState<List | "new" | null>(null);
  const [tagEditor, setTagEditor] = useState<Tag | "new" | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftColor, setDraftColor] = useState<string>(LIST_COLORS[0]);
  const [draftEmoji, setDraftEmoji] = useState("📦");

  const openCounts = {
    inbox: inboxTasks(cortex.tasks).length,
    today: todayTasks(cortex.tasks, today).length,
    tomorrow: tomorrowTasks(cortex.tasks, tomorrow).length,
    completed: tasksForStatus(cortex.tasks, "completed").length,
    abandoned: tasksForStatus(cortex.tasks, "abandoned").length,
    trash: tasksForStatus(cortex.tasks, "trash").length,
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-scroll">
        <section className="side-section" aria-label="智能清单">
          <div className="side-heading">智能清单</div>
          <a
            className={`side-link${isRoute(route, "inbox") ? " is-active" : ""}`}
            href="#/lists/inbox"
          >
            <IconInbox />
            <span>收集箱</span>
            <b className="count">{openCounts.inbox}</b>
          </a>
          <a
            className={`side-link${isRoute(route, "today") ? " is-active" : ""}`}
            href="#/smart/today"
          >
            <IconSun />
            <span>今天</span>
            <b className="count">{openCounts.today}</b>
          </a>
          <a
            className={`side-link${isRoute(route, "tomorrow") ? " is-active" : ""}`}
            href="#/smart/tomorrow"
          >
            <IconCalendar />
            <span>明天</span>
            <b className="count">{openCounts.tomorrow}</b>
          </a>
        </section>

        <section className="side-section" aria-label="清单">
          <div className="side-heading">
            清单
            <button
              type="button"
              className="icon-btn"
              aria-label="新建清单"
              onClick={() => {
                setDraftName("");
                setDraftColor(LIST_COLORS[cortex.lists.length % LIST_COLORS.length]);
                setDraftEmoji("📦");
                setListEditor("new");
              }}
            >
              <IconPlus />
            </button>
          </div>
          {cortex.lists.length === 0 ? (
            <p className="group-label">还没有清单。先建「项目清单」和「下一步行动池」。</p>
          ) : null}
          {cortex.lists.map((list) => (
            <a
              key={list.id}
              className={`side-item${isRoute(route, "list", list.id) ? " is-active" : ""}`}
              href={toHash({ name: "list", listId: list.id })}
              onContextMenu={(event) => {
                event.preventDefault();
                setDraftName(list.name);
                setDraftColor(list.color);
                setDraftEmoji(list.emoji || "📦");
                setListEditor(list);
              }}
            >
              <span>{list.emoji}</span>
              <i className="dot" style={{ background: list.color }} />
              <span>{list.name}</span>
              <b className="count">
                {countOpen(cortex.tasks.filter((task) => task.listId === list.id))}
              </b>
            </a>
          ))}
        </section>

        <section className="side-section" aria-label="标签">
          <div className="side-heading">
            标签
            <button
              type="button"
              className="icon-btn"
              aria-label="新建标签"
              onClick={() => {
                setDraftName("");
                setDraftColor(TAG_COLORS[cortex.tags.length % TAG_COLORS.length]);
                setTagEditor("new");
              }}
            >
              <IconPlus />
            </button>
          </div>
          {cortex.tags.map((tag) => (
            <a
              key={tag.id}
              className={`side-item${isRoute(route, "tag", tag.id) ? " is-active" : ""}`}
              href={toHash({ name: "tag", tagId: tag.id })}
              onContextMenu={(event) => {
                event.preventDefault();
                setDraftName(tag.name);
                setDraftColor(tag.color);
                setTagEditor(tag);
              }}
            >
              <i className="dot" style={{ background: tag.color }} />
              <span>{tag.name}</span>
              <b className="count">{tasksForTag(cortex.tasks, tag.id).length}</b>
            </a>
          ))}
        </section>

        <section className="side-section" aria-label="归档">
          <div className="side-heading">归档</div>
          <a
            className={`side-link${isRoute(route, "completed") ? " is-active" : ""}`}
            href="#/completed"
          >
            <IconCheck />
            <span>已完成</span>
            <b className="count">{openCounts.completed}</b>
          </a>
          <a
            className={`side-link${isRoute(route, "abandoned") ? " is-active" : ""}`}
            href="#/abandoned"
          >
            <span>已放弃</span>
            <b className="count">{openCounts.abandoned}</b>
          </a>
          <a
            className={`side-link${isRoute(route, "trash") ? " is-active" : ""}`}
            href="#/trash"
          >
            <IconTrash />
            <span>垃圾桶</span>
            <b className="count">{openCounts.trash}</b>
          </a>
        </section>
      </div>
      <MiniMonth monthDate={monthDate} onMonthDate={onMonthDate} />

      {listEditor ? (
        <div className="overlay" role="presentation" onClick={() => setListEditor(null)}>
          <div role="dialog" aria-labelledby="list-editor-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="list-editor-title" className="live">
              清单
            </h2>
            <EntityEditor
              title={listEditor === "new" ? "新建清单" : "编辑清单"}
              name={draftName}
              color={draftColor}
              colors={LIST_COLORS}
              emoji={draftEmoji}
              onName={setDraftName}
              onColor={setDraftColor}
              onEmoji={setDraftEmoji}
              submitLabel={listEditor === "new" ? "创建清单" : "保存清单"}
              onDelete={
                listEditor === "new"
                  ? undefined
                  : () => {
                      if (confirm(`删除清单「${draftName}」？任务会回到收集箱。`)) {
                        void cortex.removeList(listEditor.id);
                        setListEditor(null);
                      }
                    }
              }
              onSubmit={() => {
                if (listEditor === "new") {
                  void cortex.createList({
                    name: draftName,
                    color: draftColor,
                    emoji: draftEmoji,
                  });
                } else {
                  void cortex.updateList({
                    ...listEditor,
                    name: draftName.trim(),
                    color: draftColor,
                    emoji: draftEmoji,
                  });
                }
                setListEditor(null);
              }}
            />
          </div>
        </div>
      ) : null}

      {tagEditor ? (
        <div className="overlay" role="presentation" onClick={() => setTagEditor(null)}>
          <div role="dialog" aria-labelledby="tag-editor-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="tag-editor-title" className="live">
              标签
            </h2>
            <EntityEditor
              title={tagEditor === "new" ? "新建标签" : "编辑标签"}
              name={draftName}
              color={draftColor}
              colors={TAG_COLORS}
              onName={setDraftName}
              onColor={setDraftColor}
              submitLabel={tagEditor === "new" ? "创建标签" : "保存标签"}
              onDelete={
                tagEditor === "new"
                  ? undefined
                  : () => {
                      if (confirm(`删除标签「${draftName}」？`)) {
                        void cortex.removeTag(tagEditor.id);
                        setTagEditor(null);
                      }
                    }
              }
              onSubmit={() => {
                if (tagEditor === "new") {
                  void cortex.createTag({ name: draftName, color: draftColor });
                } else {
                  void cortex.updateTag({
                    ...tagEditor,
                    name: draftName.trim(),
                    color: draftColor,
                  });
                }
                setTagEditor(null);
              }}
            />
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function MiniMonth({
  monthDate,
  onMonthDate,
}: {
  monthDate: Date;
  onMonthDate: (date: Date) => void;
}) {
  const { settings, tasks } = useCortex();
  const grid = buildMonthGrid(monthDate, settings.weekStartsOn);
  const today = todayIso();
  const marked = new Set(
    tasks.flatMap((task) => {
      if (!task.startDate && !task.dueDate) return [];
      return [task.startDate, task.dueDate].filter(Boolean) as string[];
    }),
  );

  return (
    <div className="mini-month">
      <div className="mini-month-head">
        <button
          type="button"
          className="icon-btn"
          aria-label="上个月"
          onClick={() => onMonthDate(addMonths(monthDate, -1))}
        >
          ‹
        </button>
        <strong>{monthTitle(monthDate)}</strong>
        <button
          type="button"
          className="icon-btn"
          aria-label="下个月"
          onClick={() => onMonthDate(addMonths(monthDate, 1))}
        >
          ›
        </button>
      </div>
      <div className="mini-grid">
        {weekdayLabels(settings.weekStartsOn).map((label) => (
          <span key={label} className="mini-dow">
            {label}
          </span>
        ))}
        {grid.weeks.flat().map((iso) => {
          const date = parseISO(iso);
          return (
            <a
              key={iso}
              className={`mini-day${iso === today ? " is-today" : ""}${
                isSameMonth(date, monthDate) ? "" : " is-out"
              }`}
              href={`#/calendar/month?month=${format(date, "yyyy-MM")}`}
              aria-label={iso}
              title={marked.has(iso) ? "有任务" : undefined}
            >
              {date.getDate()}
            </a>
          );
        })}
      </div>
    </div>
  );
}

export function AppFrame({
  route,
  monthDate,
  onMonthDate,
  onOpenSettings,
  children,
}: {
  route: Route;
  monthDate: Date;
  onMonthDate: (date: Date) => void;
  onOpenSettings: () => void;
  children: ReactNode;
}) {
  return (
    <div className={`app-shell${route.name === "calendar" ? " is-calendar" : ""}`}>
      <Rail route={route} onOpenSettings={onOpenSettings} />
      <Sidebar route={route} monthDate={monthDate} onMonthDate={onMonthDate} />
      {children}
    </div>
  );
}
