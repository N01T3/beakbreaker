import { describe, expect, it } from 'vitest';
import { LAUNCH_ROOSTERS } from '@beakbreaker/game-data';
import { CAST_WINDUP_TICKS, SynergyResolver } from '@beakbreaker/combat-core';
import { CordelSynth } from '../src/services/CordelSynth.js';
import { AudioService, cordelAudio } from '../src/services/AudioService.js';
import {
  buildTrioPresets,
  simulateCortaCanto,
} from '../src/web/panels/ArenaTeamSynergyPanel.js';

describe('CordelSynth em Node/headless', () => {
  it('não lança exceção sem AudioContext e incrementa contadores', () => {
    const synth = new CordelSynth();
    expect(() => synth.play('zabumbaHit')).not.toThrow();
    expect(synth.play('trianguloChime')).toBe(false);
    synth.play('sanfonaChord');
    synth.play('cortaCantoWhistle');
    expect(synth.sfxCount).toBe(4);
    expect(synth.lastPlayedSfx).toBe('cortaCantoWhistle');
    expect(synth.hasAudioContext()).toBe(false);
  });
});

describe('AudioService + CordelSynth', () => {
  it('dispara timbres procedurais mapeados', () => {
    const audio = new AudioService();
    expect(audio.playXiloHitSfx()).toBe(true);
    expect(audio.getSynthStats().lastPlayedSfx).toBe('zabumbaHit');
    audio.playTorcidaCheer();
    expect(audio.getSynthStats().lastPlayedSfx).toBe('sanfonaChord');
    audio.playCortaCantoSfx();
    expect(audio.getSynthStats()).toEqual({ sfxCount: 3, lastPlayedSfx: 'cortaCantoWhistle' });
    expect(audio.getPlayedSfxHistory()).toEqual([
      'sfx_xilo_pah',
      'sfx_canto_especial',
      'sfx_corta_canto',
    ]);
  });

  it('não toca o sintetizador quando mudo ou com volume zero', () => {
    const audio = new AudioService();
    audio.setMuted(true);
    expect(audio.playXiloHitSfx()).toBe(false);
    expect(audio.playCortaCantoSfx()).toBe(false);
    expect(audio.getSynthStats().sfxCount).toBe(0);
    expect(audio.getPlayedSfxHistory()).toHaveLength(0);
    audio.setMuted(false);
    audio.setMasterVolume(0);
    expect(audio.playTorcidaCheer()).toBe(false);
    expect(audio.getSynthStats().sfxCount).toBe(0);
  });

  it('mantém API legada e exporta singleton compartilhado', () => {
    expect(cordelAudio).toBeInstanceOf(AudioService);
    const audio = new AudioService();
    audio.playBgm('bgm_baiao_arena');
    expect(audio.getCurrentBgm()).toBe('bgm_baiao_arena');
    expect(audio.setMasterVolume(2)).toBe(1);
    expect(audio.playSfx('sfx_colheita_milho')).toBe(true);
    expect(audio.getSynthStats().sfxCount).toBe(0);
  });
});

describe('Painel de sinergia & Corta-Canto', () => {
  it('monta 3 trios de classes distintas com sinergias ativas', () => {
    const presets = buildTrioPresets(LAUNCH_ROOSTERS);
    expect(presets.map((p) => p.name)).toEqual([
      'Trio Forró de Brasa',
      'Trio Muralha do Sertão',
      'Trio Relâmpago & Sombra',
    ]);
    for (const preset of presets) {
      expect(new Set(preset.classes).size).toBe(preset.classes.length);
      const res = SynergyResolver.evaluateClasses(preset.classes);
      expect(res.isMonoclassBlocked).toBe(false);
      if (preset.classes.length === 3) expect(res.activeSynergies.length).toBeGreaterThan(0);
    }
  });

  it('interrompe a conjuração após 3 ticks e deixa Canto em 500', () => {
    const spec = LAUNCH_ROOSTERS[0]!;
    const res = simulateCortaCanto(spec);
    expect(res.interrupted).toBe(true);
    expect(res.windupTicksBefore).toBe(CAST_WINDUP_TICKS - 3);
    expect(res.cantoAfter).toBe(500);
  });
});
