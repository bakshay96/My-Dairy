/**
 * Zero-dependency Web Audio API Sound Synthesizer for Milkify
 * Synthesizes crisp notification tones in the browser without external MP3/WAV files.
 */

export const SOUND_PRESETS = [
  {
    id: "milky-chime",
    name: "Milky Chime",
    desc: "Harmonic tri-tone arpeggio (G5 → C6 → E6). Warm and uplifting.",
    tag: "Default",
  },
  {
    id: "crystal-bell",
    name: "Crystal Bell",
    desc: "High shimmer chime with resonant overtones. Crisp and distinct.",
    tag: "Crystal",
  },
  {
    id: "modern-marimba",
    name: "Modern Marimba",
    desc: "Warm acoustic wooden plucks with swift percussive decay.",
    tag: "Organic",
  },
  {
    id: "digital-ping",
    name: "Digital Ping",
    desc: "Clean modern electronic notification ping for busy environments.",
    tag: "Tech",
  },
  {
    id: "gentle-waterdrop",
    name: "Gentle Drop",
    desc: "Soothing pitch-gliding drop. Smooth and non-intrusive.",
    tag: "Calm",
  },
  {
    id: "subtle-radar",
    name: "Subtle Radar",
    desc: "Rhythmic double blip with rapid release.",
    tag: "Alert",
  },
];

const PREFERENCE_KEY = "milkify-notification-sound";
const DISABLED_KEY = "milkify-sound-disabled";

export const getStoredSoundPreset = () => {
  if (typeof window === "undefined") return "milky-chime";
  return localStorage.getItem(PREFERENCE_KEY) || "milky-chime";
};

export const setStoredSoundPreset = (id) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFERENCE_KEY, id);
};

export const isSoundDisabled = () => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DISABLED_KEY) === "true";
};

export const setSoundDisabled = (disabled) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(DISABLED_KEY, disabled ? "true" : "false");
};

/**
 * Synthesize and play a sound preset
 */
export const playPreset = (presetId = "milky-chime") => {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playTone = (freq, startTime, duration, type = "sine", peakGain = 0.15) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    switch (presetId) {
      case "crystal-bell": {
        // High fundamental with shimmer harmonic
        playTone(1174.66, now, 0.45, "sine", 0.16); // D6
        playTone(2349.32, now + 0.02, 0.35, "sine", 0.08); // D7 harmonic
        playTone(3520.0, now + 0.04, 0.25, "triangle", 0.04);
        break;
      }

      case "modern-marimba": {
        // Fast wooden tri-tone
        playTone(523.25, now, 0.14, "triangle", 0.18); // C5
        playTone(659.25, now + 0.07, 0.14, "triangle", 0.16); // E5
        playTone(783.99, now + 0.14, 0.22, "triangle", 0.14); // G5
        break;
      }

      case "digital-ping": {
        // High crisp ping
        playTone(1567.98, now, 0.18, "sine", 0.2); // G6
        playTone(2093.0, now + 0.03, 0.12, "sine", 0.1); // C7
        break;
      }

      case "gentle-waterdrop": {
        // Smooth frequency glide upward
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.15);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }

      case "subtle-radar": {
        // Double blip
        playTone(932.33, now, 0.08, "sine", 0.15); // Bb5
        playTone(932.33, now + 0.11, 0.12, "sine", 0.15);
        break;
      }

      case "milky-chime":
      default: {
        // Classic uplifting tri-tone
        playTone(784, now, 0.14, "sine", 0.14);
        playTone(1046.5, now + 0.08, 0.18, "sine", 0.14);
        playTone(1318.5, now + 0.16, 0.28, "sine", 0.12);
        break;
      }
    }
  } catch (err) {
    console.warn("[SoundEffects] Web Audio playback failed:", err.message);
  }
};

/**
 * Preview sound regardless of mute status
 */
export const previewSound = (presetId) => {
  playPreset(presetId);
};

/**
 * Play live notification sound respecting mute preferences
 */
export const playNotificationSound = (presetId = null) => {
  if (isSoundDisabled()) return;
  const sound = presetId || getStoredSoundPreset();
  playPreset(sound);
};
