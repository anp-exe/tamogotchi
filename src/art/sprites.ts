import { BASE, INK, type Palette, type PixelGrid } from "./pets";

export type Sprite = { grid: PixelGrid; palette: Palette };

const sprite = (grid: PixelGrid, palette: Palette = {}): Sprite => ({ grid, palette: { ...BASE, ...palette } });

/** Evolution accessories and eggs, drawn at 2x so they match the 32x32 pets. */
export const SCHOLAR_CAP = sprite(
  [
    ".......KKKKKK.......",
    "....KKKNNDDDDKKK....",
    "KKKKDDDDDDDDDDDDKKK.",
    "dddDDDDDDDYYDDDddddK",
    "KKKKddDDDDDDYYYYKKK.",
    "...KKKKddddddKKKY...",
    "...KDDDKKKKKKdddY...",
    "...KdDDDDDDDddddY...",
    "....KdDDDDDddddKY...",
    ".....KddddddddKYYy..",
    "......KddddddK.yyy..",
    ".......KKKKKK.......",
    "....................",
  ],
  { D: "#2D3A6B", d: "#1E2850", N: "#4D5F9E", K: "#3B2F4A", Y: "#FFD24D", y: "#E0A92A" },
);

export const PARTY_HAT = sprite(
  [
    ".....KWWWwK.....",
    ".....KWWWWK.....",
    "....KWWWWWwK....",
    "....KWWWWwwK....",
    ".....KwwwwK.....",
    ".....KKKKKK.....",
    "....KPYYYPpK....",
    "....KYYYPPPK....",
    "...KYYYPPPYYK...",
    "...KYYPPPYYYK...",
    "..KYYPPPYYYPpK..",
    "..KYPPPYYYPPPK..",
    ".KYpppYYYpppYYK.",
    "..KKKKKKKKKKKK..",
    "................",
  ],
  { P: "#F583B4", p: "#D9609A", Y: "#FFD24D", W: "#FFFFFF", w: "#E3DCF2", K: "#3B2F4A" },
);

export const HEART_CLIP = sprite(
  [".KK.KK.", "KRRKRRK", "KRRRRRK", ".KRRRK.", "..KRK..", "...K..."],
  { R: "#FF6B8B" },
);

/** A ghost's halo, a gold ring seen from slightly above. */
export const HALO = sprite(
  [
    "....KKKKKKKK....",
    "..KKYYYYYYYYKK..",
    ".KYYKK....KKYYK.",
    "..KKYYYYYYYYKK..",
    "....KKKKKKKK....",
  ],
  { Y: "#FFE27A", K: "#C9962B" },
);

/** The buddy form's heart clip (the small HEART_CLIP stays as the happiness meter icon). */
export const BUDDY_HEART = sprite(
  [
    "..KKKKKKKKKK..",
    ".KRRRRRRRRRrK.",
    "KRRWRRRRRRRrrK",
    "KRWWRRRRRRRrrK",
    "KRRRRRRRRRRrrK",
    "KRRRRRRRRrrrrK",
    "KrrRRRRRrrrrrK",
    ".KKrRRRrrrrKK.",
    "...KrRrrrrK...",
    "....KrrrrK....",
    ".....KrrK.....",
    "......KK......",
  ],
  { R: "#FF6B8B", r: "#D9466A", W: "#FFFFFF", K: "#3B2F4A" },
);

export const EGGSHELL = sprite(
  [
    "...K.....K.....K.....K..",
    "..KSK...KSK...KSK...KSK.",
    ".KSWSK.KWWSK.KWWSK.KSSK.",
    "..KWWSKWWWWSKWWWWSKSSK..",
    "..KSWWWWWWWWWWWWWSSSSK..",
    "...KSWWWWWWWWWWWSSSSK...",
    "....KSWWWWWWWWWSSSSK....",
    ".....KSSSSSSSSSSSSK.....",
    "......KSSSSSSSSSSK......",
    ".......KKKKKKKKKK.......",
  ],
  { W: "#FFF8EC", S: "#E6D6BE", K: "#3B2F4A" },
);

export const EGG = sprite(
  [
    "........................",
    "........................",
    ".........KKKKKK.........",
    "........KWWWWSSK........",
    ".......KWWWWWWSSK.......",
    "......KWWWWWWWWLSK......",
    ".....KHWWWWWWWLLLSK.....",
    "....KWHLLWWWWWLLLSSK....",
    "...KWHLLLLWWWWWLWWSSK...",
    "...KWHLLLLWWWWWWWWSSK...",
    "..KWWWWLLWWWWWWWWWWSSK..",
    "..KWWWWWWWWWWWWWWWWSSK..",
    "..KWWWWWWWWWWWWWWWWSSK..",
    ".KWWWWWWWWWWWWWLLWWSSSK.",
    ".KWWWWWWWWWWWWLLLLWSSSK.",
    ".KWWWWWWWWWWWWLLLLWSSSK.",
    ".KWWWWWWWWWWWWLLLLSSSSK.",
    ".KSWWLLLLWWWWWWLLWSSSSK.",
    ".KSWWLLLLWWWWWWWWWSSSSK.",
    "..KWWLLLLWWWWWWWWSSSSK..",
    "..KSWWWWWWWWWWWWSSSSSK..",
    "..KSSWWWWWWWLLWSSSSSSK..",
    "...KSSWWWWWLLLLSSSSSK...",
    "....KSSWWWWWLLSSSSSK....",
    ".....KSSSSSSSSSSSSK.....",
    "......KSSSSSSSSSSK......",
    ".......KSSSSSSSSK.......",
    "........KKKKKKKK........",
  ],
  { W: "#FFF8EC", S: "#E6D6BE", K: "#3B2F4A", L: "#B9A7F0", H: "#FFFFFF" },
);

export const EGG_CRACKED = sprite(
  [
    "........................",
    "........................",
    ".........KKKKKK.........",
    "........KWWWWSSK........",
    ".......KWWWWWWSSK.......",
    "......KWWWWWWWWLSK......",
    ".....KHWWWWWWWLLLSK.....",
    "....KWHLLWWWWWLLLSSK....",
    "...KWHLLLLWWWWWLWWSSK...",
    "...KWHLLLLWWWWWWWWSSK...",
    "..KWWWWLLWWWWWWWWWWSSK..",
    "..KWWWWWWWWWWWWWWWWSSK..",
    "..KWWWWKWWWKWWWWWWWSSK..",
    ".KWWKWKWKWKWWWWLLWWSSSK.",
    ".KWWWKWWWKWWWWLLLLWSSSK.",
    ".KWWWWWWWWWWWWLLLLWSSSK.",
    ".KWWWWWWWWWWWWLLLLSSSSK.",
    ".KSWWLLLLWWWWWWLLWSSSSK.",
    ".KSWWLLLLWWWWWWWWWSSSSK.",
    "..KWWLLLLWWWWWWWWSSSSK..",
    "..KSWWWWWWWWWWWWSSSSSK..",
    "..KSSWWWWWWWLLWSSSSSSK..",
    "...KSSWWWWWLLLLSSSSSK...",
    "....KSSWWWWWLLSSSSSK....",
    ".....KSSSSSSSSSSSSK.....",
    "......KSSSSSSSSSSK......",
    ".......KSSSSSSSSK.......",
    "........KKKKKKKK........",
  ],
  { W: "#FFF8EC", S: "#E6D6BE", K: "#3B2F4A", L: "#B9A7F0", H: "#FFFFFF" },
);

export const EGG_CRACKED_2 = sprite(
  [
    "........................",
    "........................",
    ".........KKKKKK.........",
    "........KWWWWSSK........",
    ".......KWWWWWKSSK.......",
    "......KWWWWWKWWLSK......",
    ".....KHWWWWWWKLLLSK.....",
    "....KWHLLWWWKWLLLSSK....",
    "...KWHLLLLWWWWWLWWSSK...",
    "...KWHLLLLWWWWWWWWSSK...",
    "..KWWWWLLWWWWWWWWWWSSK..",
    "..KWWWWWWWWWWWWWWWWSSK..",
    "..KWWWWKWWWKKWWWKWWSKK..",
    ".KWWKWKWKWKWWKWKLKWKSSK.",
    ".KWWWKWWWKWWWWKLLLKSSSK.",
    ".KWWWWWWWWWWWWLLLLWSSSK.",
    ".KWWWWWWWWWWWWLLLLSSSSK.",
    ".KSWWLLLLWWWWWWLLWSSSSK.",
    ".KSWWLLLLWWWWWWWWWSSSSK.",
    "..KWWLLLLWWWWWWWWSSSSK..",
    "..KSWWWWWWWWWWWWSSSSSK..",
    "..KSSWWWWWWWLLWSSSSSSK..",
    "...KSSWWWWWLLLLSSSSSK...",
    "....KSSWWWWWLLSSSSSK....",
    ".....KSSSSSSSSSSSSK.....",
    "......KSSSSSSSSSSK......",
    ".......KSSSSSSSSK.......",
    "........KKKKKKKK........",
  ],
  { W: "#FFF8EC", S: "#E6D6BE", K: "#3B2F4A", L: "#B9A7F0", H: "#FFFFFF" },
);

export const RICE_BALL = sprite(
  ["...KK...", "..KWWK..", ".KWWWWK.", ".KWWWWK.", "KWWWWWWK", "KDDDDDDK", "KDDDDDDK", ".KKKKKK."],
  { D: "#2F4F3A" },
);

export const RICE_BALL_BITTEN = sprite(
  ["........", "........", "......K.", ".KWWWWK.", "KWWWWWWK", "KDDDDDDK", "KDDDDDDK", ".KKKKKK."],
  { D: "#2F4F3A" },
);

export const BALL = sprite(
  ["..KKKK..", ".KRRYYK.", "KRRRYYYK", "KRRRYYYK", "KBBBWWWK", "KBBBWWWK", ".KBBWWK.", "..KKKK.."],
  { R: "#FF6B8B", Y: "#FFD24D", B: "#6FB7F0" },
);

export const HEART = sprite([".R.R.", "RRRRR", "RRRRR", ".RRR.", "..R.."], { R: "#FF6B8B" });

export const TEAR = sprite([".B.", "BBB", "BBB", ".B."], { B: "#6FB7F0" });

export const SPARKLE = sprite(["..Y..", "..Y..", "YYWYY", "..Y..", "..Y.."], { Y: "#FFD24D" });

export const BOOK = sprite(
  ["KKKKKKKK", "KBBBKBBK", "KBWBKBWK", "KBWBKBWK", "KBBBKBBK", "KKKKKKKK"],
  { B: "#6F9BE0" },
);

export const BOLT = sprite(
  ["..KKK", ".KYYK", "KYYK.", "KKYYK", ".KYK.", "KYK..", "KK..."],
  { Y: "#FFD24D" },
);

/** Same sprite drawn as an empty slot (for meters). */
export function emptyOf(s: Sprite): Sprite {
  const palette: Record<string, string> = {};
  for (const k of Object.keys(s.palette)) palette[k] = k === "K" ? "#C9C0E6" : "#EEE9FA";
  return { grid: s.grid, palette };
}

/** Classic handheld care icons: a poop to clean up, the sick skull, and medicine. */
export const POOP = sprite(
  ["....KK....", "...KBBK...", "...KBWBK..", "..KBBBBK..", "..KBWBBBK.", ".KBBBBBBK.", "KBBWBBBBBK", "KBBBBBBBBK", ".KKKKKKKK."],
  { B: "#8A5A3C", W: "#B98560" },
);

export const SKULL = sprite(
  [".KKKKK.", "KWWWWWK", "KWKWKWK", "KWWWWWK", ".KWKWK.", ".KWWWK.", "..KKK.."],
  { W: "#F4F1FF" },
);

export const PILL = sprite(
  [".KKKKKK.", "KRRRWWWK", "KRNRWWWK", ".KKKKKK."],
  { R: "#E8545B", N: "#FF9A9A", W: "#FFF8EC" },
);

export const Z = sprite(["KKKK", "..K.", ".K..", "KKKK"]);


export { INK };
