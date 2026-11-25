/**
 * Growing up, like a real handheld: the pet ages in real time through four stages.
 *
 *   Baby   first hour           Child  rest of day 1
 *   Teen   days 1 to 3          Adult  from day 3
 *
 * At adulthood its leading trait (shaped by how you cared for it) decides its form.
 * An adult can still switch form once a day if another trait pulls 10+ ahead.
 * Demo mode squeezes the stages into minutes.
 */

export type Evolution = "egg" | "hatchling" | "scholar" | "chaos_sprite" | "buddy";
export type Trait = "curiosity" | "playfulness" | "friendship";

const SWITCH_MARGIN = 10;

export type LifeStage = "baby" | "child" | "teen" | "adult";

const HOUR = 60 * 60 * 1000;
const STAGE_ENDS = {
  normal: [1 * HOUR, 24 * HOUR, 72 * HOUR],
  demo: [60_000, 3 * 60_000, 6 * 60_000],
} as const;

export const STAGE_INFO: Record<LifeStage, { name: string; scale: number }> = {
  baby: { name: "Baby", scale: 0.55 },
  child: { name: "Child", scale: 0.7 },
  teen: { name: "Teen", scale: 0.85 },
  adult: { name: "Adult", scale: 1 },
};

export function lifeStage(bornAt: number, demoMode = false, now = Date.now()): LifeStage {
  const age = now - bornAt;
  const [baby, child, teen] = STAGE_ENDS[demoMode ? "demo" : "normal"];
  return age < baby ? "baby" : age < child ? "child" : age < teen ? "teen" : "adult";
}

/** 0 to 1: how far it is from hatching to adulthood. */
export function growthProgress(bornAt: number, demoMode = false, now = Date.now()): number {
  const adult = STAGE_ENDS[demoMode ? "demo" : "normal"][2];
  return Math.min(1, Math.max(0, (now - bornAt) / adult));
}
const SWITCH_GAP_MS = 24 * 60 * 60 * 1000; // 24 h between form switches
const DEMO_SWITCH_GAP_MS = 30 * 1000;       // 30 s in demo mode

export const FORM_FOR_TRAIT: Record<Trait, Evolution> = {
  curiosity: "scholar",
  playfulness: "chaos_sprite",
  friendship: "buddy",
};

export const TRAIT_FOR_FORM: Partial<Record<Evolution, Trait>> = {
  scholar: "curiosity",
  chaos_sprite: "playfulness",
  buddy: "friendship",
};

export const FORM_INFO: Record<Evolution, { name: string; blurb: string }> = {
  egg: { name: "Egg", blurb: "Something is wriggling in there." },
  hatchling: { name: "Growing up", blurb: "Still growing. Who will it become?" },
  scholar: { name: "Scholar", blurb: "Curiosity led. Loves questions and focus sessions." },
  chaos_sprite: { name: "Chaos Sprite", blurb: "Playfulness led. Pure bouncy chaos." },
  buddy: { name: "Buddy", blurb: "Friendship led. Warm, loyal, a great listener." },
};

type EvoInput = {
  hatched: boolean;
  bornAt: number;
  formChangedAt: number;
  curiosity: number;
  playfulness: number;
  friendship: number;
};

export function leadingTrait(t: Record<Trait, number>): Trait {
  const order: Trait[] = ["curiosity", "playfulness", "friendship"];
  return order.reduce((best, k) => (t[k] > t[best] ? k : best), order[0]);
}

export function computeEvolution(
  t: EvoInput,
  current: Evolution,
  demoMode = false,
  now = Date.now(),
): Evolution {
  if (!t.hatched) return "egg";
  if (lifeStage(t.bornAt, demoMode, now) !== "adult") return "hatchling";

  const lead = leadingTrait(t);
  const leadValue = t[lead];
  const currentTrait = TRAIT_FOR_FORM[current];

  // Just grown up: the care it got decides who it becomes.
  if (!currentTrait) return FORM_FOR_TRAIT[lead];

  // Already evolved: switch form only if the new leader is ahead by SWITCH_MARGIN
  // AND enough time has passed since the last form change
  const switchGap = demoMode ? DEMO_SWITCH_GAP_MS : SWITCH_GAP_MS;
  if (
    lead !== currentTrait &&
    leadValue >= t[currentTrait] + SWITCH_MARGIN &&
    now - (t.formChangedAt || 0) >= switchGap
  ) {
    return FORM_FOR_TRAIT[lead];
  }
  return current;
}

/** Milliseconds until it's an adult. 0 means it already is. */
export function msUntilCanEvolve(bornAt: number, demoMode = false, now = Date.now()): number {
  return Math.max(0, bornAt + STAGE_ENDS[demoMode ? "demo" : "normal"][2] - now);
}

/** Format a millisecond duration as "Xh Ym", "Ym", or "ready". */
export function formatTimeUntil(ms: number): string {
  if (ms <= 0) return "ready";
  const totalMins = Math.ceil(ms / 60_000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
