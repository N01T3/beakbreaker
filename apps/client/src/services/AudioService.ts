import { CordelSynth, type CordelSynthSfxId } from './CordelSynth.js';

export const AUDIO_MUTED_STORAGE_KEY = 'beakbreaker_audio_muted';

export type CordelSoundTrack =
  | 'bgm_forro_fazenda_dia'
  | 'bgm_viola_fazenda_noite'
  | 'bgm_baiao_arena'
  | 'bgm_maracatu_colosso'
  | 'sfx_xilo_pah'
  | 'sfx_corta_canto'
  | 'sfx_canto_especial'
  | 'sfx_colheita_milho'
  | 'sfx_zabumba_tab'
  | 'sfx_triangulo_reward'
  | 'sfx_galo_supreme'
  | 'sfx_sanfona_victory'
  | 'sfx_berimbau_twang'
  | 'sfx_milho_pop';

const SFX_TO_SYNTH: Partial<Record<CordelSoundTrack, CordelSynthSfxId>> = {
  sfx_xilo_pah: 'zabumbaHit',
  sfx_canto_especial: 'sanfonaChord',
  sfx_corta_canto: 'cortaCantoWhistle',
  sfx_colheita_milho: 'milhoPop',
  sfx_zabumba_tab: 'zabumbaHit',
  sfx_triangulo_reward: 'trianguloChime',
  sfx_galo_supreme: 'galoCantoSupreme',
  sfx_sanfona_victory: 'sanfonaChord',
  sfx_berimbau_twang: 'berimbauTwang',
  sfx_milho_pop: 'milhoPop',
};

export interface SynthStats {
  sfxCount: number;
  lastPlayedSfx: CordelSynthSfxId | null;
}

const memoryStore = new Map<string, string>();

function getStorage(): Storage | null {
  try {
    const g = globalThis as unknown as { localStorage?: Storage; window?: { localStorage?: Storage } };
    const ls = g.localStorage ?? g.window?.localStorage;
    if (ls && typeof ls.getItem === 'function') return ls;
  } catch { /* sandbox */ }
  return null;
}

function readStoredMuted(): boolean {
  try {
    const ls = getStorage();
    if (ls) {
      const val = ls.getItem(AUDIO_MUTED_STORAGE_KEY);
      if (val !== null) return val === 'true';
    }
    return memoryStore.get(AUDIO_MUTED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeStoredMuted(muted: boolean): void {
  const val = String(muted);
  try {
    const ls = getStorage();
    if (ls) ls.setItem(AUDIO_MUTED_STORAGE_KEY, val);
  } catch { /* sandbox */ }
  memoryStore.set(AUDIO_MUTED_STORAGE_KEY, val);
}

export function clearMutedStorage(): void {
  memoryStore.delete(AUDIO_MUTED_STORAGE_KEY);
  try {
    getStorage()?.removeItem(AUDIO_MUTED_STORAGE_KEY);
  } catch { /* sandbox */ }
}

export class AudioService {
  private muted = false;
  private masterVolume = 0.85;
  private currentBgm: CordelSoundTrack | null = null;
  private playedSfxHistory: CordelSoundTrack[] = [];
  private readonly synth: CordelSynth;

  constructor(synth: CordelSynth = new CordelSynth(), initialMuted?: boolean) {
    this.synth = synth;
    this.synth.setVolume(this.masterVolume);
    this.muted = initialMuted !== undefined ? initialMuted : readStoredMuted();
  }

  public playBgm(track: CordelSoundTrack): void { this.currentBgm = track; }
  public getCurrentBgm(): CordelSoundTrack | null { return this.currentBgm; }

  public playSfx(sfx: CordelSoundTrack): boolean {
    if (this.muted || this.masterVolume <= 0) return false;
    this.playedSfxHistory.push(sfx);
    return true;
  }

  private playWithSynth(sfx: CordelSoundTrack): boolean {
    if (!this.playSfx(sfx)) return false;
    const synthId = SFX_TO_SYNTH[sfx];
    if (synthId) this.synth.play(synthId);
    return true;
  }

  public playZabumbaTabSwitch(): boolean { return this.playWithSynth('sfx_zabumba_tab'); }
  public playTrianguloReward(): boolean { return this.playWithSynth('sfx_triangulo_reward'); }
  public playGaloCantoSupreme(): boolean { return this.playWithSynth('sfx_galo_supreme'); }
  public playSanfonaVictory(): boolean { return this.playWithSynth('sfx_sanfona_victory'); }
  public playHarvestMilho(): boolean { return this.playWithSynth('sfx_colheita_milho'); }
  public playBerimbauTwang(): boolean { return this.playWithSynth('sfx_berimbau_twang'); }
  public playXiloHitSfx(): boolean { return this.playWithSynth('sfx_xilo_pah'); }
  public playTorcidaCheer(): boolean { return this.playWithSynth('sfx_canto_especial'); }
  public playCortaCantoSfx(): boolean { return this.playWithSynth('sfx_corta_canto'); }

  public getSynthStats(): SynthStats {
    return { sfxCount: this.synth.sfxCount, lastPlayedSfx: this.synth.lastPlayedSfx };
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    writeStoredMuted(muted);
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public isMuted(): boolean { return this.muted; }

  public setMasterVolume(vol: number): number {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    this.synth.setVolume(this.masterVolume);
    return this.masterVolume;
  }

  public getMasterVolume(): number { return this.masterVolume; }
  public getPlayedSfxHistory(): readonly CordelSoundTrack[] { return this.playedSfxHistory; }
  public getSfxCountByTrack(track: CordelSoundTrack): number {
    return this.playedSfxHistory.filter((t) => t === track).length;
  }
  public getTotalSfxPlayed(): number { return this.playedSfxHistory.length; }
  public clearHistory(): void { this.playedSfxHistory = []; }
}

export const cordelAudio = new AudioService();
