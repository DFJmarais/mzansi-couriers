/** Provides tiny tap feedback without affecting automatic theme changes. */
export function playThemeToggleFeedback(): void {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  try {
    if ("vibrate" in navigator) navigator.vibrate?.(8);
  } catch {
    // Haptics are optional and unavailable in some browsers and iOS WebViews.
  }

  try {
    const AudioContextCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(620, start);
    oscillator.frequency.exponentialRampToValueAtTime(820, start + 0.045);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.018, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.06);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.065);
    window.setTimeout(() => void context.close(), 120);
  } catch {
    // Sound is an enhancement; theme switching must always continue silently.
  }
}
