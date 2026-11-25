import { useCallback, useEffect, useRef, useState } from "react";
import "@fontsource/fredoka/500.css";
import "@fontsource/fredoka/600.css";
import "@fontsource/fredoka/700.css";
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/700.css";
import "@fontsource/pixelify-sans/400.css";
import "@fontsource/pixelify-sans/700.css";
import "./styles/retro.css";

import { generatePetReply } from "./ai/client";
import type { PetEmotion, PetMode } from "./ai/types";
import { SPECIES, SPECIES_IDS, type SpeciesId } from "./art/pets";
import { loadSkinId, saveSkinId, skinById } from "./art/skins";
import { SCENES, SceneArt, loadSceneId, saveSceneId, type SceneId } from "./art/scenes";
import {
  breakTask, checkAnswer, guess, newGuessGame, quizQuestion, tellJoke, type GuessGame,
} from "./game/activities";
import {
  applyCareAction, applyConversationBonus, applyDelta, canPlay, canRevive, revivePet, type CareAction,
} from "./game/careLogic";
import { completeStudySession, type StudyTimer as StudyTimerState } from "./game/studyTimer";
import { FORM_INFO, STAGE_INFO, lifeStage, type Trait } from "./game/evolutionLogic";
import { beep, isSoundOn, setSoundOn as saveSoundOn } from "./sound/beeps";
import { hatchPet, MAX_FACTS, resetPetState, savePetState, type PetState } from "./game/petState";
import { liveUntil, loadLivePet, projectedDeath } from "./game/life";
import {
  RL_ACTIONS, bestGuess, clearRLState, describeContext, expire, loadRLState, nudgeLine, observe, pendingAction,
  saveRLState, suggest, type RLAction, type RLState,
} from "./game/rl";
import { chatMemories, cleanUsername, loadUsername, saveUsername } from "./game/player";
import { useSpeech } from "./voice/useSpeech";
import {
  ageText, clearHabits, clockText, isNightTime, loadHabits, recordHabit, saveHabits, type Habits,
} from "./game/clock";

import { ActivityPanel } from "./components/ActivityPanel";
import { BrainCard } from "./components/BrainCard";
import { Footer, GameBar, Header, type Page } from "./components/Brand";
import { Popup } from "./components/Popup";
import { ChatPanel, type ChatMsg } from "./components/ChatPanel";
import { EvolutionCard } from "./components/EvolutionCard";
import { HabitCard } from "./components/HabitCard";
import { ShellGallery } from "./components/Galleries";
import { StickerRail } from "./components/StickerRail";
import { AboutPage } from "./components/AboutPage";
import { HomePage } from "./components/HomePage";
import { LcdScene, type Fx, type FxKind } from "./components/LcdScene";
import { MODES } from "./components/ModeSelector";
import { PetDetails, PetSummary } from "./components/StatusMeters";
import { GameSetup } from "./components/GameSetup";
import { ResetPanel } from "./components/ResetPanel";
import { Tutorial } from "./components/Tutorial";
import { openGame } from "./components/openGame";
import { ICONS, TamagotchiShell, type IconId } from "./components/TamagotchiShell";

const TICK_MS = 1000;
const LIFE_CHECK_MS = 5_000; // how often the open game catches the pet up on real time
const TIMING = {
  normal: { nudgeEvery: 45_000, window: 30_000 },
  fast: { nudgeEvery: 12_000, window: 15_000 },
};
const ACTION_WORD: Record<RLAction, string> = { feed: "feed it", play: "play", rest: "let it rest", chat: "chat" };

let msgId = 1;

/** "Left alone from now, Toasty would die around 9:30 pm tomorrow." */
function deathNote(pet: PetState, demo: boolean): string {
  const at = projectedDeath(pet, Date.now(), demo);
  if (at === null) return "";
  const when = new Date(at);
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const day =
    when.toDateString() === today.toDateString()
      ? "today"
      : when.toDateString() === tomorrow.toDateString()
        ? "tomorrow"
        : when.toLocaleDateString(undefined, { weekday: "long" });
  const time = when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `Left alone from now, ${pet.petName} would die around ${time} ${day}.`;
}

export default function App() {
  const [pet, setPet] = useState<PetState>(loadLivePet);
  const [rl, setRl] = useState<RLState>(loadRLState);
  const [skinId, setSkinId] = useState(loadSkinId);
  const [sceneId, setSceneId] = useState<SceneId>(loadSceneId);
  const [emotion, setEmotion] = useState<PetEmotion>("happy");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fx, setFx] = useState<Fx | null>(null);
  const [view, setView] = useState<"pet" | "stats">("pet");
  const [selected, setSelected] = useState(0);
  const [line, setLine] = useState<string>("");
  const [demo, setDemo] = useState(() => localStorage.getItem("tama_demo") === "1");
  const [lastOutcome, setLastOutcome] = useState("Waiting for its first suggestion.");
  const [game, setGame] = useState<GuessGame | null>(null);
  const [quiz, setQuiz] = useState<{ q: string; a: string } | null>(null);
  const [hatchName, setHatchName] = useState("");
  const [hatchSpecies, setHatchSpecies] = useState<SpeciesId | "surprise">("surprise");
  const [hatching, setHatching] = useState(false);
  const [username, setUsername] = useState(loadUsername);
  const [setupDone, setSetupDone] = useState(false);
  const [deathChoice, setDeathChoice] = useState(0);
  const [soundOn, setSoundOn] = useState(isSoundOn);
  const [guide, setGuide] = useState(false);
  const usernameRef = useRef(username);
  usernameRef.current = username;
  const [eggTaps, setEggTaps] = useState(0);
  const [habits, setHabits] = useState<Habits>(loadHabits);
  const [now, setNow] = useState(() => new Date());
  const nightRef = useRef<boolean | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [chatSource, setChatSource] = useState<"gemini" | "fallback" | null>(null);
  const [page, setPage] = useState<Page>(() =>
    window.location.hash.startsWith("#/play") ? "play" :
    window.location.hash.startsWith("#/about") ? "about" : "home"
  );
  const scrollTarget = useRef<string | null>(null);
  // Only the game tab runs the pet. Other tabs (home, about) just show what's saved.
  const pageRef = useRef(page);
  pageRef.current = page;
  const [panel, setPanel] = useState<null | "talk" | "stats" | "style" | "attention" | "reset">(null);
  const closePanel = useCallback(() => setPanel(null), []);

  const nameRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const deviceRef = useRef<HTMLDivElement>(null);
  const petRef = useRef(pet);
  petRef.current = pet;
  const rlRef = useRef(rl);
  rlRef.current = rl;
  const demoRef = useRef(demo);
  demoRef.current = demo;
  const lastDecay = useRef(Date.now());
  const lastPat = useRef(0);
  const emotionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevEvolution = useRef(pet.evolution);
  const sendMessageRef = useRef<(text: string) => void>(() => undefined);

  const onFinalTranscript = useCallback((text: string) => {
    sendMessageRef.current(text);
  }, []);
  const {
    isListening,
    isRecognitionSupported,
    isSynthesisSupported,
    recognisedText,
    error: speechError,
    startListening,
    stopListening,
    cancelListening,
    speak,
    cancelSpeech,
    isMuted,
    setMuted,
    voices,
    voicePreferences,
    setVoiceURI,
    setVoicePitch,
    setVoiceRate,
    useCutePixrlVoice,
    previewVoice,
    clearError,
  } = useSpeech({ language: "en-GB", onFinalTranscript });
  const skin = skinById(skinId);
  const stage = lifeStage(pet.bornAt, demo, now.getTime());

  useEffect(() => {
    if (pageRef.current === "play") savePetState(pet);
  }, [pet]);
  useEffect(() => {
    if (pageRef.current === "play") saveRLState(rl);
  }, [rl]);
  useEffect(() => {
    if (pageRef.current === "play") saveHabits(habits);
  }, [habits]);

  /** Pick up whatever the game tab saved: on entering the game, and live in the other tabs. */
  const reloadSaved = useCallback(() => {
    setPet(loadLivePet());
    setRl(loadRLState());
    setHabits(loadHabits());
    setSkinId(loadSkinId());
    setUsername(loadUsername());
  }, []);

  useEffect(() => {
    const onStorage = () => {
      if (pageRef.current === "play") setSkinId(loadSkinId());
      else reloadSaved();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [reloadSaved]);

  // Real clock: refresh every 15s, and follow a real bedtime (asleep 22:00 to 07:00).
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow(d);
      const night = isNightTime(d);
      const was = nightRef.current;
      nightRef.current = night;
      const p = petRef.current;
      if (pageRef.current !== "play" || !p.hatched || was === night) return;
      if (night && !p.asleep) {
        setPet((s) => ({ ...s, asleep: true }));
        setLine("Yawn... it's late. Night night!");
      } else if (!night && was !== null && p.asleep) {
        setPet((s) => ({ ...s, asleep: false }));
        setLine("Good morning! It's a new day.");
      }
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  const playFx = useCallback((kind: FxKind) => setFx({ kind, id: Date.now() + Math.random() }), []);

  const feel = useCallback((e: PetEmotion, ms = 2600) => {
    setEmotion(e);
    if (emotionTimer.current) clearTimeout(emotionTimer.current);
    emotionTimer.current = setTimeout(() => setEmotion("happy"), ms);
  }, []);

  const petSays = useCallback(
    (text: string, opts: { chat?: boolean; voice?: boolean } = {}) => {
      setLine(text);
      if (opts.chat) setMessages((m) => [...m, { id: msgId++, role: "pet", text }]);
      if (opts.voice) speak(text);
    },
    [speak],
  );

  // Mood follows needs when nothing else is going on.
  useEffect(() => {
    if (emotionTimer.current) return;
    if (pet.sick) setEmotion("sad");
    else if (pet.hunger > 75) setEmotion("hungry");
    else if (pet.energy < 20) setEmotion("sleepy");
    else if (pet.happiness < 30) setEmotion("sad");
    else setEmotion("happy");
  }, [pet.hunger, pet.energy, pet.happiness, pet.sick]);

  // One ticker for time passing and the RL suggestion loop (refs avoid the old reset-every-render bug).
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const p = petRef.current;
      if (!p.hatched || p.dead || pageRef.current !== "play") return;

      if (now - lastDecay.current >= LIFE_CHECK_MS) {
        lastDecay.current = now;
        setPet((s) => liveUntil(s, now, demoRef.current));
      }

      const t = demoRef.current ? TIMING.fast : TIMING.normal;
      const brain = rlRef.current;
      if (brain.pending && now - brain.pending.at > t.window) {
        const missed = RL_ACTIONS[brain.pending.action];
        setRl(expire(brain));
        setLastOutcome(`-0.5: you didn't ${ACTION_WORD[missed]} after it asked. Noted.`);
        setLine("");
      } else if (!brain.pending && !p.asleep && now - brain.lastNudgeAt > t.nudgeEvery) {
        const s = suggest(brain, p);
        setRl(s.rl);
        setLine(nudgeLine(s.action, p.mode));
        beep("call");
        setLastOutcome(
          s.explored
            ? `Exploring: trying "${s.action}" to see what you think.`
            : `Its best guess: you usually ${ACTION_WORD[s.action]} when it's ${describeContext(s.rl.pending!.context).join(", ").toLowerCase()}.`,
        );
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Growing up: announce each new stage (becoming an adult is announced as its new form).
  const prevStage = useRef(stage);
  const prevBorn = useRef(pet.bornAt);
  useEffect(() => {
    const prev = prevStage.current;
    const newPet = prevBorn.current !== pet.bornAt; // just hatched: being a baby isn't news
    prevStage.current = stage;
    prevBorn.current = pet.bornAt;
    if (newPet || prev === stage || !pet.hatched || pet.dead || stage === "adult" || pageRef.current !== "play") return;
    const msg = `${petRef.current.petName} grew into a ${STAGE_INFO[stage].name.toLowerCase()}!`;
    beep("grow");
    playFx("evolve");
    petSays(msg, { chat: true });
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, [stage, pet.hatched, pet.dead, pet.bornAt, playFx, petSays]);

  // Calls for attention: a new poop, falling ill, or getting dangerously neglected.
  const prevPoops = useRef(pet.poops);
  const prevSick = useRef(pet.sick);
  const critical = pet.hatched && !pet.dead && pet.hunger >= 85 && pet.happiness <= 20;
  const wasCritical = useRef(critical);
  useEffect(() => {
    const morePoop = pet.poops > prevPoops.current;
    const gotSick = pet.sick && !prevSick.current;
    const nowCritical = critical && !wasCritical.current;
    prevPoops.current = pet.poops;
    prevSick.current = pet.sick;
    wasCritical.current = critical;
    if (pageRef.current !== "play" || pet.dead) return;
    const name = petRef.current.petName;
    if (gotSick) {
      beep("alert");
      setLine(`${name} doesn't feel well... it needs medicine.`);
    } else if (nowCritical) {
      beep("alert");
      setLine(`${name} is starving and miserable. Feed it and play with it soon!`);
    } else if (morePoop) {
      beep("call");
      setLine("Oops... I made a mess. Clean it up?");
    }
  }, [pet.poops, pet.sick, pet.dead, critical]);

  // Death: the pet turns into a ghost and the screen offers the one revive.
  useEffect(() => {
    if (!pet.dead || pageRef.current !== "play") return;
    setPanel(null);
    setView("pet");
    setDeathChoice(canRevive(petRef.current) ? 0 : 1);
    setRl((r) => ({ ...r, pending: null }));
    setLine(`${petRef.current.petName} didn't make it... it's a little ghost now.`);
    beep("death");
  }, [pet.dead]);

  // Evolution announcements.
  useEffect(() => {
    const prev = prevEvolution.current;
    prevEvolution.current = pet.evolution;
    if (prev === pet.evolution || !pet.hatched || pageRef.current !== "play") return;
    if (pet.evolution === "egg" || pet.evolution === "hatchling") return;
    const msg = `${pet.petName} evolved into a ${FORM_INFO[pet.evolution].name}!`;
    playFx("evolve");
    beep("grow");
    feel("excited", 3000);
    petSays(msg, { chat: true, voice: true });
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, [pet.evolution, pet.hatched, pet.petName, playFx, feel, petSays]);

  /** Tell the brain what you did. */
  const teach = useCallback((did: RLAction) => {
    const before = petRef.current;
    const { rl: next, reward } = observe(rlRef.current, did, before);
    setRl(next);
    setHabits((h) => recordHabit(h, did));
    if (reward === null) setLastOutcome(`Habit noted: you chose to ${ACTION_WORD[did]} here.`);
    else if (reward > 0) setLastOutcome(`+1: you did what it suggested (${did}). It's learning!`);
    else setLastOutcome(`${reward}: it suggested something else, you chose ${did}.`);
    if (reward !== null) setLine("");
  }, []);

  const doCare = useCallback(
    (action: CareAction) => {
      const p = petRef.current;
      if (!p.hatched || p.dead) return;
      if (action === "clean") {
        if (p.poops === 0) {
          petSays("Nothing to clean up!");
          return;
        }
        setPet((s) => applyCareAction(s, "clean", demoRef.current));
        beep("clean");
        feel("happy");
        petSays("Ahh, much better!");
        return;
      }
      if (action === "medicine") {
        setPet((s) => applyCareAction(s, "medicine", demoRef.current));
        beep("medicine");
        feel("sad", 1500);
        petSays(p.sick ? "Bleh! ...but I feel better already." : "Yuck! I'm not even sick!");
        return;
      }
      if (action === "pat") {
        if (Date.now() - lastPat.current < 500) return;
        lastPat.current = Date.now();
        setPet((s) => applyCareAction(s, "pat", demoRef.current));
        playFx("pat");
        beep("pat");
        feel("happy");
        if (Math.random() < 0.35) petSays(["Hehe!", "More pats please.", "I like you.", "Purr..."][Math.floor(Math.random() * 4)]);
        return;
      }
      if (action === "rest" && p.asleep) {
        setPet((s) => ({ ...s, asleep: false }));
        petSays("Good morning!");
        return;
      }
      if (action === "feed" && p.hunger < 8) {
        feel("sad", 1500);
        petSays("I'm stuffed! No more.");
        teach("feed");
        return;
      }
      if (action === "play" && !canPlay(p)) {
        feel("sad", 1500);
        petSays("Too tired to play...");
        teach("play");
        return;
      }
      setPet((s) => applyCareAction(s, action, demoRef.current));
      teach(action);
      playFx(action);
      beep(action === "feed" ? "eat" : action === "rest" ? "sleep" : "play");
      if (action === "feed") feel("happy", 2800);
      if (action === "play") feel("excited", 2800);
      if (action === "rest") petSays("Night night...");
    },
    [feel, petSays, playFx, teach],
  );

  // ---- Hatching ----
  const hatch = useCallback(() => {
    if (hatching) return;
    const species: SpeciesId =
      hatchSpecies === "surprise" ? SPECIES_IDS[Math.floor(Math.random() * SPECIES_IDS.length)] : hatchSpecies;
    const name = hatchName.trim() || SPECIES[species].name;
    setHatching(true);
    setEggTaps(2);
    setTimeout(() => {
      setPet((s) => hatchPet(s, name, species));
      prevEvolution.current = "hatchling";
      setHatching(false);
      setEggTaps(0);
      playFx("hatch");
      beep("hatch");
      feel("excited", 3000);
      lastDecay.current = Date.now();
      setRl((r) => ({ ...r, lastNudgeAt: Date.now() }));
      setTimeout(() => setGuide(true), 1800); // the guide runs for every new egg
      const you = usernameRef.current;
      const hello = `Hi${you ? ` ${you}` : ""}! I'm ${name}, a baby ${SPECIES[species].name}. Look after me and I'll grow into someone special!`;
      setMessages([{ id: msgId++, role: "pet", text: hello }]);
      petSays(hello, { voice: true });
    }, 1400);
  }, [hatchName, hatchSpecies, hatching, playFx, feel, petSays]);

  /** Tap the egg: it wobbles and cracks, and hatches on the third tap. */
  const tapEgg = useCallback(() => {
    if (hatching || petRef.current.hatched || !setupDone) return;
    beep("tap");
    setEggTaps((t) => {
      const next = t + 1;
      if (next >= 3) setTimeout(hatch, 0);
      else setLine(next === 1 ? "Something's moving in there!" : "It's cracking!");
      return Math.min(next, 2);
    });
  }, [hatch, hatching, setupDone]);

  // ---- Pages (hash routes: #/ and #/play) ----
  useEffect(() => {
    const onHash = () => {
      const next: Page =
        window.location.hash.startsWith("#/play") ? "play" :
        window.location.hash.startsWith("#/about") ? "about" : "home";
      if (next === "play" && pageRef.current !== "play") {
        reloadSaved();
        lastDecay.current = Date.now();
      }
      setPage(next);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [reloadSaved]);

  useEffect(() => {
    const id = scrollTarget.current;
    scrollTarget.current = null;
    requestAnimationFrame(() => {
      const el = id ? document.getElementById(id) : null;
      if (el) el.scrollIntoView({ behavior: "smooth" });
      else window.scrollTo({ top: 0 });
      if (page === "play" && !id && !petRef.current.hatched) setTimeout(() => nameRef.current?.focus(), 300);
    });
  }, [page]);

  const go = useCallback((target: Page, section?: string) => {
    if (target === "play" && page !== "play") {
      openGame();
      return;
    }
    if (target === "play" && section === "shells") {
      if (page !== "play") {
        window.location.hash = "#/play";
        setPage("play");
      }
      setPanel("style");
      return;
    }
    const hash = target === "play" ? "#/play" : target === "about" ? "#/about" : "#/";
    if (target === page) {
      const el = section ? document.getElementById(section) : null;
      if (el) el.scrollIntoView({ behavior: "smooth" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
      if (target === "play" && !section && !petRef.current.hatched) nameRef.current?.focus();
      return;
    }
    scrollTarget.current = section ?? null;
    window.location.hash = hash;
    setPage(target);
  }, [page]);

  const goToPet = useCallback(() => go("play"), [go]);

  // ---- Chat ----
  const setMode = useCallback(
    (m: PetMode) => {
      setPet((s) => ({ ...s, mode: m }));
      setGame(null);
      setQuiz(null);
      const hint = MODES.find((x) => x.id === m)?.hint ?? "";
      if (petRef.current.hatched) petSays(`${MODES.find((x) => x.id === m)?.label} mode! ${hint}.`);
    },
    [petSays],
  );

  const sendMessage = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      const p = petRef.current;
      if (!text || loading || !p.hatched) return;
      setInput("");
      setMessages((m) => [...m, { id: msgId++, role: "user", text }]);
      teach("chat");
      if (p.asleep) setPet((s) => ({ ...s, asleep: false }));

      // Local activities answer instantly.
      const n = Number(text);
      if (p.mode === "silly" && game && !game.done && Number.isInteger(n) && n >= 1 && n <= 10) {
        const r = guess(game, n);
        setGame(r.game);
        petSays(r.line, { chat: true, voice: true });
        if (r.won) {
          setPet((s) => applyDelta(s, { playfulness: +10, happiness: +8 }, demoRef.current));
          playFx("win");
          feel("excited");
        }
        return;
      }
      if (p.mode === "study" && quiz) {
        const right = checkAnswer(text, quiz.a);
        setQuiz(null);
        petSays(right ? `Yes! ${quiz.a}. Brain +1!` : `Close! The answer is: ${quiz.a}.`, { chat: true, voice: true });
        setPet((s) => applyDelta(s, { curiosity: right ? +8 : +3, happiness: right ? +5 : 0 }, demoRef.current));
        feel(right ? "excited" : "thinking");
        return;
      }

      if (p.mode === "serious" && /^break this task into steps:/i.test(text)) {
        petSays(breakTask(text.replace(/^break this task into steps:/i, "")), { chat: true, voice: true });
        setPet((s) => applyDelta(s, { curiosity: +3, happiness: +2 }, demoRef.current));
        feel("thinking");
        return;
      }

      setLoading(true);
      feel("thinking", 20000);
      try {
        const res = await generatePetReply({
          message: text,
          mode: p.mode,
          petName: p.petName,
          personality: { curiosity: p.curiosity, playfulness: p.playfulness, friendship: p.friendship },
          memories: chatMemories(usernameRef.current, p.savedFacts),
          hunger: p.hunger,
          energy: p.energy,
          happiness: p.happiness,
        });
        setChatSource(res.source);
        petSays(res.response.reply, { chat: true, voice: true });
        feel(res.response.emotion, 3200);
        setPet((s) => applyConversationBonus(s, s.mode, demoRef.current));
        if (res.response.suggestedAction) {
          const hint: Record<string, string> = { feed: "food", play: "a play session", rest: "a rest" };
          setTimeout(() => setLine(`${petRef.current.petName} could use some ${hint[res.response.suggestedAction!]}.`), 3400);
        }
      } catch {
        petSays("...bzzt... my antenna is fuzzy. Try again?", { chat: true });
        feel("sad");
      } finally {
        setLoading(false);
      }
    },
    [loading, game, quiz, teach, petSays, playFx, feel],
  );

  useEffect(() => {
    sendMessageRef.current = (text) => void sendMessage(text);
  }, [sendMessage]);

  const onMic = useCallback(() => {
    if (isListening) stopListening();
    else {
      clearError();
      void startListening();
    }
  }, [isListening, startListening, stopListening, clearError]);

  const remember = useCallback(
    (fact: string) => {
      setPet((s) =>
        s.savedFacts.includes(fact) || s.savedFacts.length >= MAX_FACTS
          ? s
          : applyDelta({ ...s, savedFacts: [...s.savedFacts, fact] }, { friendship: +3 }, demoRef.current),
      );
      petSays("Got it. I'll remember that.", { chat: true });
    },
    [petSays],
  );

  const forget = useCallback(
    (fact: string | null) => {
      setPet((s) => ({ ...s, savedFacts: fact ? s.savedFacts.filter((f) => f !== fact) : [] }));
      petSays(fact ? "Forgotten." : "All forgotten. Fresh start!", { chat: true });
    },
    [petSays],
  );

  // ---- Activities ----
  const onJoke = useCallback(() => {
    petSays(tellJoke(), { chat: true, voice: true });
    setPet((s) => applyDelta(s, { playfulness: +3, happiness: +3 }, demoRef.current));
    feel("excited");
  }, [petSays, feel]);

  const onStartGame = useCallback(() => {
    setGame(newGuessGame());
    petSays("I'm thinking of a number from 1 to 10. Guess!", { chat: true, voice: true });
    feel("excited");
  }, [petSays, feel]);

  const onGuess = useCallback((n: number) => void sendMessage(String(n)), [sendMessage]);

  const onBreakTask = useCallback((task: string) => void sendMessage(`Break this task into steps: ${task}`), [sendMessage]);

  const onStudyDone = useCallback((timer: StudyTimerState) => {
    setPet((s) => completeStudySession(timer, s).pet);
    playFx("win");
    feel("excited");
    petSays("Focus session complete! You're getting so smart.", { chat: true, voice: true });
  }, [playFx, feel, petSays]);

  const onQuiz = useCallback(() => {
    const q = quizQuestion();
    setQuiz(q);
    petSays(q.q, { chat: true, voice: true });
    feel("thinking", 6000);
  }, [petSays, feel]);

  const onBoost = useCallback((t: Trait) => {
    setPet((s) => applyDelta(s, { [t]: +15 }, demoRef.current));
  }, []);

  const setDemoAndSave = useCallback((v: boolean) => {
    setDemo(v);
    localStorage.setItem("tama_demo", v ? "1" : "0");
  }, []);

  const askNow = useCallback(() => {
    setRl((r) => ({ ...r, lastNudgeAt: 0 }));
  }, []);

  const doReset = useCallback((keepBrain = false) => {
    setPet(resetPetState());
    if (keepBrain) setRl((r) => ({ ...r, pending: null, lastNudgeAt: Date.now() }));
    else {
      setRl(clearRLState());
      setHabits(clearHabits());
    }
    setEggTaps(0);
    prevEvolution.current = "egg";
    setMessages([]);
    setGame(null);
    setQuiz(null);
    setHatchName("");
    setLine("");
    setView("pet");
    setLastOutcome(keepBrain ? "Kept what it learned about your habits." : "Waiting for its first suggestion.");
    setHatchSpecies("surprise");
    setSetupDone(false);
    setChatSource(null);
    setEmotion("happy");
    cancelListening();
    cancelSpeech();
    clearError();
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => nameRef.current?.focus(), 350);
  }, [cancelListening, cancelSpeech, clearError]);

  // ---- Hardware buttons ----
  const runIcon = useCallback(
    (id: IconId) => {
      const p = petRef.current;
      if (!p.hatched) {
        tapEgg();
        return;
      }
      setView("pet");
      switch (id) {
        case "feed":
        case "play":
        case "rest":
        case "clean":
        case "medicine":
          doCare(id);
          break;
        case "talk":
          setPanel("talk");
          break;
        case "stats":
          setPanel("stats");
          break;
        case "attention":
          setPanel("attention");
          break;
      }
    },
    [doCare, tapEgg],
  );

  const onIcon = useCallback(
    (id: IconId, i: number) => {
      if (petRef.current.dead) return;
      setSelected(i);
      runIcon(id);
    },
    [runIcon],
  );

  /** Revive (once) or start over with a new egg that keeps what the brain learned. */
  const chooseAfterDeath = useCallback(
    (choice: number) => {
      const p = petRef.current;
      if (!p.dead) return;
      if (choice === 0 && canRevive(p)) {
        setPet((s) => revivePet(s));
        lastDecay.current = Date.now();
        playFx("hatch");
        beep("revive");
        feel("excited", 3000);
        const you = usernameRef.current;
        petSays(`I'm back! Thanks for not giving up on me${you ? `, ${you}` : ""}.`, { voice: true });
      } else {
        doReset(true);
      }
    },
    [doReset, feel, petSays, playFx],
  );

  const onButton = useCallback(
    (b: "A" | "B" | "C") => {
      beep(b === "A" ? "press" : b === "B" ? "select" : "back");
      if (petRef.current.dead) {
        if (b === "A") setDeathChoice((c) => (canRevive(petRef.current) ? 1 - c : 1));
        else if (b === "B") chooseAfterDeath(deathChoice);
        return;
      }
      if (b === "A") setSelected((s) => (s + 1) % ICONS.length);
      else if (b === "B") runIcon(ICONS[selected].id);
      else if (panel) setPanel(null);
      else if (view === "stats") setView("pet");
      else if (petRef.current.hatched) doCare("pat");
      else tapEgg();
    },
    [runIcon, selected, view, panel, doCare, tapEgg, chooseAfterDeath, deathChoice],
  );

  // Keyboard: arrows / A B C when not typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (page !== "play" || panel || guide || (!pet.hatched && !setupDone)) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "a") onButton("A");
      else if (k === "b") onButton("B");
      else if (k === "c") onButton("C");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onButton, page, panel, guide, pet.hatched, setupDone]);

  const pickSkin = useCallback((id: string) => {
    setSkinId(id);
    saveSkinId(id);
  }, []);

  const finishSetup = useCallback(() => {
    const name = cleanUsername(usernameRef.current);
    setUsername(name);
    saveUsername(name);
    setSetupDone(true);
    setEggTaps(0);
    setLine(`Hi ${name}! Tap the egg three times to hatch it.`);
  }, []);

  const pending = pendingAction(rl);
  const guessNow = bestGuess(rl, pet);
  const brainNote = !pet.hatched
    ? ""
    : rl.episodes + rl.visits.flat().reduce((a, b) => a + b, 0) === 0
      ? `${pet.petName} is still figuring you out. Care for it and it will learn your habits.`
      : guessNow.values.some((v) => v > 0.15)
        ? `${pet.petName} has learned you usually ${ACTION_WORD[guessNow.best]} when it's ${describeContext(guessNow.context)
            .join(", ")
            .toLowerCase()}.`
        : `${pet.petName} is learning what you do when it's ${describeContext(guessNow.context).join(", ").toLowerCase()}.`;

  return (
    <div className={`page page-${page}`} id="top">
      {page === "play" ? (
        <GameBar
          go={go}
          username={username}
          onStartOver={pet.hatched ? () => setPanel("reset") : undefined}
          onShell={() => setPanel("style")}
          onHelp={pet.hatched && !pet.dead ? () => setGuide(true) : undefined}
          soundOn={soundOn}
          onToggleSound={() => {
            saveSoundOn(!soundOn);
            setSoundOn(!soundOn);
            if (!soundOn) beep("select");
          }}
        />
      ) : <Header page={page} go={go} hatched={pet.hatched} />}

      <main>
        {page === "home" ? (
          <HomePage
            hatched={pet.hatched}
            petName={pet.petName}
            onPlay={goToPet}
            onHow={() => go("home", "how")}
            onPets={() => go("about", "pets")}
          />
        ) : page === "about" ? (
          <AboutPage
            hatched={pet.hatched}
            species={pet.species}
            skinId={skinId}
            onPickSkin={pickSkin}
            onPlay={goToPet}
          />
        ) : (
          <>
            <section className="pet-stage">
              <div className="wrap pet-play-wrap">
                {!pet.hatched && !setupDone ? (
                  <GameSetup
                    username={username}
                    setUsername={setUsername}
                    skinId={skinId}
                    onPickSkin={pickSkin}
                    species={hatchSpecies}
                    setSpecies={setHatchSpecies}
                    petName={hatchName}
                    setPetName={setHatchName}
                    onDone={finishSetup}
                    inputRef={nameRef}
                  />
                ) : (
                  <>
                    <div className="hero-device" ref={deviceRef}>
                      {line && (
                        <div className="speech" key={line} role="status">
                          {line}
                        </div>
                      )}
                      <TamagotchiShell skin={skin} selected={selected} attention={!!pending} onIcon={onIcon} onButton={onButton}>
                        <LcdScene
                          scene={sceneId}
                          pet={pet}
                          emotion={emotion}
                          fx={fx}
                          view={view}
                          nudge={pending}
                          crack={eggTaps}
                          eggTint={hatchSpecies === "surprise" ? undefined : SPECIES[hatchSpecies].accent}
                      stage={stage}
                      death={pet.dead ? { canRevive: canRevive(pet), choice: deathChoice, onPick: chooseAfterDeath } : null}
                          clock={clockText(now)}
                          onPetClick={() => doCare("pat")}
                          onEggClick={tapEgg}
                        />
                      </TamagotchiShell>
                        </div>
                    {pet.hatched ? (
                      <PetSummary state={pet} status={line ? "" : brainNote} stage={stage} />
                    ) : (
                      <button type="button" className="btn-text" onClick={() => setSetupDone(false)} disabled={hatching}>
                        Change name, shell or egg
                      </button>
                    )}
                  </>
                )}
              </div>
            </section>

            {guide && pet.hatched && <Tutorial petName={pet.petName} deathNote={deathNote(pet, demo)} onClose={() => setGuide(false)} />}

            {panel === "reset" && (
              <Popup title="START OVER" onClose={closePanel} size="small">
                <ResetPanel
                  petName={pet.petName}
                  onCancel={closePanel}
                  onReset={(keepBrain) => {
                    doReset(keepBrain);
                    closePanel();
                  }}
                />
              </Popup>
            )}

            {panel === "talk" && (
              <Popup title={`TALK TO ${(pet.petName || "your pet").toUpperCase()}`} onClose={closePanel}>
                <ChatPanel
                  pet={pet}
                  messages={messages}
                  loading={loading}
                  input={input}
                  setInput={setInput}
                  onSend={sendMessage}
                  onMode={setMode}
                  onRemember={remember}
                  isListening={isListening}
                  isRecognitionSupported={isRecognitionSupported}
                  isSynthesisSupported={isSynthesisSupported}
                  transcript={recognisedText}
                  voiceError={speechError?.message ?? null}
                  onMic={onMic}
                  muted={isMuted}
                  setMuted={setMuted}
                  voices={voices}
                  voicePreferences={voicePreferences}
                  setVoiceURI={setVoiceURI}
                  setVoicePitch={setVoicePitch}
                  setVoiceRate={setVoiceRate}
                  onCutePreset={useCutePixrlVoice}
                  onPreviewVoice={previewVoice}
                  inputRef={chatInputRef}
                  responseSource={chatSource}
                />
                <ActivityPanel
                  pet={pet}
                  game={game}
                  quizActive={!!quiz}
                  onJoke={onJoke}
                  onStartGame={onStartGame}
                  onGuess={onGuess}
                  onBreakTask={onBreakTask}
                  onStudyDone={onStudyDone}
                  onQuiz={onQuiz}
                  onForget={forget}
                  onPat={() => doCare("pat")}
                  busy={loading}
                />
              </Popup>
            )}

            {panel === "stats" && (
              <Popup title="STATS AND BRAIN" onClose={closePanel}>
                <PetDetails state={pet} brainNote={brainNote} onReset={doReset} age={ageText(pet.bornAt, now.getTime())} demo={demo} now={now} />
                <BrainCard
                  rl={rl}
                  needs={pet}
                  petName={pet.petName}
                  demo={demo}
                  setDemo={setDemoAndSave}
                  onAskNow={askNow}
                  lastOutcome={lastOutcome}
                  hatched={pet.hatched}
                />
                <HabitCard habits={habits} now={now} petName={pet.petName} />
                <EvolutionCard pet={pet} onBoost={onBoost} demo={demo} now={now} />
              </Popup>
            )}

            {panel === "style" && (
              <Popup title="CUSTOMISE" onClose={closePanel}>
                <div className="card">
                  <h3>Change the background?</h3>
                  <p className="muted">What's behind {pet.petName || "your pet"} on the screen.</p>
                  <div className="scene-grid">
                    {SCENES.map((sc) => (
                      <button
                        key={sc.id}
                        type="button"
                        className={`scene-pick ${sceneId === sc.id ? "active" : ""}`}
                        aria-pressed={sceneId === sc.id}
                        onClick={() => {
                          setSceneId(sc.id);
                          saveSceneId(sc.id);
                        }}
                      >
                        <span className="scene-thumb">{sc.id === "lcd" ? <span className="lcd-plain" /> : <SceneArt id={sc.id} className="fill" />}</span>
                        <span>{sc.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <h3>Change the shell?</h3>
                  <p className="muted">{skin.name} is on right now.</p>
                  <ShellGallery current={skinId} onPick={pickSkin} />
                </div>
              </Popup>
            )}

            {panel === "attention" && (
              <Popup title="ATTENTION" onClose={closePanel} size="small">
                <div className="card attention-card">
                  {pending ? (
                    <>
                      <p className="attention-line">
                        <b>{pet.petName}</b> wants to <b>{pending === "chat" ? "chat" : pending}</b>.
                      </p>
                      <p className="muted small">Answering teaches its brain: do it (+1) or say not now (-0.5).</p>
                      <div className="row-gap">
                        <button
                          type="button"
                          className="pixel-btn"
                          onClick={() => {
                            if (pending === "chat") {
                              setPanel("talk");
                              // sendMessage will call teach("chat") when the user actually sends
                            } else {
                              doCare(pending);
                              setPanel(null);
                            }
                          }}
                        >
                          DO IT
                        </button>
                        <button
                          type="button"
                          className="pixel-btn plain"
                          onClick={() => {
                            setRl((r) => expire(r));
                            setLastOutcome("-0.5: you said not now. Noted.");
                            setLine("Okay, maybe later.");
                            setPanel(null);
                          }}
                        >
                          NOT NOW
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="attention-line">All good! {pet.petName || "Your pet"} doesn't need anything right now.</p>
                      <p className="muted small">
                        When the <b>!</b> icon flashes, it has a suggestion for you. Its best guess for now: {ACTION_WORD[guessNow.best]}.
                      </p>
                      <button type="button" className="pixel-btn plain" onClick={closePanel}>OK</button>
                    </>
                  )}
                </div>
              </Popup>
            )}
          </>
        )}
      </main>

      {page !== "play" && <Footer go={go} />}
      {page !== "play" && <StickerRail page={page} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
