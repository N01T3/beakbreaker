import { CordelSynth, type CordelSynthSfxId } from './CordelSynth.js';

export type CordelSoundTrack =
  | 'bgm_forro_fazenda_dia'
  | 'bgm_viola_fazenda_noite'
  | 'bgm_baiao_arena'
  | 'bgm_maracatu_colosso'
  | 'sfx_xilo_pah'
  | 'sfx_corta_canto'
  | 'sfx_canto_especial'
  | 'sfx_colheita_milho';

/** Mapeamento das trilhas SFX para os timbres procedurais do CordelSynth. */
const SFX_TO_SYNTH: Partial<Record<CordelSoundTrack, CordelSynthSfxId>> = {
  sfx_xilo_pah: 'zabumbaHit',
  sfx_canto_especial: 'sanfonaChord',
  sfx_corta_canto: 'cortaCantoWhistle',
  sfx_colheita_milho: 'trianguloChime',
};

export interface SynthStats {
  sfxCount: number;
  lastPlayedSfx: CordelSynthSfxId | null;
}

export class AudioService {
  private muted = false;
  private masterVolume = 0.85;
  private currentBgm: CordelSoundTrack | null = null;
  private playedSfxHistory: CordelSoundTrack[] = [];
  private readonly synth: CordelSynth;

  constructor(synth: CordelSynth = new CordelSynth()) {
    this.synth = synth;
    this.synth.setVolume(this.masterVolume);
  }

  public playBgm(track: CordelSoundTrack): void {
    this.currentBgm = track;
  }

  public getCurrentBgm(): CordelSoundTrack | null {
    return this.currentBgm;
  }

  public playSfx(sfx: CordelSoundTrack): boolean {
    if (this.muted || this.masterVolume <= 0) return false;
    this.playedSfxHistory.push(sfx);
    return true;
  }

  /** Registra o SFX e, se não estiver mudo, dispara o timbre procedural. */
  private playWithSynth(sfx: CordelSoundTrack): boolean {
    if (!this.playSfx(sfx)) return false;
    const synthId = SFX_TO_SYNTH[sfx];
    if (synthId) this.synth.play(synthId);
    return true;
  }

  public playXiloHitSfx(): boolean {
    return this.playWithSynth('sfx_xilo_pah');
  }

  public playTorcidaCheer(): boolean {
    return this.playWithSynth('sfx_canto_especial');
  }

  public playCortaCantoSfx(): boolean {
    return this.playWithSynth('sfx_corta_canto');
  }

  public getSynthStats(): SynthStats {
    return { sfxCount: this.synth.sfxCount, lastPlayedSfx: this.synth.lastPlayedSfx };
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMasterVolume(vol: number): number {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    this.synth.setVolume(this.masterVolume);
    return this.masterVolume;
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public getPlayedSfxHistory(): readonly CordelSoundTrack[] {
    return this.playedSfxHistory;
  }
}

/** Instância compartilhada de áudio para toda a UI web. */
export const cordelAudio = new AudioService();
