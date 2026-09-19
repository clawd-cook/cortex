export function normalizeHm(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function hmToMinutes(value: string | null | undefined): number | null {
  const normalized = normalizeHm(value);
  if (!normalized) return null;
  const hour = Number(normalized.slice(0, 2));
  const minute = Number(normalized.slice(3));
  return hour * 60 + minute;
}

export function minutesToHm(total: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, total));
  const hour = Math.floor(clamped / 60);
  const minute = clamped % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function hourLabel(hour: number): string {
  if (hour === 12) return "正午";
  return `${String(hour).padStart(2, "0")}:00`;
}

export function eventMinutes(task: {
  startTime: string | null;
  endTime: string | null;
}): { startMin: number; endMin: number } | null {
  const startMin = hmToMinutes(task.startTime);
  if (startMin === null) return null;
  const explicitEnd = hmToMinutes(task.endTime);
  const endMin = explicitEnd !== null && explicitEnd > startMin ? explicitEnd : startMin + 60;
  return { startMin, endMin: Math.min(endMin, 24 * 60) };
}
