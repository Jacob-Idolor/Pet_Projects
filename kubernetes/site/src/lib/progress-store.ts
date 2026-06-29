/** Personal progress — localStorage only, no login */

import { modules } from "../data/modules";

export const PROGRESS_KEY = "k8s-lab-progress-v1";

export interface CompletionRecord {
  completedAt: string;
  note?: string;
}

export interface ProgressData {
  version: 1;
  completed: Record<string, CompletionRecord>;
  streak: number;
  lastPracticeDay: string | null;
  totalSessions: number;
}

export function emptyProgress(): ProgressData {
  return {
    version: 1,
    completed: {},
    streak: 0,
    lastPracticeDay: null,
    totalSessions: 0,
  };
}

export function loadProgress(): ProgressData {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as ProgressData;
    if (parsed.version !== 1) return emptyProgress();
    return { ...emptyProgress(), ...parsed, completed: parsed.completed ?? {} };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(data: ProgressData): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Call when user marks something complete or opens progress page */
export function touchPracticeSession(data: ProgressData): ProgressData {
  const today = todayStr();
  const yesterday = yesterdayStr();
  let streak = data.streak;

  if (data.lastPracticeDay === today) {
    // same day — no streak change
  } else if (data.lastPracticeDay === yesterday) {
    streak += 1;
  } else {
    streak = 1;
  }

  return {
    ...data,
    streak,
    lastPracticeDay: today,
    totalSessions: data.totalSessions + (data.lastPracticeDay === today ? 0 : 1),
  };
}

export function isComplete(data: ProgressData, id: string): boolean {
  return Boolean(data.completed[id]);
}

export function setComplete(data: ProgressData, id: string, done: boolean, note?: string): ProgressData {
  const next = { ...data, completed: { ...data.completed } };
  if (done) {
    next.completed[id] = {
      completedAt: new Date().toISOString(),
      note: note ?? next.completed[id]?.note,
    };
    return touchPracticeSession(next);
  }
  delete next.completed[id];
  return next;
}

export function setNote(data: ProgressData, id: string, note: string): ProgressData {
  if (!data.completed[id]) return data;
  return {
    ...data,
    completed: {
      ...data.completed,
      [id]: { ...data.completed[id], note },
    },
  };
}

export function exportProgress(data: ProgressData): string {
  return JSON.stringify(data, null, 2);
}

export function importProgress(json: string): ProgressData {
  const parsed = JSON.parse(json) as ProgressData;
  if (parsed.version !== 1) throw new Error("Unsupported progress file version");
  return parsed;
}

/** Sync simulator / quiz auto-completions into progress */
export function syncAutoCompletions(data: ProgressData): ProgressData {
  const next = { ...data, completed: { ...data.completed } };
  let changed = false;

  for (const mod of modules) {
    const labId = `mod-${mod.id}`;
    if (localStorage.getItem(`k8s-quiz-${mod.id}`) === "passed" && !next.completed[labId]) {
      next.completed[labId] = { completedAt: new Date().toISOString(), note: "Auto: quiz passed" };
      changed = true;
    }
  }

  const allQuizzesPassed = modules.every((m) => localStorage.getItem(`k8s-quiz-${m.id}`) === "passed");
  if (allQuizzesPassed && !next.completed["extra-quiz-all"]) {
    next.completed["extra-quiz-all"] = { completedAt: new Date().toISOString(), note: "Auto: all quizzes passed" };
    changed = true;
  }

  const dockerMissions = JSON.parse(localStorage.getItem("docker-missions") || "[]") as string[];
  if (dockerMissions.length >= 6 && !next.completed["extra-docker-missions"]) {
    next.completed["extra-docker-missions"] = { completedAt: new Date().toISOString(), note: "Auto: all simulator missions" };
    changed = true;
  }

  const k8sMissions = JSON.parse(localStorage.getItem("k8s-missions") || "[]") as string[];
  if (k8sMissions.length >= 4 && !next.completed["extra-kubectl-missions"]) {
    next.completed["extra-kubectl-missions"] = { completedAt: new Date().toISOString(), note: "Auto: all simulator missions" };
    changed = true;
  }

  return changed ? next : data;
}

export function countByDifficulty(
  items: { id: string; difficulty?: string }[],
  data: ProgressData
): Record<string, { done: number; total: number }> {
  const buckets: Record<string, { done: number; total: number }> = {
    beginner: { done: 0, total: 0 },
    intermediate: { done: 0, total: 0 },
    advanced: { done: 0, total: 0 },
  };
  for (const item of items) {
    const diff = item.difficulty ?? "beginner";
    if (!buckets[diff]) buckets[diff] = { done: 0, total: 0 };
    buckets[diff].total++;
    if (isComplete(data, item.id)) buckets[diff].done++;
  }
  return buckets;
}

export function countByCategory(
  items: { id: string; category: string }[],
  data: ProgressData
): Record<string, { done: number; total: number }> {
  const buckets: Record<string, { done: number; total: number }> = {};
  for (const item of items) {
    if (!buckets[item.category]) buckets[item.category] = { done: 0, total: 0 };
    buckets[item.category].total++;
    if (isComplete(data, item.id)) buckets[item.category].done++;
  }
  return buckets;
}
