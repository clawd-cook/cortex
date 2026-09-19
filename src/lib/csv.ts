import { hydrateTask, type List, type Tag, type Task, type TaskKind, type TaskStatus } from "../types";
import { normalizeIsoDate } from "./dates";
import { normalizeHm } from "./times";

export type CsvRow = {
  title: string;
  listName: string | null;
  startDate: string | null;
  dueDate: string | null;
  status: TaskStatus;
  tagNames: string[];
  notes: string;
  completedAt: string | null;
  kind: TaskKind;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  priority: Task["priority"];
};

export type ParsedCsv = {
  rows: CsvRow[];
  skipped: number;
};

const HEADER_ALIASES: Record<string, string> = {
  title: "title",
  标题: "title",
  list: "list",
  清单: "list",
  start: "start",
  开始: "start",
  due: "due",
  到期: "due",
  status: "status",
  状态: "status",
  tags: "tags",
  标签: "tags",
  notes: "notes",
  备注: "notes",
  completedat: "completedAt",
  完成时间: "completedAt",
  kind: "kind",
  类型: "kind",
  starttime: "startTime",
  开始时间: "startTime",
  endtime: "endTime",
  结束时间: "endTime",
  allday: "allDay",
  全天: "allDay",
  priority: "priority",
  优先级: "priority",
};

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function parseStatus(value: string): TaskStatus {
  const raw = value.trim().toLowerCase();
  if (raw === "completed" || raw === "done" || raw === "已完成") return "completed";
  if (raw === "abandoned" || raw === "已放弃") return "abandoned";
  if (raw === "trash" || raw === "垃圾桶") return "trash";
  return "open";
}

function parseKind(value: string): TaskKind {
  const raw = value.trim().toLowerCase();
  return raw === "habit" || raw === "习惯" ? "habit" : "task";
}

function parseBool(value: string, fallback: boolean): boolean {
  const raw = value.trim().toLowerCase();
  if (!raw) return fallback;
  return raw === "1" || raw === "true" || raw === "yes" || raw === "全天";
}

function parsePriority(value: string): Task["priority"] {
  const n = Number(value.trim());
  if (n === 1 || n === 2 || n === 3) return n;
  return 0;
}

export function parseCortexCsv(text: string): ParsedCsv {
  const source = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = source.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { rows: [], skipped: 0 };

  const headerCells = parseCsvLine(lines[0]).map((cell) => HEADER_ALIASES[cell.toLowerCase()] ?? cell);
  const index = (name: string) => headerCells.indexOf(name);
  const titleIdx = index("title");
  if (titleIdx < 0) return { rows: [], skipped: lines.length };

  const rows: CsvRow[] = [];
  let skipped = 0;
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    const title = (cells[titleIdx] ?? "").trim();
    if (!title) {
      skipped += 1;
      continue;
    }
    const startDate = normalizeIsoDate(cells[index("start")] ?? "");
    const dueDate = normalizeIsoDate(cells[index("due")] ?? "");
    const startTime = normalizeHm(cells[index("startTime")] ?? "");
    const endTime = normalizeHm(cells[index("endTime")] ?? "");
    rows.push({
      title,
      listName: (cells[index("list")] ?? "").trim() || null,
      startDate,
      dueDate,
      status: parseStatus(cells[index("status")] ?? ""),
      tagNames: (cells[index("tags")] ?? "")
        .split(/[,;|]/)
        .map((name) => name.trim())
        .filter(Boolean),
      notes: cells[index("notes")] ?? "",
      completedAt: (cells[index("completedAt")] ?? "").trim() || null,
      kind: parseKind(cells[index("kind")] ?? ""),
      startTime,
      endTime,
      allDay: parseBool(cells[index("allDay")] ?? "", !startTime),
      priority: parsePriority(cells[index("priority")] ?? ""),
    });
  }
  return { rows, skipped };
}

export type ImportPlan = {
  lists: List[];
  tags: Tag[];
  tasks: Task[];
};

export function planCsvImport(
  parsed: ParsedCsv,
  existing: { lists: List[]; tags: Tag[]; tasks: Task[] },
  now: string,
  ids: { list: () => string; tag: () => string; task: () => string },
  colors: { list: readonly string[]; tag: readonly string[] },
): ImportPlan {
  const listByName = new Map(existing.lists.map((list) => [list.name, list]));
  const tagByName = new Map(existing.tags.map((tag) => [tag.name, tag]));
  const lists: List[] = [];
  const tags: Tag[] = [];
  const tasks: Task[] = [];

  for (const row of parsed.rows) {
    let listId: string | null = null;
    if (row.listName) {
      let list = listByName.get(row.listName);
      if (!list) {
        list = {
          id: ids.list(),
          name: row.listName,
          emoji: "📦",
          color: colors.list[(existing.lists.length + lists.length) % colors.list.length],
          sortOrder: existing.lists.length + lists.length,
          createdAt: now,
          updatedAt: now,
        };
        listByName.set(list.name, list);
        lists.push(list);
      }
      listId = list.id;
    }
    const tagIds: string[] = [];
    for (const name of row.tagNames) {
      let tag = tagByName.get(name);
      if (!tag) {
        tag = {
          id: ids.tag(),
          name,
          color: colors.tag[(existing.tags.length + tags.length) % colors.tag.length],
          createdAt: now,
        };
        tagByName.set(name, tag);
        tags.push(tag);
      }
      tagIds.push(tag.id);
    }
    tasks.push(
      hydrateTask({
        id: ids.task(),
        title: row.title,
        listId,
        startDate: row.startDate ?? row.dueDate,
        dueDate: row.dueDate ?? row.startDate,
        allDay: row.allDay,
        startTime: row.startTime,
        endTime: row.endTime,
        kind: row.kind,
        status: row.status,
        notes: row.notes,
        completedAt:
          row.status === "completed" ? row.completedAt ?? now : row.completedAt,
        tagIds,
        priority: row.priority,
        sortOrder: existing.tasks.length + tasks.length,
        createdAt: now,
        updatedAt: now,
      }),
    );
  }

  return { lists, tags, tasks };
}
