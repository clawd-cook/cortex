export type TimedEvent = {
  id: string;
  startMin: number;
  endMin: number;
};

export type TimedPlacement = {
  taskId: string;
  startMin: number;
  endMin: number;
  col: number;
  cols: number;
};

export function layoutTimedEvents(events: TimedEvent[]): TimedPlacement[] {
  const sorted = events.slice().sort((a, b) => {
    if (a.startMin !== b.startMin) return a.startMin - b.startMin;
    return a.endMin - b.endMin;
  });
  const colEnd: number[] = [];
  const assigned: { event: TimedEvent; col: number }[] = [];
  for (const event of sorted) {
    let col = 0;
    while (col < colEnd.length && colEnd[col] > event.startMin) col += 1;
    if (col === colEnd.length) colEnd.push(event.endMin);
    else colEnd[col] = event.endMin;
    assigned.push({ event, col });
  }
  const cols = Math.max(1, colEnd.length);
  return assigned.map(({ event, col }) => ({
    taskId: event.id,
    startMin: event.startMin,
    endMin: Math.max(event.endMin, event.startMin + 30),
    col,
    cols,
  }));
}

export function isTimedTask(task: {
  allDay: boolean;
  startTime: string | null;
  startDate: string | null;
  dueDate: string | null;
}): boolean {
  if (task.allDay) return false;
  if (!task.startTime) return false;
  const start = task.startDate ?? task.dueDate;
  const end = task.dueDate ?? task.startDate;
  if (!start || !end) return false;
  return start === end;
}
