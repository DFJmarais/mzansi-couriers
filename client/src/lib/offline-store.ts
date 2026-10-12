export type OfflineAction = {
  id: string;
  createdAt: number;
  kind: string;
  payload: unknown;
};

const snapshotPrefix = "mzansi:offline:snapshot:";
const actionKey = "mzansi:offline:actions";

function storage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function readOfflineSnapshot<T>(key: string): T | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(`${snapshotPrefix}${key}`);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

export function writeOfflineSnapshot<T>(key: string, value: T): void {
  const store = storage();
  if (!store) return;
  try { store.setItem(`${snapshotPrefix}${key}`, JSON.stringify(value)); } catch { /* storage can be unavailable or full */ }
}

export function enqueueOfflineAction(kind: string, payload: unknown): OfflineAction {
  const action: OfflineAction = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, createdAt: Date.now(), kind, payload };
  const existing = readOfflineActions();
  const store = storage();
  if (store) {
    try { store.setItem(actionKey, JSON.stringify([...existing, action])); } catch { /* keep the visible offline state even if storage is full */ }
  }
  return action;
}

export function readOfflineActions(): OfflineAction[] {
  const store = storage();
  if (!store) return [];
  try {
    const raw = store.getItem(actionKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function removeOfflineAction(id: string): void {
  const store = storage();
  if (!store) return;
  try { store.setItem(actionKey, JSON.stringify(readOfflineActions().filter((action) => action.id !== id))); } catch { /* no-op */ }
}

export function clearOfflineActions(): void {
  storage()?.removeItem(actionKey);
}
