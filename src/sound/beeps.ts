/**
 * Handheld-style beeps, made on the fly with the Web Audio API (no sound files).
 * Each sound is a short list of notes: [frequency Hz, start s, length s, wave].
 */

type Note = [number, number, number, OscillatorType?];

const SOUNDS = {
  press: [[1200, 0, 0.04]],
  select: [[900, 0, 0.05], [1350, 0.06, 0.07]],
  back: [[700, 0, 0.06]],
  tap: [[1500, 0, 0.03]],
  eat: [[220, 0, 0.07], [180, 0.14, 0.07], [220, 0.28, 0.07]],
  play: [[660, 0, 0.07], [880, 0.08, 0.07], [1100, 0.16, 0.09]],
  pat: [[1760, 0, 0.05], [2093, 0.06, 0.06]],
  sleep: [[784, 0, 0.12], [659, 0.14, 0.12], [523, 0.28, 0.2]],
  clean: [[1046, 0, 0.05], [1318, 0.06, 0.05], [1568, 0.12, 0.08]],
  medicine: [[330, 0, 0.08], [262, 0.1, 0.12]],
  hatch: [[523, 0, 0.08], [659, 0.09, 0.08], [784, 0.18, 0.08], [1047, 0.27, 0.22]],
  grow: [[523, 0, 0.1], [784, 0.11, 0.1], [1047, 0.22, 0.1], [1568, 0.33, 0.28]],
  call: [[1568, 0, 0.06], [1568, 0.12, 0.06], [1568, 0.24, 0.06]],
  alert: [[440, 0, 0.14, "sawtooth"], [440, 0.26, 0.14, "sawtooth"]],
  death: [[659, 0, 0.25, "triangle"], [587, 0.28, 0.25, "triangle"], [523, 0.56, 0.25, "triangle"], [392, 0.84, 0.7, "triangle"]],
  revive: [[392, 0, 0.1], [523, 0.11, 0.1], [659, 0.22, 0.1], [784, 0.33, 0.1], [1047, 0.44, 0.32]],
} satisfies Record<string, Note[]>;

export type SoundName = keyof typeof SOUNDS;

const KEY = "tama_sound";
let ctx: AudioContext | null = null;
let on = true;
try {
  on = localStorage.getItem(KEY) !== "0";
} catch {
  /* storage blocked: sound stays on */
}

export function isSoundOn(): boolean {
  return on;
}

export function setSoundOn(value: boolean): void {
  on = value;
  try {
    localStorage.setItem(KEY, value ? "1" : "0");
  } catch {
    /* fine */
  }
}

export function beep(name: SoundName): void {
  if (!on || typeof window === "undefined" || !("AudioContext" in window)) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const t0 = ctx.currentTime + 0.01;
    for (const [freq, start, length, wave = "square"] of SOUNDS[name] as Note[]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0 + start);
      gain.gain.exponentialRampToValueAtTime(0.05, t0 + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + length);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0 + start);
      osc.stop(t0 + start + length + 0.02);
    }
  } catch {
    /* audio unavailable: stay quiet */
  }
}
