import { Button } from "@base-ui/react/button";
import { Toolbar } from "@base-ui/react/toolbar";
import { addWeeks, startOfWeek } from "date-fns";
import { useState } from "react";
import { weekDays, weekRangeLabel } from "../lib/dates";
import { formatWeekSummary, weekSummary } from "../lib/summary";
import { useCortex } from "../state/store";
import { AppScrollArea } from "./ui";

export function SummaryPane({
  weekDate,
  onWeekDate,
}: {
  weekDate: Date;
  onWeekDate: (date: Date) => void;
}) {
  const cortex = useCortex();
  const [copied, setCopied] = useState(false);
  const days = weekDays(weekDate, cortex.settings.weekStartsOn);
  const summary = weekSummary(cortex.tasks, days[0], days[days.length - 1]);
  const text = formatWeekSummary(summary);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="main" aria-labelledby="view-title">
      <div className="main-head">
        <div>
          <h1 id="view-title">摘要</h1>
          <p>按完成时间和到期日生成本周已完成 / 未完成，可复制。不做 AI 润色。</p>
        </div>
        <Toolbar.Root className="toolbar" aria-label="摘要周次">
          <Toolbar.Button className="icon-btn" aria-label="上一周" onClick={() => onWeekDate(addWeeks(weekDate, -1))}>
            ‹
          </Toolbar.Button>
          <strong>{weekRangeLabel(days)}</strong>
          <Toolbar.Button className="icon-btn" aria-label="下一周" onClick={() => onWeekDate(addWeeks(weekDate, 1))}>
            ›
          </Toolbar.Button>
          <Toolbar.Button
            className="ghost-btn"
            onClick={() => onWeekDate(startOfWeek(new Date(), { weekStartsOn: cortex.settings.weekStartsOn }))}
          >
            本周
          </Toolbar.Button>
          <Button type="button" className="primary-btn" onClick={() => void copy()}>
            {copied ? "已复制" : "复制摘要"}
          </Button>
        </Toolbar.Root>
      </div>
      <AppScrollArea className="task-scroll">
        <pre className="summary-text">{text}</pre>
        <div className="summary-groups">
          <section>
            <h2>已完成 · {summary.completed.length}</h2>
            {summary.completed.length === 0 ? (
              <p className="group-label">这周还没有完成记录。</p>
            ) : (
              <ul>
                {summary.completed.map((task) => (
                  <li key={task.id}>{task.title}</li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2>未完成 · {summary.incomplete.length}</h2>
            {summary.incomplete.length === 0 ? (
              <p className="group-label">这周到期或跨天的开放任务都做完了。</p>
            ) : (
              <ul>
                {summary.incomplete.map((task) => (
                  <li key={task.id}>{task.title}</li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </AppScrollArea>
    </section>
  );
}
