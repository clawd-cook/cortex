import { Input } from "@base-ui/react/input";
import { useEffect, useMemo, useState } from "react";
import { isInboxTask, searchByTitle } from "../lib/filters";
import { toHash } from "../lib/route";
import { useCortex } from "../state/store";
import type { Settings } from "../types";
import { AppDialog, AppSelect, AppSwitch, Button } from "./ui";

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

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="搜索标题"
      hideTitle
      className="overlay-card"
    >
      <Input
        className="search-input"
        name="search"
        autoComplete="off"
        aria-label="搜索任务标题"
        placeholder="搜索任务标题…"
        value={query}
        onValueChange={onQuery}
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
          : isInboxTask(task)
            ? toHash({ name: "inbox", taskId: task.id })
            : toHash({ name: "next", taskId: task.id });
        return (
          <a key={task.id} className="result" href={href} onClick={onClose}>
            {task.title}
            <span className="chip">
              {lists.find((list) => list.id === task.listId)?.name ??
                (isInboxTask(task) ? "收集箱" : "独立")}
            </span>
          </a>
        );
      })}
    </AppDialog>
  );
}

export function SettingsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { settings, updateSettings, importCsv } = useCortex();
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const patch = (partial: Partial<Settings>) => {
    void updateSettings({ ...settings, ...partial });
  };

  return (
    <AppDialog open={open} onOpenChange={(next) => { if (!next) onClose(); }} title="设置">
      <label className="field">
        <span>星期开始于</span>
        <AppSelect
          name="week-starts-on"
          aria-label="星期开始于"
          value={String(settings.weekStartsOn)}
          onValueChange={(value) => patch({ weekStartsOn: Number(value) as 0 | 1 })}
          items={[
            { value: "1", label: "周一" },
            { value: "0", label: "周日" },
          ]}
        />
      </label>
      <label className="field" style={{ gridTemplateColumns: "auto 1fr", alignItems: "center" }}>
        <AppSwitch
          name="show-completed"
          checked={settings.showCompleted}
          onCheckedChange={(checked) => patch({ showCompleted: checked })}
        />
        <span>显示已完成（列表折起来，月历上仍能看见）</span>
      </label>
      <label className="field" style={{ gridTemplateColumns: "auto 1fr", alignItems: "center" }}>
        <AppSwitch
          name="show-lunar"
          checked={settings.showLunar}
          onCheckedChange={(checked) => patch({ showLunar: checked })}
        />
        <span>显示农历与节日名</span>
      </label>
      <label className="field" style={{ gridTemplateColumns: "auto 1fr", alignItems: "center" }}>
        <AppSwitch
          name="show-week-numbers"
          checked={settings.showWeekNumbers}
          onCheckedChange={(checked) => patch({ showWeekNumbers: checked })}
        />
        <span>周一格显示周序号</span>
      </label>
      <label className="field" style={{ gridTemplateColumns: "auto 1fr", alignItems: "center" }}>
        <AppSwitch
          name="show-holidays"
          checked={settings.showHolidays}
          onCheckedChange={(checked) => patch({ showHolidays: checked })}
        />
        <span>显示节假日班休</span>
      </label>
      <label className="field" style={{ gridTemplateColumns: "auto 1fr", alignItems: "center" }}>
        <AppSwitch
          name="show-habits"
          checked={settings.showHabits}
          onCheckedChange={(checked) => patch({ showHabits: checked })}
        />
        <span>日历和今天叠习惯（只读）</span>
      </label>
      <label className="field">
        <span>CSV 导入</span>
        <input
          type="file"
          accept=".csv,text/csv"
          aria-label="选择 CSV 文件"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (!file) return;
            void file.text().then(async (text) => {
              const result = await importCsv(text);
              setImportMsg(
                `导入 ${result.lists} 个项目、${result.tags} 个标签、${result.tasks} 条任务${
                  result.skipped ? `，跳过 ${result.skipped} 行` : ""
                }。`,
              );
            });
          }}
        />
      </label>
      <p className="group-label">
        CSV 列：title,list,start,due,status,tags,notes,completedAt,kind。list 也可写成「项目」。禁止 Cookie / 私有接口。
      </p>
      {importMsg ? <p className="group-label">{importMsg}</p> : null}
      <p className="group-label">
        数据存在这台电脑。关掉 Cortex 再打开，项目和下一步都还在。
      </p>
      <Button type="button" className="primary-btn" onClick={onClose}>
        完成
      </Button>
    </AppDialog>
  );
}

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const commands = [
    { href: "#/smart/today", label: "今天" },
    { href: "#/lists/inbox", label: "收集箱" },
    { href: "#/smart/next", label: "下一步" },
    { href: "#/calendar/month", label: "月历" },
    { href: "#/calendar/week", label: "周视图" },
    { href: "#/smart/summary", label: "摘要" },
    { href: "#/habits", label: "习惯" },
    { href: "#/search", label: "搜索标题" },
  ];
  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="指令"
      description="选一项即跳转。"
      className="overlay-card"
    >
      {commands.map((item) => (
        <a key={item.href} className="result" href={item.href} onClick={onClose}>
          {item.label}
        </a>
      ))}
    </AppDialog>
  );
}

export function useAppHotkeys({
  onNew,
  onSearch,
  onToday,
  onInbox,
  onMonth,
  onWeek,
  onEscape,
  onComplete,
  onCommand,
}: {
  onNew: () => void;
  onSearch: () => void;
  onToday: () => void;
  onInbox: () => void;
  onMonth: () => void;
  onWeek: () => void;
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
      if (event.key.toLowerCase() === "w") {
        event.preventDefault();
        onWeek();
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
  }, [chord, onCommand, onComplete, onEscape, onInbox, onMonth, onNew, onSearch, onToday, onWeek]);
}

export { isTypingTarget };
