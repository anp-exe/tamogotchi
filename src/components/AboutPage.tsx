import type { SpeciesId } from "../art/pets";
import { PetGallery, ShellGallery } from "./Galleries";
import { ScenePreview } from "./Showcase";

type Props = {
  hatched: boolean;
  species: SpeciesId;
  skinId: string;
  onPickSkin: (id: string) => void;
  onPlay: () => void;
};

export function AboutPage({ hatched, species, skinId, onPickSkin, onPlay }: Props) {
  return (
    <>
      <section className="section" id="pets">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow pixel">PETS</span>
            <h2>Who's in the egg?</h2>
            <p className="muted">Eight original pixel pets. Each one can grow into all three forms.</p>
          </div>
          <PetGallery yours={species} hatched={hatched} />
        </div>
      </section>

      <section className="section" id="shells">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow pixel">SHELLS</span>
            <h2>23 shells to choose from.</h2>
            <p className="muted">Pick a look for your device. Changes take effect instantly.</p>
          </div>
          <ShellGallery current={skinId} onPick={onPickSkin} />
        </div>
      </section>

      <section className="section" id="scenes">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow pixel">SCENES</span>
            <h2>Eight places to live.</h2>
          </div>
          <ScenePreview onClick={onPlay} />
        </div>
      </section>

    </>
  );
}
