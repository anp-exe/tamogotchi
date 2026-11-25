import { BigLogo } from "./Brand";
import { PetSprite } from "./PetSprite";
import { RLExplainer } from "./RLExplainer";
import { MeadowScene } from "./MeadowScene";
import { ShellCluster } from "./Showcase";

type Props = {
  hatched: boolean;
  petName: string;
  onPlay: () => void;
  onHow: () => void;
  onPets: () => void;
};

const FEATURES: [string, string][] = [
  ["Real handheld rules", "Feed it, play, put the lights out, clean up after it and give it medicine, all with the device's own buttons."],
  ["Grows up for real", "Baby, child, teen, then an adult on day 3. How you raised it decides its adult form."],
  ["Lives in real time", "It gets hungry, poops and can fall ill even with the tab closed. Neglect it for about a day and it becomes a ghost, with one chance to revive it."],
  ["Talk to it", "Chat in Silly, Serious, Study or Companion mode, by typing or out loud."],
  ["It learns you", "A small Q-learning brain picks up your routine and starts suggesting what's next."],
  ["Study buddy", "Finish a focus session and your pet gets smarter too."],
  ["Make it yours", "Eight pixel pets, 23 shells and eight screen scenes."],
];

/** A little pixel-art play arrow. */
const HACKATHON: [string, string][] = [
  ["The event", "TAMA was made at KCL FirstYearHack 2026."],
  ["The track", "Retro Remix. We picked the 1990s Tamagotchi and asked what it would be like if it could actually get to know you."],
  ["What we built", "A virtual pet that lives in real time, talks back, listens and speaks, and uses reinforcement learning to learn your routine."],
  ["The team", "Kristina Seren, Ekaterina Gruzer and Anna Parker."],
  ["Built with", "React, TypeScript, Vite, Express, the Gemini API and the Web Speech API."],
];

/** A white box with a bobbing pet beside the heading and a short list underneath. */
function InfoBox({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div className="panel features">
      <h2>
        <span className="features-pet" aria-hidden="true">
          <PetSprite species="shroomi" evolution="buddy" plain className="fill" />
        </span>
        {title}
      </h2>
      <ul>
        {items.map(([name, text]) => (
          <li key={name}>
            <b>{name}:</b> {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 7 9" width="18" height="23" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M0 0h2v9H0zM2 1h2v7H2zM4 2h2v5H4zM6 3h1v3H6z" fill="currentColor" />
    </svg>
  );
}

export function HomePage({ hatched, petName, onPlay, onHow, onPets }: Props) {
  return (
    <>
      <section className="hero scene-hero">
        <MeadowScene />
        <div className="wrap hero-grid">
          <div className="panel play-card">
            <div className="play-head">
              <BigLogo withMark={false} />
              <img
                className="party-gif"
                src={`${import.meta.env.BASE_URL}pets-party.gif`}
                width={200}
                height={150}
                alt="The TAMA pets munching a rice ball, winking and bouncing about"
              />
            </div>
            <button type="button" className="btn btn-play" onClick={onPlay}>
              <PlayIcon />
              {hatched ? `Visit ${petName}` : "Play"}
            </button>
            <div className="play-links">
              <button type="button" className="btn btn-secondary" onClick={onPets}>
                Meet the pets
              </button>
              <button type="button" className="btn btn-secondary" onClick={onHow}>
                How it learns
              </button>
            </div>
            <p className="play-tagline">
              The Tamagotchi that uses{" "}
              <a
                href="#how"
                onClick={(e) => {
                  e.preventDefault();
                  onHow();
                }}
              >
                reinforcement learning to learn you
              </a>
              .
            </p>
          </div>
          <ShellCluster onClick={onPlay} />
        </div>
      </section>

      <section className="section home-features">
        <div className="wrap info-boxes">
          <InfoBox title="Features" items={FEATURES} />
          <InfoBox title="The hackathon" items={HACKATHON} />
        </div>
      </section>

      <section className="section home-learn" id="how">
        <div className="wrap">
          <RLExplainer />
        </div>
      </section>
    </>
  );
}
