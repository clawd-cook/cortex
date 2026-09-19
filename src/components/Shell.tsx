import { Button } from "@base-ui/react/button";
import { ContextMenu } from "@base-ui/react/context-menu";
import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Input } from "@base-ui/react/input";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Separator } from "@base-ui/react/separator";
import {
  addMonths,
  format,
  isSameMonth,
  parseISO,
} from "date-fns";
import { useState, type ReactNode } from "react";
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
import { AppDialog, AppScrollArea, ConfirmDialog, Hint } from "./ui";

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
        <Hint label="V1 之后">
          <button type="button" className="rail-btn is-soon" disabled>
            <IconHabit />
            习惯
          </button>
        </Hint>
        <Hint label="V1 之后">
          <button type="button" className="rail-btn is-soon" disabled>
            <IconCountdown />
            倒数
          </button>
        </Hint>
      </div>
      <div className="rail-spacer" />
      <Button type="button" className="rail-btn" onClick={onOpenSettings} aria-label="设置">
        <IconSettings />
        设置
      </Button>
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
    <Form
      className="dialog-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <h2 className="live">{title}</h2>
      {onEmoji ? (
        <Field.Root className="field" name="emoji">
          <Field.Label>图标</Field.Label>
          <RadioGroup
            className="swatches"
            value={emoji}
            onValueChange={(value) => onEmoji(String(value))}
            aria-label="图标"
          >
            {EMOJI_CHOICES.map((item) => (
              <Radio.Root
                key={item}
                value={item}
                className="swatch"
                aria-label={`图标 ${item}`}
              >
                {item}
                <Radio.Indicator className="live" />
              </Radio.Root>
            ))}
          </RadioGroup>
        </Field.Root>
      ) : null}
      <Field.Root className="field" name="name">
        <Field.Label>名称</Field.Label>
        <Input
          autoComplete="off"
          value={name}
          onValueChange={onName}
          placeholder="例如：项目清单…"
        />
      </Field.Root>
      <Field.Root className="field" name="color">
        <Field.Label>颜色</Field.Label>
        <RadioGroup
          className="swatches"
          value={color}
          onValueChange={(value) => onColor(String(value))}
          aria-label="颜色"
        >
          {colors.map((item) => (
            <Radio.Root
              key={item}
              value={item}
              className="swatch"
              style={{ background: item }}
              aria-label={`颜色 ${item}`}
            >
              <Radio.Indicator className="live" />
            </Radio.Root>
          ))}
        </RadioGroup>
      </Field.Root>
      <div className="toolbar">
        {onDelete ? (
          <Button type="button" className="ghost-btn danger-btn" onClick={onDelete}>
            删除
          </Button>
        ) : null}
        <Button type="submit" className="primary-btn" disabled={!name.trim()}>
          {submitLabel}
        </Button>
      </div>
    </Form>
  );
}

function ListNavItem({
  list,
  active,
  count,
  onEdit,
}: {
  list: List;
  active: boolean;
  count: number;
  onEdit: () => void;
}) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger
        render={
          <a
            className={`side-item${active ? " is-active" : ""}`}
            href={toHash({ name: "list", listId: list.id })}
          />
        }
      >
        <span>{list.emoji}</span>
        <i className="dot" style={{ background: list.color }} />
        <span>{list.name}</span>
        <b className="count">{count}</b>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner sideOffset={4}>
          <ContextMenu.Popup className="menu-popup">
            <ContextMenu.Item className="menu-item" onClick={onEdit}>
              编辑清单
            </ContextMenu.Item>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

function TagNavItem({
  tag,
  active,
  count,
  onEdit,
}: {
  tag: Tag;
  active: boolean;
  count: number;
  onEdit: () => void;
}) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger
        render={
          <a
            className={`side-item${active ? " is-active" : ""}`}
            href={toHash({ name: "tag", tagId: tag.id })}
          />
        }
      >
        <i className="dot" style={{ background: tag.color }} />
        <span>{tag.name}</span>
        <b className="count">{count}</b>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner sideOffset={4}>
          <ContextMenu.Popup className="menu-popup">
            <ContextMenu.Item className="menu-item" onClick={onEdit}>
              编辑标签
            </ContextMenu.Item>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
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
  const [confirmKind, setConfirmKind] = useState<"list" | "tag" | null>(null);

  const openCounts = {
    inbox: inboxTasks(cortex.tasks).length,
    today: todayTasks(cortex.tasks, today).length,
    tomorrow: tomorrowTasks(cortex.tasks, tomorrow).length,
    completed: tasksForStatus(cortex.tasks, "completed").length,
    abandoned: tasksForStatus(cortex.tasks, "abandoned").length,
    trash: tasksForStatus(cortex.tasks, "trash").length,
  };

  const closeEditors = () => {
    setListEditor(null);
    setTagEditor(null);
    setConfirmKind(null);
  };

  return (
    <aside className="sidebar">
      <AppScrollArea className="sidebar-scroll">
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

        <Separator className="side-rule" />

        <section className="side-section" aria-label="清单">
          <div className="side-heading">
            清单
            <Hint label="新建清单" side="top">
              <Button
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
              </Button>
            </Hint>
          </div>
          {cortex.lists.length === 0 ? (
            <p className="group-label">还没有清单。先建「项目清单」和「下一步行动池」。</p>
          ) : null}
          {cortex.lists.map((list) => (
            <ListNavItem
              key={list.id}
              list={list}
              active={isRoute(route, "list", list.id)}
              count={countOpen(cortex.tasks.filter((task) => task.listId === list.id))}
              onEdit={() => {
                setDraftName(list.name);
                setDraftColor(list.color);
                setDraftEmoji(list.emoji || "📦");
                setListEditor(list);
              }}
            />
          ))}
        </section>

        <section className="side-section" aria-label="标签">
          <div className="side-heading">
            标签
            <Hint label="新建标签" side="top">
              <Button
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
              </Button>
            </Hint>
          </div>
          {cortex.tags.map((tag) => (
            <TagNavItem
              key={tag.id}
              tag={tag}
              active={isRoute(route, "tag", tag.id)}
              count={tasksForTag(cortex.tasks, tag.id).length}
              onEdit={() => {
                setDraftName(tag.name);
                setDraftColor(tag.color);
                setTagEditor(tag);
              }}
            />
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
      </AppScrollArea>
      <MiniMonth monthDate={monthDate} onMonthDate={onMonthDate} />

      <AppDialog
        open={listEditor !== null}
        onOpenChange={(open) => {
          if (!open) closeEditors();
        }}
        title={listEditor === "new" ? "新建清单" : "编辑清单"}
      >
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
            listEditor === "new" || listEditor === null
              ? undefined
              : () => setConfirmKind("list")
          }
          onSubmit={() => {
            if (listEditor === "new") {
              void cortex.createList({
                name: draftName,
                color: draftColor,
                emoji: draftEmoji,
              });
            } else if (listEditor) {
              void cortex.updateList({
                ...listEditor,
                name: draftName.trim(),
                color: draftColor,
                emoji: draftEmoji,
              });
            }
            closeEditors();
          }}
        />
      </AppDialog>

      <AppDialog
        open={tagEditor !== null}
        onOpenChange={(open) => {
          if (!open) closeEditors();
        }}
        title={tagEditor === "new" ? "新建标签" : "编辑标签"}
      >
        <EntityEditor
          title={tagEditor === "new" ? "新建标签" : "编辑标签"}
          name={draftName}
          color={draftColor}
          colors={TAG_COLORS}
          onName={setDraftName}
          onColor={setDraftColor}
          submitLabel={tagEditor === "new" ? "创建标签" : "保存标签"}
          onDelete={
            tagEditor === "new" || tagEditor === null
              ? undefined
              : () => setConfirmKind("tag")
          }
          onSubmit={() => {
            if (tagEditor === "new") {
              void cortex.createTag({ name: draftName, color: draftColor });
            } else if (tagEditor) {
              void cortex.updateTag({
                ...tagEditor,
                name: draftName.trim(),
                color: draftColor,
              });
            }
            closeEditors();
          }}
        />
      </AppDialog>

      <ConfirmDialog
        open={confirmKind !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmKind(null);
        }}
        title={confirmKind === "tag" ? "删除标签？" : "删除清单？"}
        description={
          confirmKind === "tag"
            ? `删除标签「${draftName}」？`
            : `删除清单「${draftName}」？任务会回到收集箱。`
        }
        confirmLabel="删除"
        onConfirm={() => {
          if (confirmKind === "list" && listEditor && listEditor !== "new") {
            void cortex.removeList(listEditor.id);
          }
          if (confirmKind === "tag" && tagEditor && tagEditor !== "new") {
            void cortex.removeTag(tagEditor.id);
          }
          closeEditors();
        }}
      />
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
        <Button
          type="button"
          className="icon-btn"
          aria-label="上个月"
          onClick={() => onMonthDate(addMonths(monthDate, -1))}
        >
          ‹
        </Button>
        <strong>{monthTitle(monthDate)}</strong>
        <Button
          type="button"
          className="icon-btn"
          aria-label="下个月"
          onClick={() => onMonthDate(addMonths(monthDate, 1))}
        >
          ›
        </Button>
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
