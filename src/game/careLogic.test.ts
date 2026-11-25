import { describe, expect, it } from "vitest";
import { applyCareAction, canRevive, isNeglected, revivePet } from "./careLogic";
import { INITIAL_STATE, type PetState } from "./petState";

const pet = (over: Partial<PetState> = {}): PetState => ({ ...INITIAL_STATE, hatched: true, evolution: "hatchling", ...over });

describe("death and revival", () => {
  it("dies only when starving and completely miserable", () => {
    expect(isNeglected(pet({ hunger: 100, happiness: 0 }))).toBe(true);
    expect(isNeglected(pet({ hunger: 100, happiness: 10 }))).toBe(false);
    expect(isNeglected(pet({ hunger: 90, happiness: 0 }))).toBe(false);
  });

  it("dies after six hours of untreated sickness", () => {
    expect(isNeglected(pet({ sick: true, sickFor: 11 }))).toBe(false);
    expect(isNeglected(pet({ sick: true, sickFor: 12 }))).toBe(true);
  });

  it("cleans up poop and cures sickness with medicine", () => {
    expect(applyCareAction(pet({ poops: 2, poopAge: 2 }), "clean")).toMatchObject({ poops: 0, poopAge: 0 });
    expect(applyCareAction(pet({ sick: true, sickFor: 4 }), "medicine")).toMatchObject({ sick: false, sickFor: 0 });
    // Medicine it didn't need just makes it grumpy.
    expect(applyCareAction(pet({ happiness: 50 }), "medicine").happiness).toBe(44);
  });

  it("ignores care once it is a ghost", () => {
    const ghost = pet({ hunger: 100, happiness: 0, dead: true });
    expect(applyCareAction(ghost, "feed")).toBe(ghost);
  });

  it("can be revived exactly once", () => {
    const ghost = pet({ hunger: 100, happiness: 0, dead: true });
    expect(canRevive(ghost)).toBe(true);
    const back = revivePet(ghost, 1000);
    expect(back).toMatchObject({ dead: false, revived: true, hunger: 40, happiness: 50, livedUntil: 1000 });

    const again = { ...back, dead: true };
    expect(canRevive(again)).toBe(false);
    expect(revivePet(again)).toBe(again);
  });
});
