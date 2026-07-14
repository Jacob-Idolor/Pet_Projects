import { describe, it, expect } from "vitest";
import { modules, getModulesByPhase } from "../../src/data/modules";
import { moduleMeta } from "../../src/data/learning-meta";
import { labs } from "../../src/data/lab-hub";
import { CORE_LAB_IDS } from "../../src/lib/certificate";
import { allTrackables } from "../../src/data/trackables";

describe("curriculum data integrity", () => {
  it("has 15 lessons in order 1–15", () => {
    expect(modules).toHaveLength(15);
    const orders = modules.map((m) => m.order).sort((a, b) => a - b);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  });

  it("uses unique lesson ids", () => {
    const ids = modules.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has meta for every lesson", () => {
    for (const mod of modules) {
      expect(moduleMeta[mod.id], `missing meta for ${mod.id}`).toBeDefined();
    }
  });

  it("quiz answers are in range", () => {
    for (const mod of modules) {
      for (const q of mod.quiz) {
        expect(q.correct).toBeGreaterThanOrEqual(0);
        expect(q.correct).toBeLessThan(q.options.length);
        expect(q.explain.length).toBeGreaterThan(10);
      }
    }
  });

  it("part 1 has 6 container lessons, part 2 has 9 k8s lessons", () => {
    expect(getModulesByPhase("containers")).toHaveLength(6);
    expect(getModulesByPhase("kubernetes")).toHaveLength(9);
  });

  it("core lab ids exist in hub", () => {
    const hubIds = new Set(labs.map((l) => l.id));
    for (const id of CORE_LAB_IDS) {
      expect(hubIds.has(id), `missing hub lab ${id}`).toBe(true);
    }
  });

  it("every lesson has a matching mod-* hub card", () => {
    const hubIds = new Set(labs.map((l) => l.id));
    for (const mod of modules) {
      expect(hubIds.has(`mod-${mod.id}`), `missing mod-${mod.id}`).toBe(true);
    }
  });

  it("trackables list is non-empty and ids are unique", () => {
    expect(allTrackables.length).toBeGreaterThan(30);
    const ids = allTrackables.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
