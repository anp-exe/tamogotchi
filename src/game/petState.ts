import type { PetMode } from "../ai/types";
import type { SpeciesId } from "../art/pets";
import { SPECIES, SPECIES_IDS } from "../art/pets";
import { computeEvolution, type Evolution } from "./evolutionLogic";

export type { Evolution } from "./evolutionLogic";

export type TraitGains = { curiosity: number; playfulness: number; friendship: number };

export type PetState = {
  petName: string;
  species: SpeciesId;
  hunger: number; // 0-100 (higher = hungrier, bad)
  energy: number; // 0-100 (higher = more energetic, good)
  happiness: number; // 0-100
  mode: PetMode;
  curiosity: number; // 0-100
  playfulness: number; // 0-100
  friendship: number; // 0-100
  evolution: Evolution;
  savedFacts: string[];
  hatched: boolean;
  asleep: boolean;
  bornAt: number;
  lastSaved: number;
  formChangedAt: number;  // timestamp of last form change (0 = never)
  traitDay: string;       // "YYYY-MM-DD" for daily cap tracking
  traitGains: TraitGains; // trait gains accumulated today
  dead: boolean;          // left starving and miserable: it becomes a ghost
  revived: boolean;       // each pet can be brought back once
  livedUntil: number;     // real time its life has been simulated up to (see life.ts)
  diedAt: number;         // when it died (0 = alive)
  poops: number;          // 0-3 on screen
  poopClock: number;      // awake half-hours since the last poop
  poopAge: number;        // half-hours the oldest poop has been left
  sick: boolean;
  sickFor: number;        // half-hours sick without medicine
  careMistakes: number;   // times a need was left to run out
};

export const INITIAL_STATE: PetState = {
  petName: "",
  species: "shroomi",
  hunger: 30,
  energy: 80,
  happiness: 70,
  mode: "companion",
  curiosity: 5,
  playfulness: 5,
  friendship: 5,
  evolution: "egg",
  savedFacts: [],
  hatched: false,
  asleep: false,
  bornAt: 0,
  lastSaved: Date.now(),
  formChangedAt: 0,
  traitDay: "",
  traitGains: { curiosity: 0, playfulness: 0, friendship: 0 },
  dead: false,
  revived: false,
  livedUntil: 0,
  diedAt: 0,
  poops: 0,
  poopClock: 0,
  poopAge: 0,
  sick: false,
  sickFor: 0,
  careMistakes: 0,
};

const STORAGE_KEY = "tama_pet";
export const MAX_FACTS = 5;

/** Show the saved nickname when present; old unnamed saves fall back to their species. */
export function resolvePetName(name: unknown, species: SpeciesId): string {
  return typeof name === "string" && name.trim() ? name.trim() : SPECIES[species].name;
}

export const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export function loadPetState(): PetState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const merged: PetState = { ...INITIAL_STATE, ...JSON.parse(raw) };
      if (!SPECIES_IDS.includes(merged.species)) merged.species = INITIAL_STATE.species;
      merged.petName = resolvePetName(merged.petName, merged.species);
      merged.asleep = false;
      // Normalise new fields that may be absent in old saves
      merged.formChangedAt = merged.formChangedAt ?? 0;
      merged.traitDay = merged.traitDay ?? "";
      merged.traitGains = {
        curiosity: merged.traitGains?.curiosity ?? 0,
        playfulness: merged.traitGains?.playfulness ?? 0,
        friendship: merged.traitGains?.friendship ?? 0,
      };
      const demoMode = localStorage.getItem("tama_demo") === "1";
      merged.evolution = computeEvolution(merged, merged.evolution, demoMode);
      // Older saves didn't track life time: carry on from when they were last saved.
      if (merged.hatched && !merged.livedUntil) merged.livedUntil = merged.lastSaved;
      return merged;
    }
  } catch {
    /* corrupted save: start over */
  }
  return { ...INITIAL_STATE };
}

export function savePetState(state: PetState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, lastSaved: Date.now() }));
  } catch {
    /* storage blocked */
  }
}

export function resetPetState(): PetState {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return { ...INITIAL_STATE, lastSaved: Date.now() };
}

export function hatchPet(state: PetState, name: string, species: SpeciesId): PetState {
  const demoMode = localStorage.getItem("tama_demo") === "1";
  const next: PetState = {
    ...state,
    petName: resolvePetName(name.trim().slice(0, 12), species),
    species,
    hatched: true,
    dead: false,
    revived: false,
    diedAt: 0,
    livedUntil: Date.now(),
    poops: 0,
    poopClock: 0,
    poopAge: 0,
    sick: false,
    sickFor: 0,
    careMistakes: 0,
    bornAt: Date.now(),
    formChangedAt: 0,
    traitDay: "",
    traitGains: { curiosity: 0, playfulness: 0, friendship: 0 },
  };
  next.evolution = computeEvolution(next, "egg", demoMode);
  return next;
}
