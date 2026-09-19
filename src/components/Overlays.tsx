import { useEffect, useMemo, useState } from "react";
import { searchByTitle } from "../lib/filters";
import { toHash } from "../lib/route";
import { useCortex } from "../state/store";
import type { Settings } from "../types";

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable)
  );
}

export function SearchOverlay({
  open,
  query,
  onQuery,
  onClose,
}: {
  open: boolean;
  query: string;
  onQuery: (value: string) => void;
  onClose: () => void;
}) {
  const { tasks, lists } = useCortex();
  const results = useMemo(() => searchByTitle(tasks, query).slice(0, 20), [query, tasks]);

  if (!open) return null;
  return (
    <div className="overlay" role="presentation" onClick={onClose}>
      <div
        className="overlay-card"
        role="dialog"
        aria-labelledby="search-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="search-title" className="live">
          搜索标题
        </h2>
        <input
          className="search-input"
          name="search"
          autoComplete="off"
          autoFocus
          placeholder="搜索任务标题…"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") onClose();
          }}
        />
        <div aria-live="polite">
          {query.trim() && results.length === 0 ? <p>没有匹配的标题。</p> : null}
        </div>
        {results.map((task) => {
          const href = task.listId
            ? toHash({ name: "list", listId: task.listId, taskId: task.id })
            : toHash({ name: "inbox", taskId: task.id });
          return (
            <a key={task.id} className="result" href={href} onClick={onClose}>
              {task.title}
              <span className="chip">
                {lists.find((list) => list.id === task.listId)?.name ?? "收集箱"}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export function SettingsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { settings, updateSettings } = useCortex();
  if (!open) return null;

  const patch = (partial: Partial<Settings>) => {
    void updateSettings({ ...settings, ...partial });
  };

  return (
    <div className="overlay" role="presentation" onClick={onClose}>
      <div
        className="dialog-card"
        role="dialog"
        aria-labelledby="settings-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="settings-title">设置</h2>
        <label className="field">
          <span>星期开始于</span>
          <select
            name="week-starts-on"
            value={settings.weekStartsOn}
            onChange={(event) =>
              patch({ weekStartsOn: Number(event.target.value) as 0 | 1 })
            }
          >
            <option value={1}>周一</option>
            <option value={0}>周日</option>
          </select>
        </label>
        <label className="field" style={{ gridTemplateColumns: "auto 1fr", alignItems: "center" }}>
          <input
            type="checkbox"
            name="show-completed"
            checked={settings.showCompleted}
            onChange={(event) => patch({ showCompleted: event.target.checked })}
          />
          <span>显示已完成（列表折起来，月历上仍能看见）</span>
        </label>
        <p className="group-label">
          数据存在这台电脑。关掉 Cortex 再打开，清单和任务都还在。
        </p>
        <button type="button" className="primary-btn" onClick={onClose}>
          完成
        </button>
      </div>
    </div>
  );
}

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  const commands = [
    { href: "#/smart/today", label: "今天" },
    { href: "#/lists/inbox", label: "收集箱" },
    { href: "#/calendar/month", label: "月历" },
    { href: "#/search", label: "搜索标题" },
  ];
  return (
    <div className="overlay" role="presentation" onClick={onClose}>
      <div
        className="overlay-card"
        role="dialog"
        aria-labelledby="cmd-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="cmd-title">指令</h2>
        <p className="group-label">V1 占位。选一项即跳转。</p>
        {commands.map((item) => (
          <a key={item.href} className="result" href={item.href} onClick={onClose}>
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}

export function useAppHotkeys({
  onNew,
  onSearch,
  onToday,
  onInbox,
  onMonth,
  onEscape,
  onComplete,
  onCommand,
}: {
  onNew: () => void;
  onSearch: () => void;
  onToday: () => void;
  onInbox: () => void;
  onMonth: () => void;
  onEscape: () => void;
  onComplete: () => void;
  onCommand: () => void;
}) {
  const [chord, setChord] = useState<string | null>(null);

  useEffect(() => {
    let tabDown = false;
    let timer = 0;
    const down = (event: KeyboardEvent) => {
      if (event.key === "Tab") tabDown = true;
      if (event.key === "Escape") {
        onEscape();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onCommand();
        return;
      }
      if (isTypingTarget(event.target)) return;
      if (event.key === "/") {
        event.preventDefault();
        onSearch();
        return;
      }
      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        onNew();
        return;
      }
      if (chord === "g" && event.key.toLowerCase() === "t") {
        event.preventDefault();
        onToday();
        setChord(null);
        return;
      }
      if (chord === "g" && event.key.toLowerCase() === "i") {
        event.preventDefault();
        onInbox();
        setChord(null);
        return;
      }
      if (event.key.toLowerCase() === "g") {
        setChord("g");
        window.clearTimeout(timer);
        timer = window.setTimeout(() => setChord(null), 800);
        return;
      }
      if (event.key.toLowerCase() === "m" && tabDown) {
        event.preventDefault();
        onComplete();
        return;
      }
      if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        onMonth();
        return;
      }
      if (event.key.toLowerCase() === "e") {
        event.preventDefault();
        onComplete();
      }
    };
    const up = (event: KeyboardEvent) => {
      if (event.key === "Tab") tabDown = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.clearTimeout(timer);
    };
  }, [chord, onCommand, onComplete, onEscape, onInbox, onMonth, onNew, onSearch, onToday]);
}

export { isTypingTarget };
