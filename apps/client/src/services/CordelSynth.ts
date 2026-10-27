/**
 * CordelSynth — sintetizador procedural WebAudio do Sertão Cordel Pop.
 * Gera timbres sertanejos (zabumba, triângulo, sanfona, galo, berimbau, milho) sem arquivos externos.
 * Seguro em Node/Vitest e navegadores headless sem hardware de áudio.
 */
export type CordelSfxId =
  | 'zabumbaHit'
  | 'trianguloChime'
  | 'sanfonaChord'
  | 'cortaCantoWhistle'
  | 'galoCantoSupreme'
  | 'berimbauTwang'
  | 'milhoPop';

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

  constructor(customCtx: AudioContext | null = null) {
    this.ctx = customCtx;
  }

  public isSupported(): boolean {
    return this.ctx !== null || resolveAudioCtor() !== null;
  }

  public hasAudioContext(): boolean {
    return this.ctx !== null;
  }

  public setAudioContext(ctx: AudioContext | null): void {
    this.ctx = ctx;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  public play(sfx: CordelSfxId): boolean {
    this.lastPlayedSfx = sfx;
    this.sfxCount += 1;
    const ctx = this.ensureContext();
    if (!ctx) return false;
    try {
      const t = ctx.currentTime;
      if (sfx === 'zabumbaHit') {
        this.tone(ctx, t, 'sine', 120, 40, 0.32, 1.0);
        this.tone(ctx, t, 'triangle', 160, 50, 0.12, 0.45);
      } else if (sfx === 'trianguloChime') {
        this.tone(ctx, t, 'triangle', 2637, 2637, 0.35, 0.3);
        this.tone(ctx, t, 'sine', 3951, 3951, 0.25, 0.2);
        this.tone(ctx, t + 0.08, 'triangle', 2637, 2637, 0.45, 0.35);
        this.tone(ctx, t + 0.08, 'sine', 3951, 3951, 0.35, 0.22);
      } else if (sfx === 'sanfonaChord') {
        this.playSanfona(ctx, t);
      } else if (sfx === 'cortaCantoWhistle') {
        this.tone(ctx, t, 'square', 2200, 600, 0.22, 0.25);
      } else if (sfx === 'galoCantoSupreme') {
        this.tone(ctx, t, 'sawtooth', 380, 440, 0.12, 0.25);
        this.tone(ctx, t + 0.14, 'sawtooth', 480, 560, 0.12, 0.28);
        this.tone(ctx, t + 0.28, 'sawtooth', 620, 1100, 0.45, 0.35);
        this.tone(ctx, t + 0.28, 'sine', 1240, 2200, 0.45, 0.15);
      } else if (sfx === 'berimbauTwang') {
        this.tone(ctx, t, 'triangle', 280, 210, 0.38, 0.4);
        this.tone(ctx, t, 'square', 560, 420, 0.15, 0.15);
        this.tone(ctx, t, 'sine', 165, 150, 0.45, 0.5);
      } else if (sfx === 'milhoPop') {
        this.tone(ctx, t, 'triangle', 1800, 240, 0.06, 0.5);
        this.tone(ctx, t, 'square', 900, 150, 0.04, 0.3);
      }
      return true;
    } catch {
      return false;
    }
  }

  public playZabumba(): boolean { return this.play('zabumbaHit'); }
  public playTriangulo(): boolean { return this.play('trianguloChime'); }
  public playSanfonaChord(): boolean { return this.play('sanfonaChord'); }
  public playCortaCanto(): boolean { return this.play('cortaCantoWhistle'); }
  public playGaloCanto(): boolean { return this.play('galoCantoSupreme'); }
  public playBerimbau(): boolean { return this.play('berimbauTwang'); }
  public playMilho(): boolean { return this.play('milhoPop'); }

  private playSanfona(ctx: AudioContext, t: number): void {
    const duration = 0.6;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(5, t);
    lfoGain.gain.setValueAtTime(4.5, t);
    lfo.connect(lfoGain);

    for (const f of [261.63, 329.63, 392.0]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);
      lfoGain.connect(osc.frequency);
      gain.gain.setValueAtTime(0.18 * this.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duration + 0.02);
    }
    lfo.start(t);
    lfo.stop(t + duration + 0.02);
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
