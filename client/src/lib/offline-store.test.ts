import { beforeEach, describe, expect, it } from "vitest";
import { enqueueOfflineAction, readOfflineActions, readOfflineSnapshot, writeOfflineSnapshot } from "./offline-store";

describe("offline store", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
    } } });
  });

  it("persists and reads a route snapshot", () => {
    writeOfflineSnapshot("route", { runId: 7, stops: 3 });
    expect(readOfflineSnapshot("route")).toEqual({ runId: 7, stops: 3 });
  });

  it("queues actions in creation order", () => {
    enqueueOfflineAction("start-route", { runId: 7 });
    enqueueOfflineAction("complete-with-photo", { stopId: 4 });
    expect(readOfflineActions().map((action) => action.kind)).toEqual(["start-route", "complete-with-photo"]);
  });
});
