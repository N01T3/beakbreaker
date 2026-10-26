/**
 * CordelSynth — sintetizador procedural WebAudio do Sertão Cordel Pop.
 * Gera zabumba, triângulo, sanfona e apito de Corta-Canto sem arquivos de áudio.
 * Seguro em Node/Vitest e navegadores headless sem hardware de áudio.
 */
export type CordelSfxId = 'zabumbaHit' | 'trianguloChime' | 'sanfonaChord' | 'cortaCantoWhistle';
export type CordelSynthSfxId = CordelSfxId;

type AudioCtxCtor = new () => AudioContext;

function resolveAudioCtor(): AudioCtxCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: AudioCtxCtor; webkitAudioContext?: AudioCtxCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

export class CordelSynth {
  public lastPlayedSfx: CordelSfxId | null = null;
  public sfxCount = 0;
  private ctx: AudioContext | null = null;
  private volume = 0.6;

  public isSupported(): boolean {
    return resolveAudioCtor() !== null;
  }

  public hasAudioContext(): boolean {
    return this.ctx !== null;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public play(sfx: CordelSfxId): boolean {
    this.lastPlayedSfx = sfx;
    this.sfxCount += 1;
    const ctx = this.ensureContext();
    if (!ctx) return false;
    try {
      const t = ctx.currentTime;
      if (sfx === 'zabumbaHit') this.tone(ctx, t, 'sine', 110, 45, 0.28, 1.0);
      if (sfx === 'trianguloChime') {
        this.tone(ctx, t, 'triangle', 2637, 2637, 0.45, 0.25);
        this.tone(ctx, t, 'sine', 3951, 3951, 0.35, 0.12);
      }
      if (sfx === 'sanfonaChord') {
        for (const f of [261.63, 329.63, 392.0]) this.tone(ctx, t, 'sawtooth', f, f, 0.6, 0.12);
      }
      if (sfx === 'cortaCantoWhistle') this.tone(ctx, t, 'square', 1800, 600, 0.22, 0.2);
      return true;
    } catch {
      return false;
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = resolveAudioCtor();
    if (!Ctor) return null;
    try {
      this.ctx = new Ctor();
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  private tone(
    ctx: AudioContext,
    start: number,
    type: OscillatorType,
    fromHz: number,
    toHz: number,
    duration: number,
    gainLevel: number,
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(fromHz, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, toHz), start + duration);
    gain.gain.setValueAtTime(gainLevel * this.volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }
}
