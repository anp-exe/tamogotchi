import { memo } from "react";
import type { SpeciesId } from "../art/pets";
import { PetSprite } from "./PetSprite";

/**
 * The home hero's backdrop: a soft, illustrated meadow drawn as vector art so it stays
 * smooth at any size. Clouds drift at different speeds for depth, the sun glows, grass
 * and flowers sway, butterflies and birds go by, and the pixel pets stroll across.
 */

const W = 1600;
const H = 900;

const r = (seed: number) => {
  let s = seed;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
};

/** A puffy cloud: overlapping circles on a rounded base, with a soft shadow underneath. */
function Cloud({ scale = 1 }: { scale?: number }) {
  return (
    <g transform={`scale(${scale})`}>
      <ellipse cx="80" cy="86" rx="112" ry="14" fill="#CFE3F3" opacity="0.55" />
      <g fill="url(#cloud)">
        <circle cx="20" cy="56" r="30" />
        <circle cx="62" cy="34" r="42" />
        <circle cx="114" cy="40" r="36" />
        <circle cx="152" cy="60" r="24" />
        <rect x="-8" y="52" width="184" height="30" rx="15" />
      </g>
    </g>
  );
}

function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="62" rx="44" ry="8" fill="#5E9E4E" opacity="0.35" />
      <rect x="-6" y="18" width="12" height="46" rx="4" fill="#8A5A3C" />
      <circle cx="-22" cy="10" r="28" fill="#5FA64E" />
      <circle cx="20" cy="8" r="30" fill="#5FA64E" />
      <circle cx="0" cy="-16" r="34" fill="#6DB45A" />
      <circle cx="-10" cy="-26" r="16" fill="#8FD175" opacity="0.8" />
      <circle cx="16" cy="18" r="16" fill="#4E9443" opacity="0.6" />
    </g>
  );
}

function Flower({ x, y, petal, delay }: { x: number; y: number; petal: string; delay: number }) {
  // The outer group places the flower; the inner one sways it from the base of its stem.
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="mw-flower" style={{ animationDelay: `${delay}s` }}>
        <path d="M0 0 C 1 -8, -1 -14, 0 -22" stroke="#4E9443" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <g transform="translate(0 -24)">
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 5} cy={Math.sin((a * Math.PI) / 180) * 5} r="4.5" fill={petal} />
          ))}
          <circle r="3.4" fill="#FFD24D" />
        </g>
      </g>
    </g>
  );
}

function Butterfly({ colour }: { colour: string }) {
  return (
    <g>
      <g className="mw-wing">
        <ellipse cx="-7" cy="-4" rx="8" ry="6" fill={colour} />
        <ellipse cx="7" cy="-4" rx="8" ry="6" fill={colour} />
        <ellipse cx="-5" cy="5" rx="5" ry="4" fill={colour} opacity="0.85" />
        <ellipse cx="5" cy="5" rx="5" ry="4" fill={colour} opacity="0.85" />
      </g>
      <rect x="-1.2" y="-7" width="2.4" height="14" rx="1.2" fill="#3B2F4A" />
    </g>
  );
}

const CLOUDS = [
  { y: 90, s: 1.15, dur: 140, at: 0.05 },
  { y: 190, s: 0.75, dur: 190, at: 0.45 },
  { y: 60, s: 0.9, dur: 165, at: 0.7 },
  { y: 270, s: 0.55, dur: 230, at: 0.25 },
  { y: 150, s: 0.65, dur: 210, at: 0.88 },
];

const rand = r(7);
const FLOWERS = Array.from({ length: 46 }, (_, i) => ({
  x: Math.round(rand() * W),
  y: Math.round(748 + rand() * 140),
  petal: ["#FF9DBB", "#FFFFFF", "#C9B6F2", "#FFB38A"][i % 4],
  delay: -rand() * 4,
}));

const TUFTS = Array.from({ length: 70 }, () => ({ x: Math.round(rand() * W), y: Math.round(724 + rand() * 170), s: 0.7 + rand() * 0.7 }));

const WALKERS: { pet: SpeciesId; bottom: number; size: number; dur: number; delay: number; left?: boolean }[] = [
  { pet: "shroomi", bottom: 4, size: 104, dur: 46, delay: -6 },
  { pet: "jelli", bottom: 12, size: 78, dur: 58, delay: -30, left: true },
  { pet: "peachi", bottom: 2, size: 92, dur: 64, delay: -44 },
  { pet: "pebbl", bottom: 15, size: 66, dur: 74, delay: -16, left: true },
  { pet: "toasty", bottom: 8, size: 88, dur: 54, delay: -38, left: true },
];

/** `still` lays the moving parts out across the scene for a static export (e.g. to Figma). */
export const MeadowScene = memo(function MeadowScene({ still = false }: { still?: boolean }) {
  return (
    <div className="meadow" aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7CC4EE" />
            <stop offset="0.55" stopColor="#B7E0F7" />
            <stop offset="0.78" stopColor="#E6F4FB" />
          </linearGradient>
          <radialGradient id="sunGlow">
            <stop offset="0" stopColor="#FFF3B0" stopOpacity="0.9" />
            <stop offset="0.35" stopColor="#FFE58A" stopOpacity="0.45" />
            <stop offset="1" stopColor="#FFE58A" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sunDisc" cx="0.4" cy="0.38">
            <stop offset="0" stopColor="#FFFBE0" />
            <stop offset="1" stopColor="#FFDD6A" />
          </radialGradient>
          <linearGradient id="cloud" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.45" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#E2EEF8" />
          </linearGradient>
          <linearGradient id="farHill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#BFE3C9" />
            <stop offset="1" stopColor="#A9D7B0" />
          </linearGradient>
          <linearGradient id="midHill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#A6DA8C" />
            <stop offset="1" stopColor="#8AC873" />
          </linearGradient>
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8DCF71" />
            <stop offset="1" stopColor="#6DB55A" />
          </linearGradient>
          <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        <rect width={W} height={H} fill="url(#sky)" />

        <g className="mw-sun">
          <circle cx="1370" cy="160" r="210" fill="url(#sunGlow)" className="mw-glow" />
          <circle cx="1370" cy="160" r="62" fill="url(#sunDisc)" />
        </g>

        {CLOUDS.map((c, i) => (
          <g key={i} className="mw-cloud" style={{ animationDuration: `${c.dur}s`, animationDelay: `${-c.dur * c.at}s` }}>
            <g transform={`translate(${still ? Math.round(c.at * (W - 200)) : 0} ${c.y})`}>
              <Cloud scale={c.s} />
            </g>
          </g>
        ))}

        {[0, 1, 2].map((i) => (
          <g key={i} className="mw-bird" style={{ animationDuration: `${48 + i * 11}s`, animationDelay: `${-i * 17}s` }}>
            <g transform={`translate(${still ? 300 + i * 90 : 0} ${120 + i * 42})`}>
              <path className="mw-flap" d="M0 0 q 9 -8 18 0 q 9 -8 18 0" stroke="#5B6B8C" strokeWidth="3" fill="none" strokeLinecap="round" />
            </g>
          </g>
        ))}

        <path d="M0 590 C 200 520, 400 545, 580 572 S 920 512, 1110 552 S 1420 505, 1600 545 V 900 H 0 Z" fill="url(#farHill)" />
        <path d="M0 590 C 200 520, 400 545, 580 572 S 920 512, 1110 552 S 1420 505, 1600 545 V 900 H 0 Z" fill="url(#haze)" />
        <Tree x={250} y={575} s={0.7} />
        <Tree x={1180} y={556} s={0.6} />

        <path d="M0 660 C 180 604, 430 612, 640 650 S 1020 600, 1230 638 S 1480 612, 1600 628 V 900 H 0 Z" fill="url(#midHill)" />
        <Tree x={470} y={622} s={0.95} />
        <Tree x={1440} y={604} s={1.05} />

        <path d="M0 722 C 260 690, 540 702, 820 714 S 1310 688, 1600 706 V 900 H 0 Z" fill="url(#ground)" />

        <g className="mw-grass">
          {TUFTS.map((t, i) => (
            <path
              key={i}
              transform={`translate(${t.x} ${t.y}) scale(${t.s})`}
              d="M0 0 Q 2 -14 5 0 Q 7 -20 10 0 Q 13 -12 15 0 Z"
              fill={i % 3 ? "#5FA64E" : "#77BE5F"}
            />
          ))}
        </g>

        {FLOWERS.map((f, i) => (
          <Flower key={i} {...f} />
        ))}

        {["#FF9DBB", "#B9A7F0"].map((c, i) => (
          <g key={c} className="mw-butterfly" style={{ animationDuration: `${26 + i * 9}s`, animationDelay: `${-i * 11}s` }}>
            <g transform={`translate(${still ? 520 + i * 640 : 0} ${600 + i * 70})`}>
              <Butterfly colour={c} />
            </g>
          </g>
        ))}
      </svg>

      <div className="mw-pets">
        {WALKERS.map((w) => (
          <span
            key={w.pet}
            className={`mw-walker ${w.left ? "left" : ""}`}
            style={{ bottom: `${w.bottom}%`, width: w.size, animationDuration: `${w.dur}s`, animationDelay: `${w.delay}s` }}
          >
            <span className="mw-shadow" />
            <span className="mw-hop">
              <PetSprite species={w.pet} evolution="buddy" plain className="fill" />
            </span>
          </span>
        ))}
      </div>
    </div>
  );
});
