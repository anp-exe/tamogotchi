/**
 * The pet lives on the real clock, even while the tab is closed.
 *
 * Life moves in half-hour steps. Awake, it gets hungrier, more tired and sadder (faster
 * once it's very hungry or exhausted); between 22:00 and 07:00 it sleeps and barely
 * changes. It poops every few hours; leave the poop and it gets sick, and a sick pet needs
 * medicine. Left with no care at all it dies after roughly 12 waking hours (about a day
 * with a night in between), or after 6 hours of untreated sickness. Demo mode runs the
 * same rules 60 times faster.
 */
import { applyDelta, isNeglected } from "./careLogic";
import { isNightTime } from "./clock";
import { lifeStage } from "./evolutionLogic";
import { loadPetState, type PetState } from "./petState";

export const STEP_MS = 30 * 60_000;
export const DEMO_SPEED = 60;
const MAX_STEPS = 14 * 48; // two weeks away settles its fate either way

/** Half an hour of life. Awake, it gets hungry, tired and sad, poops, and can fall ill. */
export function halfHour(state: PetState, asleep: boolean, demo = false, now = Date.now()): PetState {
  if (asleep) return applyDelta(state, { hunger: +1, energy: +6 }, demo, now);

  const mess = state.poops + (state.sick ? 3 : 0);
  let s = applyDelta(
    state,
    {
      hunger: +3,
      energy: state.sick ? -4 : -2,
      happiness: (state.hunger > 70 || state.energy < 25 ? -4 : -2) - mess,
    },
    demo,
    now,
  );

  // Poop: every 3 waking hours, every hour for a baby. Left for 1.5 h, it makes the pet sick.
  const every = lifeStage(state.bornAt, demo, now) === "baby" ? 2 : 6;
  let { poops, poopClock } = s;
  poopClock += 1;
  if (poopClock >= every) {
    poopClock = 0;
    poops = Math.min(3, poops + 1);
  }
  const poopAge = state.poops > 0 ? s.poopAge + 1 : 0;
  const sick = s.sick || poopAge >= 3;

  // A care mistake is letting hunger or happiness run all the way out.
  const ranOut = (s.hunger >= 100 && state.hunger < 100) || (s.happiness <= 0 && state.happiness > 0);

  s = {
    ...s,
    poops,
    poopClock,
    poopAge,
    sick,
    sickFor: sick ? s.sickFor + 1 : 0,
    careMistakes: s.careMistakes + (ranOut ? 1 : 0),
  };
  return s;
}

/** Bring the pet up to `now`, half an hour at a time. It dies the moment it's starving and miserable. */
export function liveUntil(state: PetState, now: number, demo = false): PetState {
  if (!state.hatched || state.dead) return state;
  const step = STEP_MS / (demo ? DEMO_SPEED : 1);
  if (!state.livedUntil) return { ...state, livedUntil: now };
  const due = Math.floor((now - state.livedUntil) / step);
  if (due <= 0) return state;

  let s = state;
  let t = state.livedUntil;
  for (let i = 0; i < Math.min(due, MAX_STEPS); i++) {
    t += step;
    s = halfHour(s, s.asleep || isNightTime(new Date(t)), demo, t);
    if (isNeglected(s)) return { ...s, dead: true, asleep: false, livedUntil: t, diedAt: t };
  }
  return { ...s, livedUntil: due > MAX_STEPS ? now : t };
}

/**
 * When it would die if nobody cared for it from `now` on: it plays the same half-hours
 * forward. Returns a timestamp, or null if it's already a ghost or would last two weeks.
 */
export function projectedDeath(state: PetState, now: number, demo = false): number | null {
  if (!state.hatched || state.dead) return null;
  const step = STEP_MS / (demo ? DEMO_SPEED : 1);
  let s = state;
  let t = now;
  for (let i = 0; i < MAX_STEPS; i++) {
    t += step;
    s = halfHour(s, s.asleep || isNightTime(new Date(t)), demo, t);
    if (isNeglected(s)) return t;
  }
  return null;
}

/** Loads the saved pet and catches it up on the time that passed while you were away. */
export function loadLivePet(): PetState {
  let demo = false;
  try {
    demo = localStorage.getItem("tama_demo") === "1";
  } catch {
    /* storage blocked */
  }
  return liveUntil(loadPetState(), Date.now(), demo);
}
