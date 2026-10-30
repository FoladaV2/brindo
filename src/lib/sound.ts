/**
 * Short interface sounds, synthesised with the Web Audio API, so there are no audio files to
 * download. Quiet by design, played only right after something the person did (browsers allow
 * audio only after a gesture anyway), never while the tab is hidden, and silent when the host has
 * turned sounds off on their account page (remembered per device).
 */
export type Sound = "tap" | "success" | "error" | "clink";

const PREFERENCE_KEY = "brindo:sound";
const CHANGE_EVENT = "brindo:sound";
/** Everything runs through one gain, so the overall level is set here. */
const MASTER_VOLUME = 0.6;

let context: AudioContext | null = null;
let master: GainNode | null = null;

export function soundEnabled(): boolean {
  try {
    return window.localStorage.getItem(PREFERENCE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundEnabled(on: boolean) {
  try {
    window.localStorage.setItem(PREFERENCE_KEY, on ? "on" : "off");
  } catch {
    // Private mode: the choice can't be kept.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** For useSyncExternalStore: the preference changed here or in another tab. */
export function subscribeSoundPreference(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function output(): { ac: AudioContext; out: GainNode } | null {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!context || !master) {
    context = new Ctor();
    master = context.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(context.destination);
  }
  if (context.state === "suspended") void context.resume();
  return { ac: context, out: master };
}

/** One partial: a 6ms attack, then an exponential fade to silence. */
function partial(ac: AudioContext, out: AudioNode, freq: number, start: number, duration: number, peak: number, type: OscillatorType = "sine") {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(out);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** A struck wine glass: inharmonic partials, the higher ones dying first. */
function glass(ac: AudioContext, out: AudioNode, at: number, base: number, level: number) {
  partial(ac, out, base, at, 1.6, 0.09 * level);
  partial(ac, out, base * 2.32, at, 0.9, 0.035 * level);
  partial(ac, out, base * 4.25, at, 0.45, 0.018 * level);
  partial(ac, out, base * 6.63, at, 0.2, 0.008 * level);
}

const SOUNDS: Record<Sound, (ac: AudioContext, out: AudioNode, t: number) => void> = {
  // A soft wooden tick: copy, toggle, small confirmations.
  tap: (ac, out, t) => {
    partial(ac, out, 1650, t, 0.06, 0.05);
    partial(ac, out, 820, t, 0.05, 0.03, "triangle");
  },
  // Two bell notes rising a fourth: saved, created, granted.
  success: (ac, out, t) => {
    partial(ac, out, 1318.5, t, 0.45, 0.06);
    partial(ac, out, 2637, t, 0.2, 0.012);
    partial(ac, out, 1760, t + 0.085, 0.6, 0.06);
    partial(ac, out, 3520, t + 0.085, 0.25, 0.01);
  },
  // Two low, muted notes falling: something didn't work.
  error: (ac, out, t) => {
    partial(ac, out, 392, t, 0.18, 0.06, "triangle");
    partial(ac, out, 311, t + 0.11, 0.26, 0.055, "triangle");
  },
  // Two glasses touching: the guest's "coming", and an invitation going live.
  clink: (ac, out, t) => {
    glass(ac, out, t, 1880, 1);
    glass(ac, out, t + 0.012, 2215, 0.7);
  },
};

export function play(sound: Sound) {
  if (typeof window === "undefined" || document.hidden || !soundEnabled()) return;
  try {
    const audio = output();
    if (!audio) return;
    SOUNDS[sound](audio.ac, audio.out, audio.ac.currentTime + 0.01);
  } catch {
    // Audio is a nicety; never let it break an action.
  }
}
