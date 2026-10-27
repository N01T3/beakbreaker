import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import path from 'node:path';
import fs from 'node:fs';
import { TVSertaoReplayPanel } from '../src/web/panels/TVSertaoReplayPanel.js';
import { ArenaTabView } from '../src/web/ArenaTabView.js';
import { cordelAudio } from '../src/services/AudioService.js';
import { createWebRuntime } from '../src/web/createWebRuntime.js';

describe('Prancha 19 — TV Sertão Ao Vivo & Player Interativo de Replay', () => {
  it('renderiza TV Sertão Ao Vivo com topo do ranking, cronômetro do Bolão e palpite', async () => {
    const html = await renderToString(h(TVSertaoReplayPanel, { initialMode: 'aovivo' }));
    expect(html).toContain('data-testid="tv-sertao-replay-panel"');
    expect(html).toContain('data-testid="top-ranking-broadcast"');
    expect(html).toContain('Time Lampião');
    expect(html).toContain('Bando da Caatinga');
    expect(html).toContain('data-testid="bolao-comunitario-card"');
    expect(html).toContain('data-testid="bolao-timer"');
    expect(html).toContain('05:00');
    expect(html).toContain('data-testid="btn-select-time-azul"');
    expect(html).toContain('data-testid="btn-select-time-vermelho"');
    expect(html).toContain('data-testid="btn-confirmar-palpite"');
    expect(html).toContain('data-testid="emotes-bar"');

    let exposed: any = {};
    (TVSertaoReplayPanel as any).setup({ initialMode: 'aovivo' }, { expose: (o: any) => { exposed = o; } });
    expect(exposed.formattedTimer.value).toBe('05:00');

    exposed.handleConfirmPalpite();
    expect(exposed.palpiteStatus.value).toContain('Selecione Time Azul ou Vermelho');

    exposed.selectedWinner.value = 'azul';
    exposed.handleConfirmPalpite();
    expect(exposed.palpiteStatus.value).toContain('Palpite de 500 Milho registrado no Time Azul! Recompensa: 1.000 Milho (2x)');

    exposed.selectedWinner.value = 'vermelho';
    exposed.handleConfirmPalpite();
    expect(exposed.palpiteStatus.value).toContain('Time Vermelho');
  });

  it('dispara efeitos sonoros de cordel e feedback visual nas reações de emotes', () => {
    let exposed: any = {};
    (TVSertaoReplayPanel as any).setup({}, { expose: (o: any) => { exposed = o; } });

    const spyZabumba = vi.spyOn(cordelAudio, 'playZabumbaTabSwitch');
    const spyApito = vi.spyOn(cordelAudio, 'playApitoCortaCanto');
    const spyTorcida = vi.spyOn(cordelAudio, 'playTorcidaCheer');
    const spyChapeu = vi.spyOn(cordelAudio, 'playGaloCantoSupreme');
    const spyMilho = vi.spyOn(cordelAudio, 'playHarvestMilho');

    exposed.triggerEmote('zabumba', () => cordelAudio.playZabumbaTabSwitch(), 'Zabumba');
    expect(spyZabumba).toHaveBeenCalled();

    exposed.triggerEmote('apito', () => cordelAudio.playApitoCortaCanto(), 'Apito');
    expect(spyApito).toHaveBeenCalled();

    exposed.triggerEmote('torcida', () => cordelAudio.playTorcidaCheer(), 'Torcida');
    expect(spyTorcida).toHaveBeenCalled();

    exposed.triggerEmote('chapeu', () => cordelAudio.playGaloCantoSupreme(), 'Chapéu');
    expect(spyChapeu).toHaveBeenCalled();

    exposed.triggerEmote('espiga', () => cordelAudio.playHarvestMilho(), 'Espiga');
    expect(spyMilho).toHaveBeenCalled();
  });

  it('renderiza e gerencia Replay Interativo com timeline scrubber, velocidades e log', async () => {
    const html = await renderToString(h(TVSertaoReplayPanel, { initialMode: 'replay' }));
    expect(html).toContain('data-testid="tv-sertao-replay-section"');
    expect(html).toContain('data-testid="replay-timeline-slider"');
    expect(html).toContain('data-testid="replay-elapsed-time"');
    expect(html).toContain('data-testid="btn-replay-play-pause"');
    expect(html).toContain('data-testid="btn-replay-rewind"');
    expect(html).toContain('data-testid="btn-replay-forward"');
    expect(html).toContain('data-testid="btn-replay-speed-0.5x"');
    expect(html).toContain('data-testid="btn-replay-speed-1x"');
    expect(html).toContain('data-testid="btn-replay-speed-2x"');
    expect(html).toContain('data-testid="btn-replay-speed-4x"');
    expect(html).toContain('data-testid="replay-events-log"');
    expect(html).toContain('Golpe Crítico');
    expect(html).toContain('Corta-Canto');
    expect(html).toContain('Finalização Épica');

    let exposed: any = {};
    (TVSertaoReplayPanel as any).setup({ initialMode: 'replay' }, { expose: (o: any) => { exposed = o; } });
    expect(exposed.currentTick.value).toBe(45);

    exposed.playbackSpeed.value = 2;
    expect(exposed.playbackSpeed.value).toBe(2);

    exposed.currentTick.value = Math.max(0, exposed.currentTick.value - 20);
    expect(exposed.currentTick.value).toBe(25);

    exposed.currentTick.value = Math.min(100, exposed.currentTick.value + 20);
    expect(exposed.currentTick.value).toBe(45);
  });

  it('copia código compartilhável do duelo e integra TV Sertão no ArenaTabView', async () => {
    let exposed: any = {};
    (TVSertaoReplayPanel as any).setup({}, { expose: (o: any) => { exposed = o; } });

    expect(exposed.shareCode).toBe('#sertao-replay-lampiao-v5');
    exposed.handleCopy();
    expect(exposed.copyFeedback.value).toContain('#sertao-replay-lampiao-v5');

    const runtime = createWebRuntime();
    const html = await renderToString(h(ArenaTabView, { runtime }));
    expect(html).toContain('data-testid="btn-select-mode-tv-sertao"');
    expect(html).toContain('data-testid="tv-sertao-replay-panel"');
  });

  it('respeita os limites de linhas (< 180) e zero termos proibidos pela Lei 9.605/98', () => {
    const files = [
      path.resolve(__dirname, '../src/web/panels/TVSertaoReplayPanel.ts'),
      path.resolve(__dirname, '../src/web/ArenaTabView.ts'),
      path.resolve(__dirname, '../src/services/AudioService.ts'),
      path.resolve(__dirname, './tv-sertao-replay-prancha19.test.ts'),
    ];
    const forbidden = ['r' + 'inha', 'r' + 'inhadeiro', 'gal' + 'ista', 'esp' + 'ora', 'ap' + 'osta'];
    const regex = new RegExp(`\\b(${forbidden.join('|')})\\b`, 'i');

    for (const f of files) {
      const content = fs.readFileSync(f, 'utf-8');
      const lines = content.split('\n').length;
      expect(lines).toBeLessThan(180);
      const match = content.match(regex);
      expect(match).toBeNull();
    }
  });
});
