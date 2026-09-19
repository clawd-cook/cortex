export function CalendarViewToggle({
  view,
  month,
  week,
}: {
  view: "month" | "week";
  month: string;
  week: string;
}) {
  return (
    <div className="view-toggle" role="group" aria-label="日历视图">
      <a
        className={view === "month" ? "is-on" : undefined}
        href={`#/calendar/month?month=${month}`}
        aria-current={view === "month" ? "page" : undefined}
      >
        月
      </a>
      <a
        className={view === "week" ? "is-on" : undefined}
        href={`#/calendar/week?week=${week}`}
        aria-current={view === "week" ? "page" : undefined}
      >
        周
      </a>
    </div>
  );
}
