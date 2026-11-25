import { useState } from "react";
import { SPECIES } from "../art/pets";
import { FORM_INFO, STAGE_INFO, growthProgress, lifeStage, msUntilCanEvolve, formatTimeUntil, type LifeStage } from "../game/evolutionLogic";
import { resolvePetName, type PetState } from "../game/petState";
import { PetSprite } from "./PetSprite";
import { PixelArt } from "./PixelArt";
import { BOLT, HEART_CLIP, RICE_BALL, emptyOf, type Sprite } from "../art/sprites";

function IconMeter({ value, label, sprite }: { value: number; label: string; sprite: Sprite }) {
  const on = Math.round(value / 20);
  const empty = emptyOf(sprite);
  return (
    <div className="stat-row" aria-label={`${label} ${Math.round(value)} out of 100`}>
      <span className="stat-label">{label}</span>
      <span className="icon-meter">
        {Array.from({ length: 5 }, (_, i) => {
          const s = i < on ? sprite : empty;
          return <PixelArt key={i} grid={s.grid} palette={s.palette} size={22} className={i < on ? "on" : ""} />;
        })}
      </span>
    </div>
  );
}

function Bar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div className="trait-row">
      <span className="stat-label">{label}</span>
      <span className="seg-bar" style={{ ["--c" as string]: color }}>
        <i style={{ width: `${value}%` }} />
      </span>
      <span className="trait-num">{Math.round(value)}</span>
    </div>
  );
}

export function PetSummary({ state, status, stage }: { state: PetState; status: string; stage: LifeStage }) {
  const petName = resolvePetName(state.petName, state.species);
  return (
    <section className="pet-summary" aria-label="Pet overview">
      <div className="pet-summary-head">
        <h1 className="pet-name">{petName}</h1>
        <span className="pill pixel">
          {state.dead ? "GHOST" : (state.evolution === "hatchling" ? STAGE_INFO[stage].name : FORM_INFO[state.evolution].name).toUpperCase()}
        </span>
        {state.sick && !state.dead && <span className="pill pixel sick-tag">SICK</span>}
      </div>
      <div className="needs pet-summary-needs">
        <IconMeter label="FULL" value={100 - state.hunger} sprite={RICE_BALL} />
        <IconMeter label="ENERGY" value={state.energy} sprite={BOLT} />
        <IconMeter label="HAPPY" value={state.happiness} sprite={HEART_CLIP} />
      </div>
      {status && <p className="pet-summary-status" role="status">{status}</p>}
    </section>
  );
}

export function PetDetails({
  state,
  brainNote,
  onReset,
  age,
  demo,
  now,
}: {
  state: PetState;
  brainNote: string;
  onReset: (keepBrain: boolean) => void;
  age: string;
  demo: boolean;
  now: Date;
}) {
  const [confirm, setConfirm] = useState(false);
  const [keepBrain, setKeepBrain] = useState(false);
  const progress = growthProgress(state.bornAt, demo, now.getTime());
  const stage = lifeStage(state.bornAt, demo, now.getTime());
  const msLeft = state.hatched ? msUntilCanEvolve(state.bornAt, demo, now.getTime()) : 0;
  return (
    <section className="card status-card" aria-label="Pet status">
      <div className="pet-row">
        <div className="mini-screen">
          <PetSprite species={state.species} evolution={state.evolution} eyesClosed={state.asleep} className="fill" />
        </div>
        <div>
          <h3 className="pet-name">{state.petName}</h3>
          <p className="pet-sub pixel">
            {state.evolution === "hatchling" ? STAGE_INFO[stage].name : FORM_INFO[state.evolution].name} {SPECIES[state.species].name}, {age}
          </p>
        </div>
      </div>
      <div className="needs">
        <IconMeter label="FULL" value={100 - state.hunger} sprite={RICE_BALL} />
        <IconMeter label="ENERGY" value={state.energy} sprite={BOLT} />
        <IconMeter label="HAPPY" value={state.happiness} sprite={HEART_CLIP} />
      </div>
      <div className="traits">
        <Bar label="CURIOUS" value={state.curiosity} color="#6F9BE0" />
        <Bar label="PLAYFUL" value={state.playfulness} color="#FFB13D" />
        <Bar label="FRIEND" value={state.friendship} color="#F583B4" />
      </div>
      {(state.evolution === "hatchling" || state.evolution === "egg") && (
        <div className="evo-progress" aria-label="Progress to adulthood">
          <span>Growing</span>
          <span className="seg-bar" style={{ ["--c" as string]: "#8F7BE0" }}>
            <i style={{ width: `${progress * 100}%` }} />
          </span>
        </div>
      )}
      {state.hatched && (state.evolution === "hatchling" || state.evolution === "egg") && msLeft > 0 && (
        <p className="muted small grow-up-note">
          Grows up in <b>{formatTimeUntil(msLeft)}</b>
        </p>
      )}
      {state.hatched && (
        <p className="muted small">
          Care mistakes: <b>{state.careMistakes}</b>
          {state.revived ? ", used its one revive" : ""}
        </p>
      )}
      <p className="brain-note">
        <span className="pixel">BRAIN</span> {brainNote}
      </p>
      {confirm ? (
        <div className="reset-confirm" role="alertdialog" aria-label="Get a new pet">
          <p>
            <b>Say goodbye to {state.petName}?</b> You'll get a fresh egg and can pick a new pet. Your shell stays.
          </p>
          <label className="toggle">
            <input type="checkbox" checked={keepBrain} onChange={(e) => setKeepBrain(e.target.checked)} />
            <span>Keep what it learned about my habits and routine</span>
          </label>
          <div className="row-gap">
            <button type="button" className="pixel-btn" onClick={() => onReset(keepBrain)}>
              YES, NEW EGG
            </button>
            <button type="button" className="pixel-btn plain" onClick={() => setConfirm(false)}>
              KEEP {state.petName.toUpperCase()}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="pixel-btn new-pet-btn" onClick={() => setConfirm(true)}>
          NEW EGG
        </button>
      )}
    </section>
  );
}
