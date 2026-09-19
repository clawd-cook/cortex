import { Dialog } from "@base-ui/react/dialog";
import { format, startOfMonth } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { CalendarMonth } from "./components/CalendarMonth";
import { CommandPalette, SearchOverlay, SettingsDialog, useAppHotkeys } from "./components/Overlays";
import { AppFrame } from "./components/Shell";
import { TaskDetail, TaskPane } from "./components/TaskPane";
import { addIsoDays, todayIso } from "./lib/dates";
import { selectedTaskId, withTask, type Route } from "./lib/route";
import { useHashRoute } from "./lib/useHashRoute";
import { CortexProvider, useCortex } from "./state/store";
import type { Draft } from "./types";

function monthFromRoute(route: Route, fallback: Date): Date {
  if (route.name === "calendar" && route.month) {
    const [year, month] = route.month.split("-").map(Number);
    if (year && month) return new Date(year, month - 1, 1);
  }
  return startOfMonth(fallback);
}

function CortexApp() {
  const cortex = useCortex();
  const [route, navigate] = useHashRoute();
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    if (route.name === "calendar") {
      setMonthDate(monthFromRoute(route, monthDate));
    }
    if (route.name === "search") {
      setSearchOpen(true);
      setSearchQuery(route.q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only sync when the hash route changes
  }, [route]);

  const commitDraft = useCallback(async () => {
    if (!draft || !draft.title.trim()) {
      setDraft(null);
      return;
    }
    const created = await cortex.createTask({
      title: draft.title,
      listId: draft.listId,
      startDate: draft.startDate,
      dueDate: draft.dueDate,
      tagIds: draft.tagIds,
    });
    setDraft(null);
    if (created) navigate(withTask(route, created.id));
  }, [cortex, draft, navigate, route]);

  const startComposer = useCallback(() => {
    const today = todayIso();
    const tomorrow = addIsoDays(today, 1);
    if (route.name === "calendar") {
      setDraft({
        title: "",
        listId: null,
        startDate: today,
        dueDate: today,
        tagIds: [],
        source: "toolbar",
        anchorDate: today,
      });
      return;
    }
    setDraft({
      title: "",
      listId: route.name === "list" ? route.listId : null,
      startDate: route.name === "today" ? today : route.name === "tomorrow" ? tomorrow : null,
      dueDate: route.name === "today" ? today : route.name === "tomorrow" ? tomorrow : null,
      tagIds: route.name === "tag" ? [route.tagId] : [],
      source: "list",
    });
    window.setTimeout(() => {
      document.querySelector<HTMLInputElement>('input[name="new-task"]')?.focus();
    }, 0);
  }, [route]);

  const completeSelected = useCallback(() => {
    const id = selectedTaskId(route);
    const task = cortex.tasks.find((item) => item.id === id);
    if (!task) return;
    void cortex.setTaskStatus(task, task.status === "completed" ? "open" : "completed");
  }, [cortex, route]);

  useAppHotkeys({
    onNew: startComposer,
    onSearch: () => {
      setSearchOpen(true);
      navigate({ name: "search", q: searchQuery });
    },
    onToday: () => navigate({ name: "today" }),
    onInbox: () => navigate({ name: "inbox" }),
    onMonth: () => navigate({ name: "calendar", month: format(monthDate, "yyyy-MM") }),
    onEscape: () => {
      setDraft(null);
      setSearchOpen(false);
      setSettingsOpen(false);
      setCommandOpen(false);
    },
    onComplete: completeSelected,
    onCommand: () => setCommandOpen(true),
  });

  const onMonthDate = (date: Date) => {
    setMonthDate(date);
    if (route.name === "calendar") {
      navigate({
        name: "calendar",
        month: format(date, "yyyy-MM"),
        taskId: route.taskId,
      });
    }
  };

  if (!cortex.ready) {
    return <div className="app-boot">正在读取本地数据…</div>;
  }
  if (cortex.error) {
    return <div className="app-boot app-error">{cortex.error}</div>;
  }

  return (
    <>
      <a className="skip-link" href="#main-view">
        跳到主内容
      </a>
      <AppFrame
        route={route}
        monthDate={monthDate}
        onMonthDate={onMonthDate}
        onOpenSettings={() => setSettingsOpen(true)}
      >
        <div id="main-view" style={{ display: "contents" }}>
          {route.name === "calendar" ? (
            <CalendarMonth
              monthDate={monthDate}
              onMonthDate={onMonthDate}
              draft={draft?.source === "cell" || draft?.source === "toolbar" ? draft : null}
              selectedTaskId={route.taskId}
              onSelectTask={(taskId) =>
                navigate({
                  name: "calendar",
                  month: format(monthDate, "yyyy-MM"),
                  taskId,
                })
              }
              onDraft={setDraft}
              onCommitDraft={commitDraft}
            />
          ) : (
            <TaskPane
              route={route}
              draft={draft}
              onDraft={setDraft}
              onNavigate={navigate}
              onCommitDraft={commitDraft}
            />
          )}
        </div>
      </AppFrame>
      {route.name === "calendar" && route.taskId ? (
        <Dialog.Root
          open
          onOpenChange={(open) => {
            if (!open) {
              navigate({ name: "calendar", month: format(monthDate, "yyyy-MM") });
            }
          }}
        >
          <Dialog.Portal>
            <Dialog.Backdrop className="overlay" />
            <Dialog.Popup className="dialog-card" style={{ width: "min(380px, calc(100% - 32px))", maxHeight: "80vh", overflow: "auto" }}>
              <Dialog.Title className="live">任务详情</Dialog.Title>
              <TaskDetail
                task={cortex.tasks.find((task) => task.id === route.taskId) ?? null}
                onClose={() =>
                  navigate({ name: "calendar", month: format(monthDate, "yyyy-MM") })
                }
              />
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ) : null}
      <SearchOverlay
        open={searchOpen}
        query={searchQuery}
        onQuery={(value) => {
          setSearchQuery(value);
          navigate({ name: "search", q: value });
        }}
        onClose={() => {
          setSearchOpen(false);
          if (route.name === "search") navigate({ name: "today" });
        }}
      />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
      <div className="live" aria-live="polite">
        {draft ? "正在创建任务，Esc 取消。" : ""}
      </div>
    </>
  );
}

export default function App() {
  return (
    <CortexProvider>
      <CortexApp />
    </CortexProvider>
  );
}
