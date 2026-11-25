import { useState, type RefObject } from "react";
import { ALL_SPECIES, type SpeciesId } from "../art/pets";
import { skinById } from "../art/skins";
import { EGG } from "../art/sprites";
import { USERNAME_MAX, cleanUsername } from "../game/player";
import { ShellGallery } from "./Galleries";
import { PixelArt } from "./PixelArt";
import { ShellArt } from "./ShellArt";

const STEPS = ["You", "Shell", "Egg"] as const;

type Props = {
  username: string;
  setUsername: (name: string) => void;
  skinId: string;
  onPickSkin: (id: string) => void;
  species: SpeciesId | "surprise";
  setSpecies: (s: SpeciesId | "surprise") => void;
  petName: string;
  setPetName: (name: string) => void;
  onDone: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
};

function Egg({ tint }: { tint?: string }) {
  return <PixelArt grid={EGG.grid} palette={tint ? { ...EGG.palette, L: tint } : EGG.palette} size={52} />;
}

/** Before the first hatch: pick a username, a shell and an egg, one at a time. */
export function GameSetup({ inputRef, ...p }: Props) {
  const [step, setStep] = useState(0);
  const nameOk = cleanUsername(p.username).length > 0;
  const next = () => (step < STEPS.length - 1 ? setStep(step + 1) : p.onDone());
  const canGo = step !== 0 || nameOk;

  return (
    <section className="panel setup" aria-label="Set up your pet">
      <ol className="setup-steps">
        {STEPS.map((label, i) => (
          <li key={label} className={i === step ? "on" : i < step ? "done" : ""}>
            <span className="pixel">{i + 1}</span> {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="setup-body">
          <h2>What's your name?</h2>
          <p className="muted">Your pet will call you this.</p>
          <input
            ref={inputRef}
            className="setup-input"
            value={p.username}
            maxLength={USERNAME_MAX}
            placeholder="Username"
            autoComplete="nickname"
            onChange={(e) => p.setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && nameOk && next()}
          />
        </div>
      )}

      {step === 1 && (
        <div className="setup-body">
          <h2>Pick a shell</h2>
          <div className="setup-shells">
            <div className="setup-preview">
              <ShellArt skin={skinById(p.skinId)} withFace />
              <b>{skinById(p.skinId).name}</b>
            </div>
            <ShellGallery current={p.skinId} onPick={p.onPickSkin} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="setup-body">
          <h2>Pick an egg</h2>
          <p className="muted">Each colour hides a different pet.</p>
          <div className="egg-grid" role="radiogroup" aria-label="Choose an egg">
            <button
              type="button"
              role="radio"
              aria-checked={p.species === "surprise"}
              className={`egg-pick ${p.species === "surprise" ? "on" : ""}`}
              onClick={() => p.setSpecies("surprise")}
            >
              <span className="egg-art surprise">
                <Egg />
                <i aria-hidden="true">?</i>
              </span>
              <span>Surprise</span>
            </button>
            {ALL_SPECIES.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={p.species === s.id}
                className={`egg-pick ${p.species === s.id ? "on" : ""}`}
                onClick={() => p.setSpecies(s.id)}
              >
                <span className="egg-art">
                  <Egg tint={s.accent} />
                </span>
                <span>{s.name}</span>
              </button>
            ))}
          </div>
          <label className="setup-field">
            <span>Name your pet (optional)</span>
            <input
              value={p.petName}
              maxLength={12}
              placeholder="Pet name"
              onChange={(e) => p.setPetName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && next()}
            />
          </label>
        </div>
      )}

      <div className="setup-nav">
        {step > 0 ? (
          <button type="button" className="btn btn-secondary" onClick={() => setStep(step - 1)}>
            Back
          </button>
        ) : (
          <span />
        )}
        <button type="button" className={`btn ${step === 2 ? "btn-play" : "btn-primary"}`} onClick={next} disabled={!canGo}>
          {step === 2 ? "Hatch it" : "Next"}
        </button>
      </div>
    </section>
  );
}
