"use client";

// Shared Web Audio setup for every quiz sound effect — a single AudioContext
// and gain node, reused across components (QuizPlayer's mode-select/session
// screens, and the "Take Quiz" button on the courses page, which lives in a
// completely different component tree). Buffers are fetched and decoded once
// up front (preloadQuizSounds) and played back via fresh
// AudioBufferSourceNodes, so playback itself never waits on network or
// decoding — the actual point of "no latency": that work has to happen
// before the sound is needed, not at the moment it's triggered.

const SOUND_FILES = {
  hover: "/sounds/subtle_blob.wav",
  modeSelect: "/sounds/motion_shutter_1.wav",
  correct: "/sounds/Correct1.wav",
  perfectA: "/sounds/10score.wav",
  perfectB: "/sounds/10score2.wav",
  finished: "/sounds/finished1.wav",
  takeQuiz: "/sounds/transition1.wav",
} as const;

export type QuizSoundKey = keyof typeof SOUND_FILES;

type QuizAudioState = {
  ctx: AudioContext | null;
  gainNode: GainNode | null;
  buffers: Map<QuizSoundKey, AudioBuffer>;
  loading: Map<QuizSoundKey, Promise<AudioBuffer | null>>;
};

// Anchored on globalThis rather than a plain module-level variable — in
// Next.js dev mode, editing any file that imports this module can cause
// this module itself to be re-evaluated by Fast Refresh, which would
// otherwise silently spawn a second AudioContext (and a second, empty
// buffer cache) disconnected from whatever the first one already had
// loaded/unlocked. globalThis survives that re-evaluation.
function getState(): QuizAudioState {
  const g = globalThis as unknown as { __quizAudioState?: QuizAudioState };
  if (!g.__quizAudioState) {
    g.__quizAudioState = { ctx: null, gainNode: null, buffers: new Map(), loading: new Map() };
  }
  return g.__quizAudioState;
}

function ensureContext(): { ctx: AudioContext; gainNode: GainNode } {
  const state = getState();
  if (state.ctx && state.gainNode) return { ctx: state.ctx, gainNode: state.gainNode };

  const AudioContextCtor =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioContextCtor();
  const gainNode = ctx.createGain();
  gainNode.gain.value = 0.15;
  gainNode.connect(ctx.destination);
  state.ctx = ctx;
  state.gainNode = gainNode;

  // AudioContexts start suspended until a user gesture resumes them, and
  // browsers auto-suspend an idle context again later as a power-saving
  // measure — so this stays a persistent listener rather than a one-shot
  // unlock, to recover from that too.
  const unlock = () => {
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
  };
  document.addEventListener("pointerdown", unlock);
  document.addEventListener("keydown", unlock);

  return { ctx, gainNode };
}

function loadBuffer(key: QuizSoundKey): Promise<AudioBuffer | null> {
  const state = getState();
  const cached = state.buffers.get(key);
  if (cached) return Promise.resolve(cached);
  const inFlight = state.loading.get(key);
  if (inFlight) return inFlight;

  const { ctx } = ensureContext();
  const promise = fetch(SOUND_FILES[key])
    .then((res) => res.arrayBuffer())
    .then((data) => ctx.decodeAudioData(data))
    .then((buffer) => {
      state.buffers.set(key, buffer);
      return buffer;
    })
    .catch((err) => {
      console.warn(`[quiz sound] failed to load ${key}`, err);
      return null;
    });
  state.loading.set(key, promise);
  return promise;
}

// Kick off decoding for every quiz sound as early as possible (e.g. on
// mount of the courses page or the quiz player) so that by the time a user
// actually reaches "take quiz", "select a mode", or "finish a session",
// every buffer is already sitting decoded in memory.
export function preloadQuizSounds() {
  (Object.keys(SOUND_FILES) as QuizSoundKey[]).forEach((key) => loadBuffer(key));
}

function playBuffer(buffer: AudioBuffer, volume: number) {
  const { ctx, gainNode } = ensureContext();
  // Gating playback on resume() resolving first means any rejected
  // resume() (which happens more than you'd expect) drops the sound
  // entirely. A source scheduled at time 0 on a still-suspended context is
  // valid and plays once the context catches up, so just fire both.
  if (ctx.state === "suspended") ctx.resume().catch((err) => console.warn("[quiz sound] resume failed", err));

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  if (volume === 1) {
    source.connect(gainNode);
  } else {
    const trim = ctx.createGain();
    trim.gain.value = volume;
    source.connect(trim);
    trim.connect(gainNode);
  }
  source.start(0);
}

// volume is relative to the shared master gain (1 = normal, <1 = quieter) —
// used to make e.g. the "take quiz" transition sound a little softer than
// the rest without touching the master level everything else shares.
export function playQuizSound(key: QuizSoundKey, volume = 1) {
  const state = getState();
  const cached = state.buffers.get(key);
  if (cached) {
    playBuffer(cached, volume);
    return;
  }
  // Not decoded yet (called before preload finished, or preload was never
  // triggered by this entry point) — decode now and play the instant it's
  // ready. Only this first, unlucky call ever pays that latency.
  loadBuffer(key).then((buffer) => {
    if (buffer) playBuffer(buffer, volume);
  });
}
