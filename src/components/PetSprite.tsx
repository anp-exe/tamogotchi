import { useEffect, useMemo, useState } from "react";
import { SPECIES, bottomRow, topRow, type SpeciesId } from "../art/pets";
import { BUDDY_HEART, EGG, EGG_CRACKED, EGG_CRACKED_2, EGGSHELL, HALO, PARTY_HAT, SCHOLAR_CAP } from "../art/sprites";
import type { Evolution } from "../game/evolutionLogic";
import { PixelLayer } from "./PixelArt";

type Props = {
  species: SpeciesId;
  evolution: Evolution;
  eyesClosed?: boolean;
  crack?: number; // 0, 1 or 2 cracks on the egg
  size?: number; // css px width; omit when sized by CSS
  className?: string;
  blink?: boolean;
  plain?: boolean; // no accessories
  eggTint?: string; // colour of the egg's spots, so each egg hints at who's inside
  ghost?: boolean; // the pet has died: pale, eyes closed, with a halo
};

/** Fade a colour most of the way towards a pale lavender mist, for the ghost. */
function toMist(hex: string): string {
  const mist = [242, 238, 255];
  const n = parseInt(hex.slice(1), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return `#${rgb.map((c, i) => Math.round(c + (mist[i] - c) * 0.62).toString(16).padStart(2, "0")).join("")}`;
}

/** Canvas: 40 x 52 pixel units, pet's 32x32 grid at (4, 16). Room above for hats, below for the eggshell. */
export const SPRITE_W = 40;
export const SPRITE_H = 52;

export function PetSprite({ species, evolution, eyesClosed, crack = 0, size, className, blink = true, plain, eggTint, ghost }: Props) {
  const sp = SPECIES[species];
  const palette = useMemo(() => {
    const base: Record<string, string> = { K: "#3B2F4A", W: "#FFFFFF", P: "#F7A6B9", ...sp.palette };
    return ghost ? Object.fromEntries(Object.entries(base).map(([k, v]) => [k, toMist(v)])) : base;
  }, [sp, ghost]);
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    if (!blink || evolution === "egg") return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => setBlinking(false), 140);
        loop();
      }, 2200 + Math.random() * 2600);
    };
    loop();
    return () => clearTimeout(t);
  }, [blink, evolution]);

  const closed = eyesClosed || blinking || ghost;
  const overrides = useMemo(
    () => (closed ? sp.blink.map(([x, y]) => ({ x, y, ch: sp.blinkWith })) : undefined),
    [closed, sp],
  );

  const top = topRow(sp.grid);
  const bottom = bottomRow(sp.grid);
  const ox = 4;
  const oy = 16;

  if (evolution === "egg") {
    const egg = crack >= 2 ? EGG_CRACKED_2 : crack === 1 ? EGG_CRACKED : EGG;
    return (
      <svg
        className={className}
        width={size}
        viewBox={`0 0 ${SPRITE_W} ${SPRITE_H}`}
        shapeRendering="crispEdges"
        aria-label="An egg"
        role="img"
      >
        <PixelLayer grid={egg.grid} palette={eggTint ? { ...egg.palette, L: eggTint } : egg.palette} x={8} y={20} />
      </svg>
    );
  }

  if (ghost) {
    return (
      <svg
        className={className}
        width={size}
        viewBox={`0 0 ${SPRITE_W} ${SPRITE_H}`}
        shapeRendering="crispEdges"
        role="img"
        aria-label={`${sp.name}'s ghost`}
      >
        <g opacity={0.9}>
          <PixelLayer grid={sp.grid} palette={palette} overrides={overrides} x={ox} y={oy} />
        </g>
        <PixelLayer grid={HALO.grid} palette={HALO.palette} x={ox + 8} y={oy + top - 7} />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      width={size}
      viewBox={`0 0 ${SPRITE_W} ${SPRITE_H}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`${sp.name}, ${evolution.replace("_", " ")}`}
    >
      <PixelLayer grid={sp.grid} palette={palette} overrides={overrides} x={ox} y={oy} />
      {!plain && evolution === "scholar" && (
        <PixelLayer grid={SCHOLAR_CAP.grid} palette={SCHOLAR_CAP.palette} x={ox + 6} y={oy + top - 10} />
      )}
      {!plain && evolution === "chaos_sprite" && (
        <g transform={`rotate(-14 ${ox + 16} ${oy + top - 6})`}>
          <PixelLayer grid={PARTY_HAT.grid} palette={PARTY_HAT.palette} x={ox + 8} y={oy + top - 12} />
        </g>
      )}
      {!plain && evolution === "buddy" && (
        <PixelLayer grid={BUDDY_HEART.grid} palette={BUDDY_HEART.palette} x={ox + 20} y={oy + top - 6} />
      )}
      {!plain && evolution === "hatchling" && (
        <PixelLayer grid={EGGSHELL.grid} palette={EGGSHELL.palette} x={ox + 4} y={oy + bottom - 4} />
      )}
    </svg>
  );
}
