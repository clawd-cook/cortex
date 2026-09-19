export function createId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
