export type Route =
  | { name: "inbox"; taskId?: string }
  | { name: "today"; taskId?: string }
  | { name: "tomorrow"; taskId?: string }
  | { name: "list"; listId: string; taskId?: string }
  | { name: "tag"; tagId: string; taskId?: string }
  | { name: "calendar"; month?: string; taskId?: string }
  | { name: "completed" }
  | { name: "abandoned" }
  | { name: "trash" }
  | { name: "search"; q: string };

function pathAndQuery(hash: string): { path: string; query: URLSearchParams } {
  const raw = hash.replace(/^#/, "");
  const trimmed = raw.startsWith("/") ? raw : `/${raw}`;
  const [path, search = ""] = trimmed.split("?");
  return { path: path.replace(/\/+$/, "") || "/", query: new URLSearchParams(search) };
}

export function parseHash(hash: string): Route {
  const { path, query } = pathAndQuery(hash);
  const parts = path.split("/").filter(Boolean);

  if (parts[0] === "calendar") {
    return {
      name: "calendar",
      month: query.get("month") ?? undefined,
      taskId: query.get("task") ?? undefined,
    };
  }
  if (parts[0] === "smart" && parts[1] === "today") {
    return { name: "today", taskId: parts[3] };
  }
  if (parts[0] === "smart" && parts[1] === "tomorrow") {
    return { name: "tomorrow", taskId: parts[3] };
  }
  if (parts[0] === "lists" && parts[1] === "inbox") {
    return { name: "inbox", taskId: parts[3] };
  }
  if (parts[0] === "lists" && parts[1]) {
    return { name: "list", listId: parts[1], taskId: parts[3] };
  }
  if (parts[0] === "tags" && parts[1]) {
    return { name: "tag", tagId: parts[1], taskId: parts[3] };
  }
  if (parts[0] === "completed") return { name: "completed" };
  if (parts[0] === "abandoned") return { name: "abandoned" };
  if (parts[0] === "trash") return { name: "trash" };
  if (parts[0] === "search") return { name: "search", q: query.get("q") ?? "" };
  return { name: "today" };
}

export function toHash(route: Route): string {
  switch (route.name) {
    case "inbox":
      return route.taskId
        ? `#/lists/inbox/tasks/${route.taskId}`
        : "#/lists/inbox";
    case "today":
      return route.taskId
        ? `#/smart/today/tasks/${route.taskId}`
        : "#/smart/today";
    case "tomorrow":
      return route.taskId
        ? `#/smart/tomorrow/tasks/${route.taskId}`
        : "#/smart/tomorrow";
    case "list":
      return route.taskId
        ? `#/lists/${route.listId}/tasks/${route.taskId}`
        : `#/lists/${route.listId}`;
    case "tag":
      return route.taskId
        ? `#/tags/${route.tagId}/tasks/${route.taskId}`
        : `#/tags/${route.tagId}`;
    case "calendar": {
      const params = new URLSearchParams();
      if (route.month) params.set("month", route.month);
      if (route.taskId) params.set("task", route.taskId);
      const q = params.toString();
      return q ? `#/calendar/month?${q}` : "#/calendar/month";
    }
    case "completed":
      return "#/completed";
    case "abandoned":
      return "#/abandoned";
    case "trash":
      return "#/trash";
    case "search": {
      const params = new URLSearchParams();
      if (route.q) params.set("q", route.q);
      const q = params.toString();
      return q ? `#/search?${q}` : "#/search";
    }
  }
}

export function withTask(route: Route, taskId?: string): Route {
  switch (route.name) {
    case "inbox":
    case "today":
    case "tomorrow":
    case "list":
    case "tag":
    case "calendar":
      return { ...route, taskId };
    default:
      return route;
  }
}

export function selectedTaskId(route: Route): string | undefined {
  switch (route.name) {
    case "inbox":
    case "today":
    case "tomorrow":
    case "list":
    case "tag":
    case "calendar":
      return route.taskId;
    default:
      return undefined;
  }
}
