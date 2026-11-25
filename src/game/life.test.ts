import { describe, expect, it } from "vitest";
import { DEMO_SPEED, STEP_MS, liveUntil, projectedDeath } from "./life";
import { INITIAL_STATE, type PetState } from "./petState";

const HOUR = 60 * 60_000;
// 08:00 local time, so the first 14 hours are all daytime.
const MORNING = new Date(2026, 10, 25, 8, 0).getTime();

const fresh = (over: Partial<PetState> = {}): PetState => ({
  ...INITIAL_STATE,
  hatched: true,
  evolution: "hatchling",
  hunger: 30,
  energy: 80,
  happiness: 70,
  livedUntil: MORNING,
  bornAt: MORNING - 2 * HOUR, // past the baby stage, so it poops every three hours
  ...over,
});

describe("real-time life", () => {
  it("does nothing until half an hour has passed", () => {
    const pet = fresh();
    expect(liveUntil(pet, MORNING + STEP_MS - 1)).toBe(pet);
  });

  it("gets hungrier and sadder during the day, and poops every three hours", () => {
    const later = liveUntil(fresh(), MORNING + 4 * HOUR);
    expect(later.hunger).toBe(54);
    expect(later.poops).toBe(1);
    // -2 an hour, and the poop on screen makes it a little sadder.
    expect(later.happiness).toBe(52);
    expect(later.dead).toBe(false);
  });

  it("gets sick when the poop is left for an hour and a half", () => {
    expect(liveUntil(fresh(), MORNING + 4 * HOUR).sick).toBe(false);
    expect(liveUntil(fresh(), MORNING + 5 * HOUR).sick).toBe(true);
  });

  it("dies within about twelve waking hours with no care at all", () => {
    expect(liveUntil(fresh(), MORNING + 8 * HOUR).dead).toBe(false);
    const gone = liveUntil(fresh(), MORNING + 13 * HOUR);
    expect(gone.dead).toBe(true);
    expect(gone.diedAt).toBeGreaterThan(MORNING + 8 * HOUR);
  });

  it("survives the day when the poop is cleaned up and it's fed", () => {
    let pet = fresh();
    for (let h = 1; h <= 12; h++) {
      pet = liveUntil(pet, MORNING + h * HOUR);
      pet = { ...pet, poops: 0, poopAge: 0, hunger: Math.max(0, pet.hunger - 6), happiness: Math.min(100, pet.happiness + 4) };
    }
    expect(pet.dead).toBe(false);
    expect(pet.sick).toBe(false);
  });

  it("barely changes while asleep at night", () => {
    const night = new Date(2026, 10, 25, 23, 0).getTime();
    const morning = liveUntil(fresh({ livedUntil: night }), night + 7 * HOUR);
    expect(morning.hunger).toBe(44);
    expect(morning.happiness).toBe(70);
  });

  it("predicts when it would die if left alone", () => {
    const at = projectedDeath(fresh(), MORNING);
    expect(at).not.toBeNull();
    expect(at!).toBe(liveUntil(fresh(), MORNING + 24 * HOUR).diedAt);
  });

  it("runs sixty times faster in demo mode", () => {
    const pet = fresh({ bornAt: MORNING - 10 * HOUR });
    expect(liveUntil(pet, MORNING + (4 * HOUR) / DEMO_SPEED, true).hunger).toBe(54);
  });
});
