export type CordelSoundTrack =
  | 'bgm_forro_fazenda_dia'
  | 'bgm_viola_fazenda_noite'
  | 'bgm_baiao_arena'
  | 'bgm_maracatu_colosso'
  | 'sfx_xilo_pah'
  | 'sfx_corta_canto'
  | 'sfx_canto_especial'
  | 'sfx_colheita_milho';

export class AudioService {
  private muted = false;
  private masterVolume = 0.85;
  private currentBgm: CordelSoundTrack | null = null;
  private playedSfxHistory: CordelSoundTrack[] = [];

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

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMasterVolume(vol: number): number {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    return this.masterVolume;
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public getPlayedSfxHistory(): readonly CordelSoundTrack[] {
    return this.playedSfxHistory;
  }
}
