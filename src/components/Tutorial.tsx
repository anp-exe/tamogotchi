import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/** The how-to-play guide (shown after every hatch): dims the page, rings one control at a time and points at it. */

type Step = { target: string; title: string; text: string };

const steps = (name: string, deathNote: string): Step[] => [
  { target: ".lcd .pet-wrap", title: `Meet ${name}!`, text: "Tap it any time to give it a pat." },
  {
    target: ".bezel > .icon-row:first-child",
    title: "Top icons",
    text: "Feed, Play, Lights (sleep) and Clean. The highlighted icon is the one that's picked.",
  },
  {
    target: ".bezel > .icon-row:last-child",
    title: "Bottom icons",
    text: "Medicine, Talk, Stats and Attention. Attention lights up when your pet wants something.",
  },
  { target: ".hw-A", title: "Button A", text: "Moves to the next icon." },
  { target: ".hw-B", title: "Button B", text: "Uses the highlighted icon." },
  { target: ".hw-C", title: "Button C", text: "Goes back, or pats your pet. Your keyboard's A, B and C keys work too." },
  {
    target: ".pet-summary",
    title: "Keep it alive",
    text: `It lives in real time, even with this tab closed: it gets hungry, sleeps at night, poops and can get sick. It dies if it's left starving and unhappy (about a day with no care at all), or sick for 6 hours without medicine. ${deathNote} You can revive it once.`,
  },
  {
    target: ".game-bar-right",
    title: "Up here",
    text: "Change its shell, replay this guide, turn the sound off, or start over.",
  },
];

type Box = { top: number; left: number; width: number; height: number };

export function Tutorial({ petName, deathNote, onClose }: { petName: string; deathNote: string; onClose: () => void }) {
  const list = steps(petName, deathNote);
  const [i, setI] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [tipH, setTipH] = useState(180);
  const tipRef = useRef<HTMLDivElement>(null);
  const step = list[i];

  useLayoutEffect(() => {
    if (tipRef.current) setTipH(tipRef.current.offsetHeight);
  }, [i, box]);

  const measure = useCallback(() => {
    const el = document.querySelector(step.target);
    if (!el) return setBox(null);
    const r = el.getBoundingClientRect();
    setBox({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step.target]);

  useLayoutEffect(() => {
    const el = document.querySelector(step.target);
    el?.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });
    measure();
  }, [measure, step.target]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  const finish = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight" || e.key === "Enter") setI((n) => Math.min(list.length - 1, n + 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(0, n - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish, list.length]);

  // Put the tip beside the target where there's room (below it for things near the top),
  // always kept inside the window; the arrow stays pointed at the target.
  const pad = 10;
  const tipW = 300;
  const edge = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let side: "right" | "left" | "below" = "below";
  let tip = { top: edge, left: edge };
  let arrow = 0; // along the tip's edge, in px
  if (box) {
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const nearTop = box.top < vh * 0.22;
    if (!nearTop && box.left + box.width + pad + tipW + 24 < vw) side = "right";
    else if (!nearTop && box.left - pad - tipW - 24 > 0) side = "left";
    if (side === "below") {
      const left = Math.max(edge, Math.min(vw - tipW - edge, cx - tipW / 2));
      tip = { left, top: Math.min(vh - tipH - edge, box.top + box.height + pad + 22) };
      arrow = Math.max(20, Math.min(tipW - 20, cx - left));
    } else {
      const top = Math.max(edge, Math.min(vh - tipH - edge, cy - tipH / 2));
      tip = { left: side === "right" ? box.left + box.width + pad + 22 : box.left - pad - 22 - tipW, top };
      arrow = Math.max(20, Math.min(tipH - 20, cy - top));
    }
  }
  const last = i === list.length - 1;

  return (
    <div className="tutorial" role="dialog" aria-modal="true" aria-label="How to play">
      {box && (
        <div
          className="tutorial-ring"
          style={{ top: box.top - pad, left: box.left - pad, width: box.width + pad * 2, height: box.height + pad * 2 }}
        />
      )}
      <div ref={tipRef} className={`tutorial-tip ${side}`} style={{ top: tip.top, left: tip.left, width: tipW }}>
        <span
          className="tutorial-arrow"
          aria-hidden="true"
          style={side === "below" ? { left: arrow - 14 } : { top: arrow - 14 }}
        />
        <p className="tutorial-count pixel">
          {i + 1} / {list.length}
        </p>
        <h3>{step.title}</h3>
        <p>{step.text}</p>
        <div className="tutorial-nav">
          <button type="button" className="btn-text" onClick={finish}>
            Skip
          </button>
          <div className="row-gap">
            {i > 0 && (
              <button type="button" className="btn btn-secondary small" onClick={() => setI(i - 1)}>
                Back
              </button>
            )}
            <button type="button" className="btn btn-primary small" onClick={() => (last ? finish() : setI(i + 1))}>
              {last ? "Let's play" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
