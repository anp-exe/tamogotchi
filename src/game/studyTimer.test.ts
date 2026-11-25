import { describe, expect, it } from "vitest";
import { INITIAL_STATE, type PetState } from "./petState";
import {
  DEFAULT_STUDY_DURATION_MS,
  DEMO_STUDY_DURATION_MS,
  STUDY_PRESETS,
  advanceStudyTimer,
  completeStudySession,
  createStudyTimer,
  formatStudyTimerDisplay,
  pauseStudyTimer,
  resetStudyTimer,
  resumeStudyTimer,
  startStudyTimer,
} from "./studyTimer";

const hatchedPet = (): PetState => ({
  ...INITIAL_STATE,
  petName: "Tama",
  mode: "study",
  curiosity: 20,
  evolution: "hatchling",
  hatched: true,
});

describe("study timer lifecycle", () => {
  it("starts with the standard 25-minute duration and supports a short demo", () => {
    expect(createStudyTimer().remainingMs).toBe(DEFAULT_STUDY_DURATION_MS);
    expect(createStudyTimer({ durationMs: DEMO_STUDY_DURATION_MS }).remainingMs).toBe(
      DEMO_STUDY_DURATION_MS,
    );
  });

  it("starts, pauses, resumes, and resets without counting paused time", () => {
    const ready = createStudyTimer({ durationMs: 1_000 });
    const started = startStudyTimer(ready, 1_000);
    const paused = pauseStudyTimer(started, 1_400);
    const resumed = resumeStudyTimer(paused, 9_000);
    const progressed = advanceStudyTimer(resumed, 9_600);

    expect(paused).toMatchObject({ status: "paused", remainingMs: 600 });
    expect(resumed).toMatchObject({ status: "running", remainingMs: 600 });
    expect(progressed).toMatchObject({ status: "completed", remainingMs: 0 });
    expect(resetStudyTimer(progressed)).toMatchObject({
      status: "ready",
      remainingMs: 1_000,
      rewarded: false,
    });
  });

  it("calculates elapsed time from timestamps after an inactive tab", () => {
    const started = startStudyTimer(createStudyTimer({ durationMs: 1_000 }), 0);

    expect(advanceStudyTimer(started, 60_000)).toMatchObject({
      status: "completed",
      remainingMs: 0,
    });
  });
});

describe("study completion", () => {
  it("uses timestamp completion while preserving frontend rewards and hunger semantics", () => {
    const started = startStudyTimer(createStudyTimer({ durationMs: 1_000 }), 0);
    const result = completeStudySession(started, hatchedPet(), 60_000);

    expect(result.timer).toMatchObject({ status: "completed", remainingMs: 0, rewarded: true });
    expect(result.rewarded).toBe(true);
    expect(result.pet).toMatchObject({ curiosity: 35, happiness: 78, hunger: 30, evolution: "scholar" });
  });

  it("does not award twice when duplicate completion checks occur", () => {
    const first = completeStudySession(
      startStudyTimer(createStudyTimer({ durationMs: 1_000 }), 0),
      hatchedPet(),
      1_000,
    );
    const repeated = completeStudySession(first.timer, first.pet, 2_000);

    expect(repeated.rewarded).toBe(false);
    expect(repeated.pet).toEqual(first.pet);
  });

  it("restarts each selected duration in milliseconds with the correct display", () => {
    const expectedDisplays = ["00:10", "01:00", "05:00", "25:00"];

    STUDY_PRESETS.forEach((preset, index) => {
      const completed = {
        ...createStudyTimer({ durationMs: preset.durationMs }),
        status: "completed" as const,
        remainingMs: 0,
      };
      const restarted = resetStudyTimer(completed);

      expect(restarted.durationMs).toBe(preset.durationMs);
      expect(restarted.remainingMs).toBe(preset.durationMs);
      expect(formatStudyTimerDisplay(restarted.remainingMs)).toBe(expectedDisplays[index]);
    });
  });
});
