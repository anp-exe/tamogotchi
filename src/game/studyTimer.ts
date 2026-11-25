import { applyDelta } from "./careLogic";
import type { PetState } from "./petState";

export const DEFAULT_STUDY_DURATION_MS = 25 * 60 * 1_000;
export const DEMO_STUDY_DURATION_MS = 10 * 1_000;

export type StudyTimerStatus = "ready" | "running" | "paused" | "completed";

export type StudyTimer = {
  durationMs: number;
  remainingMs: number;
  status: StudyTimerStatus;
  /** Epoch timestamp for the current running segment; null while paused or finished. */
  startedAt: number | null;
  /** Guards the pet-state reward after completion. */
  rewarded: boolean;
};

export type StudyTimerOptions = {
  durationMs?: number;
};

function normaliseDuration(durationMs: number | undefined): number {
  if (typeof durationMs !== "number" || !Number.isFinite(durationMs) || durationMs <= 0) {
    return DEFAULT_STUDY_DURATION_MS;
  }

  return Math.floor(durationMs);
}

export function createStudyTimer(options: StudyTimerOptions = {}): StudyTimer {
  const durationMs = normaliseDuration(options.durationMs);
  return { durationMs, remainingMs: durationMs, status: "ready", startedAt: null, rewarded: false };
}

export function startStudyTimer(timer: StudyTimer, now = Date.now()): StudyTimer {
  if (timer.status !== "ready") return timer;
  return { ...timer, status: "running", startedAt: now };
}

/**
 * Updates remaining time from a wall-clock timestamp rather than interval ticks.
 * The caller can run this after interval callbacks or a visibility change.
 */
export function advanceStudyTimer(timer: StudyTimer, now = Date.now()): StudyTimer {
  if (timer.status !== "running" || timer.startedAt === null) return timer;

  const elapsedMs = Math.max(0, now - timer.startedAt);
  const remainingMs = Math.max(0, timer.remainingMs - elapsedMs);
  if (remainingMs === 0) {
    return { ...timer, remainingMs: 0, status: "completed", startedAt: null };
  }

  return { ...timer, remainingMs, startedAt: now };
}

export function pauseStudyTimer(timer: StudyTimer, now = Date.now()): StudyTimer {
  const advanced = advanceStudyTimer(timer, now);
  if (advanced.status !== "running") return advanced;
  return { ...advanced, status: "paused", startedAt: null };
}

export function resumeStudyTimer(timer: StudyTimer, now = Date.now()): StudyTimer {
  if (timer.status !== "paused") return timer;
  return { ...timer, status: "running", startedAt: now };
}

export function resetStudyTimer(timer: StudyTimer): StudyTimer {
  return createStudyTimer({ durationMs: timer.durationMs });
}

export const STUDY_PRESETS = [
  { label: "10s demo", durationMs: 10 * 1_000 },
  { label: "1 min", durationMs: 60 * 1_000 },
  { label: "5 min", durationMs: 5 * 60 * 1_000 },
  { label: "25 min", durationMs: 25 * 60 * 1_000 },
] as const;

export function formatStudyTimerDisplay(remainingMs: number): string {
  const totalSeconds = Math.ceil(remainingMs / 1_000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

/** Advances the timer and grants the study reward exactly once, on completion. */
export function completeStudySession(
  timer: StudyTimer,
  pet: PetState,
  now = Date.now(),
): { timer: StudyTimer; pet: PetState; rewarded: boolean } {
  const advancedTimer = advanceStudyTimer(timer, now);
  if (advancedTimer.status !== "completed" || advancedTimer.rewarded) {
    return { timer: advancedTimer, pet, rewarded: false };
  }

  return {
    timer: { ...advancedTimer, rewarded: true },
    pet: applyDelta(pet, { curiosity: +15, happiness: +8 }),
    rewarded: true,
  };
}
