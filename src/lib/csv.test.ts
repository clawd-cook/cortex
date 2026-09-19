import { describe, expect, it } from "vitest";
import { parseCortexCsv, planCsvImport } from "./csv";
import { LIST_COLORS, TAG_COLORS } from "../types";

describe("csv import", () => {
  it("imports lists, dates, status and quoted titles", () => {
    const parsed = parseCortexCsv(
      "title,list,start,due,status,tags,notes,kind\n" +
        '"需求, 一期",项目清单,2026-09-19,2026-09-21,completed,"技术改造,紧急",hello,task\n' +
        ",,,,,\n" +
        "喝水,,,,open,,,habit\n",
    );
    expect(parsed.skipped).toBe(1);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0]).toMatchObject({
      title: "需求, 一期",
      listName: "项目清单",
      startDate: "2026-09-19",
      dueDate: "2026-09-21",
      status: "completed",
      tagNames: ["技术改造", "紧急"],
      kind: "task",
    });
    expect(parsed.rows[1].kind).toBe("habit");

    let n = 0;
    const plan = planCsvImport(
      parsed,
      { lists: [], tags: [], tasks: [] },
      "t",
      {
        list: () => `l${(n += 1)}`,
        tag: () => `g${(n += 1)}`,
        task: () => `t${(n += 1)}`,
      },
      { list: LIST_COLORS, tag: TAG_COLORS },
    );
    expect(plan.lists.map((list) => list.name)).toEqual(["项目清单"]);
    expect(plan.tags.map((tag) => tag.name)).toEqual(["技术改造", "紧急"]);
    expect(plan.tasks[0].status).toBe("completed");
    expect(plan.tasks[0].listId).toBe(plan.lists[0].id);
    expect(plan.tasks[1].kind).toBe("habit");
  });
});
