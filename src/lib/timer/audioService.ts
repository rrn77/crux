/**
 * Servicio de Audio y Vibración para el temporizador de CRUX
 * Utiliza Web Audio API para sintetizar tonos sin requerir ficheros externos
 */

class AudioFeedbackService {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  /**
   * Toca un tono con frecuencia, tipo de onda y duración configurable
   */
  private playTone(freq: number, durationSec: number, type: OscillatorType = 'sine', gainVal: number = 0.15) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationSec);
    } catch {
      // Ignorar errores si el usuario no ha interactuado aún
    }
  }

  /**
   * Beep corto de cuenta atrás (3, 2, 1)
   */
  playCountdown() {
    this.playTone(880, 0.12, 'triangle', 0.2);
  }

  /**
   * Tono de inicio de TRABAJO (Enérgico y claro)
   */
  playWorkStart() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Acorde ascendente C5 -> E5 -> G5
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.2, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.35);
      });
    } catch {}
  }

  /**
   * Tono de inicio de DESCANSO (Relajante y suave)
   */
  playRestStart() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Acorde descendente G5 -> E5 -> C5
      [783.99, 659.25, 523.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);

        gain.gain.setValueAtTime(0.18, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.4);
      });
    } catch {}
  }

  /**
   * Tono triunfal de Bloque o Sesión Completada
   */
  playSuccess() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);

        gain.gain.setValueAtTime(0.25, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.5);
      });
    } catch {}
  }

  /**
   * Emite vibración táctil si el dispositivo y navegador lo soportan
   */
  vibrate(pattern: number | number[] = 200) {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }

  /**
   * Patrón de vibración para inicio de trabajo
   */
  vibrateWork() {
    this.vibrate([150, 80, 150]);
  }

  /**
   * Patrón de vibración para descanso
   */
  vibrateRest() {
    this.vibrate([300]);
  }

  /**
   * Patrón de vibración para cuenta atrás
   */
  vibrateCountdown() {
    this.vibrate(80);
  }
}

export const audioFeedback = new AudioFeedbackService();
