import { beforeEach, describe, expect, it } from 'vitest';
import { CordelSynth, type CordelSfxId } from '../src/services/CordelSynth.js';
import {
  AudioService,
  clearMutedStorage,
  cordelAudio,
} from '../src/services/AudioService.js';

function createMockAudioContext(): AudioContext {
  const dest = {} as AudioNode;
  const param = () => ({
    value: 0,
    setValueAtTime: () => {},
    exponentialRampToValueAtTime: () => {},
  });
  return {
    currentTime: 0.5,
    destination: dest,
    createOscillator: () => ({
      type: 'sine' as OscillatorType,
      frequency: param(),
      connect: (target?: unknown) => target ?? dest,
      start: () => {},
      stop: () => {},
    }),
    createGain: () => ({
      gain: param(),
      connect: (target?: unknown) => target ?? dest,
    }),
  } as unknown as AudioContext;
}

describe('CordelSynth Procedural WebAudio', () => {
  it('funciona em modo headless/Node sem hardware de áudio', () => {
    const synth = new CordelSynth();
    expect(synth.hasAudioContext()).toBe(false);
    expect(synth.play('zabumbaHit')).toBe(false);
    expect(synth.lastPlayedSfx).toBe('zabumbaHit');
    expect(synth.sfxCount).toBe(1);
    synth.setVolume(1.5);
    expect(synth.getVolume()).toBe(1);
  });

  it('sintetiza todos os 7 timbres sertanejos com AudioContext ativo', () => {
    const mockCtx = createMockAudioContext();
    const synth = new CordelSynth(mockCtx);
    expect(synth.hasAudioContext()).toBe(true);
    expect(synth.isSupported()).toBe(true);

    const timbres: CordelSfxId[] = [
      'zabumbaHit',
      'trianguloChime',
      'sanfonaChord',
      'cortaCantoWhistle',
      'galoCantoSupreme',
      'berimbauTwang',
      'milhoPop',
    ];
    for (const id of timbres) {
      expect(synth.play(id)).toBe(true);
      expect(synth.lastPlayedSfx).toBe(id);
    }
    expect(synth.sfxCount).toBe(7);
  });

  it('executa atalhos de disparo por instrumento', () => {
    const synth = new CordelSynth(createMockAudioContext());
    expect(synth.playZabumba()).toBe(true);
    expect(synth.playTriangulo()).toBe(true);
    expect(synth.playSanfonaChord()).toBe(true);
    expect(synth.playCortaCanto()).toBe(true);
    expect(synth.playGaloCanto()).toBe(true);
    expect(synth.playBerimbau()).toBe(true);
    expect(synth.playMilho()).toBe(true);
    expect(synth.sfxCount).toBe(7);
  });
});

describe('AudioService Alto Nível & Persistência de Mudo', () => {
  beforeEach(() => {
    clearMutedStorage();
  });

  it('dispara métodos de alto nível com registro de histórico e estatísticas', () => {
    const audio = new AudioService(new CordelSynth(), false);
    expect(audio.playZabumbaTabSwitch()).toBe(true);
    expect(audio.playTrianguloReward()).toBe(true);
    expect(audio.playGaloCantoSupreme()).toBe(true);
    expect(audio.playSanfonaVictory()).toBe(true);
    expect(audio.playHarvestMilho()).toBe(true);
    expect(audio.playBerimbauTwang()).toBe(true);

    const stats = audio.getSynthStats();
    expect(stats.sfxCount).toBe(6);
    expect(stats.lastPlayedSfx).toBe('berimbauTwang');
    expect(audio.getTotalSfxPlayed()).toBe(6);
    expect(audio.getSfxCountByTrack('sfx_zabumba_tab')).toBe(1);
    expect(audio.getSfxCountByTrack('sfx_galo_supreme')).toBe(1);
  });

  it('persiste estado de mudo no localStorage e restaura em nova instância', () => {
    const audio1 = new AudioService(new CordelSynth(), false);
    expect(audio1.isMuted()).toBe(false);

    audio1.setMuted(true);
    expect(audio1.isMuted()).toBe(true);
    expect(audio1.playZabumbaTabSwitch()).toBe(false);

    const audio2 = new AudioService(new CordelSynth());
    expect(audio2.isMuted()).toBe(true);

    audio2.toggleMute();
    expect(audio2.isMuted()).toBe(false);
  });

  it('gerencia trilhas BGM e limpeza de histórico', () => {
    const audio = new AudioService(new CordelSynth(), false);
    audio.playBgm('bgm_forro_fazenda_dia');
    expect(audio.getCurrentBgm()).toBe('bgm_forro_fazenda_dia');
    audio.playZabumbaTabSwitch();
    expect(audio.getPlayedSfxHistory().length).toBe(1);
    audio.clearHistory();
    expect(audio.getPlayedSfxHistory().length).toBe(0);
  });

  it('bloqueia reprodução quando volume mestre é zero', () => {
    const audio = new AudioService(new CordelSynth(), false);
    audio.setMasterVolume(0);
    expect(audio.playTrianguloReward()).toBe(false);
    expect(audio.getSynthStats().sfxCount).toBe(0);
  });

  it('preserva singleton cordelAudio', () => {
    expect(cordelAudio).toBeInstanceOf(AudioService);
  });
});
