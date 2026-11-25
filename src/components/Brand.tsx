import { useId } from "react";
import { EGG_PATH } from "./ShellArt";

/** The logo: a tiny empty lilac shell. */
export function LogoMark({ size = 40 }: { size?: number }) {
  const g = `lg-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg className="logo-mark" width={size} height={size * (60 / 50)} viewBox="0 0 50 60" aria-hidden="true">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D3C6F8" />
          <stop offset="1" stopColor="#9580E3" />
        </linearGradient>
      </defs>
      <ellipse cx="25" cy="4" rx="3.2" ry="2.4" fill="none" stroke="#7A66C9" strokeWidth="1.6" />
      <g transform="translate(3 5.5) scale(0.1)">
        <path d={EGG_PATH} fill={`url(#${g})`} stroke="#3B2F4A" strokeWidth="32" />
      </g>
      <ellipse cx="15" cy="17" rx="5" ry="2" fill="#fff" fillOpacity="0.5" transform="rotate(-32 15 17)" />
      <rect x="11" y="20" width="28" height="23" rx="3" fill="#E4ECD3" stroke="#3B2F4A" strokeWidth="1.6" />
      <rect x="14" y="23" width="6" height="2" fill="#fff" fillOpacity="0.7" />
      {[17, 25, 33].map((cx, i) => (
        <circle key={cx} cx={cx} cy={i === 1 ? 51.5 : 49.5} r="2.6" fill="#FFD24D" stroke="#3B2F4A" strokeWidth="1.2" />
      ))}
    </svg>
  );
}

export type Page = "home" | "play" | "about";

const BIG_COLOURS = ["#B9A7F0", "#F7A6B9", "#8FE3C6", "#FFD24D"];

/** Big bouncy game-title logo for the home hero. */
export function BigLogo({ withMark = true }: { withMark?: boolean }) {
  return (
    <div className="big-logo" aria-label="TAMA: Made by You">
      {withMark && (
        <span className="big-mark">
          <LogoMark size={104} />
        </span>
      )}
      <span className="big-word" aria-hidden="true">
        {"tama".split("").map((ch, i) => (
          <span key={i} style={{ ["--i" as string]: i, color: BIG_COLOURS[i] }}>{ch}</span>
        ))}
      </span>
      <span className="big-ribbon pixel" aria-hidden="true">MADE BY YOU</span>
    </div>
  );
}
export type Go = (page: Page, section?: string) => void;

export function Logo({ size = 40, light = false, go }: { size?: number; light?: boolean; go: Go }) {
  return (
    <a
      className={`logo ${light ? "light" : ""}`}
      href="#/"
      aria-label="TAMA: Made by You, home"
      onClick={(e) => {
        e.preventDefault();
        go("home");
      }}
    >
      <LogoMark size={size} />
      <span className="wordmark">
        <b>
          {"tama".split("").map((ch, i) => (
            <span key={i} style={{ ["--i" as string]: i }}>{ch}</span>
          ))}
        </b>
        <small>MADE BY YOU</small>
      </span>
    </a>
  );
}

function NavLink({ go, page, section, children, active }: { go: Go; page: Page; section?: string; children: string; active?: boolean }) {
  return (
    <a
      href={page === "play" ? "#/play" : page === "about" ? "#/about" : "#/"}
      className={active ? "active" : undefined}
      onClick={(e) => {
        e.preventDefault();
        go(page, section);
      }}
    >
      {children}
    </a>
  );
}

export function Header({ page, go, hatched }: { page: Page; go: Go; hatched: boolean }) {
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Logo size={36} go={go} />
        <nav className="nav" aria-label="Main">
          <NavLink go={go} page="home" active={page === "home"}>Home</NavLink>
          <NavLink go={go} page="about" section="pets" active={page === "about"}>Pets</NavLink>
          <NavLink go={go} page="play" active={page === "play"}>My Pet</NavLink>
        </nav>
        <button type="button" className="btn btn-play small" onClick={() => go("play")}>
          {hatched ? "Visit your pet" : "Play"}
        </button>
      </div>
    </header>
  );
}

/** The game tab's only chrome: the logo home, and who's playing. */
export function GameBar({
  go,
  username,
  onStartOver,
  onShell,
  onHelp,
  soundOn,
  onToggleSound,
}: {
  go: Go;
  username: string;
  onStartOver?: () => void;
  onShell: () => void;
  onHelp?: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
}) {
  return (
    <header className="game-bar">
      <Logo size={30} go={go} />
      <div className="game-bar-right">
        <button type="button" className="btn btn-secondary small" onClick={onShell}>
          Shell
        </button>
        {onHelp && (
          <button type="button" className="btn btn-secondary small" onClick={onHelp}>
            How to play
          </button>
        )}
        <button type="button" className="btn btn-secondary small" onClick={onToggleSound} aria-pressed={soundOn}>
          {soundOn ? "Sound on" : "Sound off"}
        </button>
        {onStartOver && (
          <button type="button" className="btn btn-secondary small" onClick={onStartOver}>
            Start over
          </button>
        )}
        {username && <span className="game-user">Hi, {username}</span>}
      </div>
    </header>
  );
}

const GITHUB_MARK =
  "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z";

export function Footer({ go }: { go: Go }) {
  return (
    <footer className="site-footer">
      <div className="wrap footer-inner">
        <div className="footer-brand">
          <Logo size={30} go={go} />
          <p>A 1990s virtual pet, rebuilt for 2026. Made at KCL FirstYearHack, Retro Remix track.</p>
        </div>
        <p className="footer-team">
          Made by <b>Kristina Seren</b>, <b>Ekaterina Gruzer</b> and <b>Anna Parker</b>
        </p>
        <div className="footer-logos">
          <a href="https://github.com/kwerui/KCL-FYH" target="_blank" rel="noreferrer" title="TAMA on GitHub">
            <svg width="22" height="22" viewBox="0 0 16 16" aria-hidden="true">
              <path d={GITHUB_MARK} fill="currentColor" />
            </svg>
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
