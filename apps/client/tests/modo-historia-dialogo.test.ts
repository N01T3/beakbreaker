import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import path from 'node:path';
import fs from 'node:fs';
import { ModoHistoriaDialogoPanel, STORY_CHAPTERS } from '../src/web/panels/ModoHistoriaDialogoPanel.js';
import { ArenaTabView } from '../src/web/ArenaTabView.js';
import { cordelAudio } from '../src/services/AudioService.js';
import { createWebRuntime } from '../src/web/createWebRuntime.js';

describe('Modo História — Diálogos de Cordel (Visual Novel Sertaneja)', () => {
  it('renderiza os 6 capítulos, retrato do interlocutor, balão de diálogo e escolhas', async () => {
    const html = await renderToString(h(ModoHistoriaDialogoPanel));
    expect(html).toContain('data-testid="modo-historia-dialogo-panel"');
    expect(html).toContain('data-testid="chapter-selector"');
    for (let i = 1; i <= 6; i++) {
      expect(html).toContain(`data-testid="btn-chapter-${i}"`);
    }
    expect(html).toContain('data-testid="portrait-speaker"');
    expect(html).toContain('Vô Tonho');
    expect(html).toContain('Mentor do Sertão');
    expect(html).toContain('data-testid="verse-counter"');
    expect(html).toContain('Verso 1/2');
    expect(html).toContain('data-testid="verse-text"');
    expect(html).toContain('No Cariri sagrado');
    expect(html).toContain('data-testid="btn-choice-0"');
    expect(html).toContain('data-testid="btn-choice-1"');
    expect(html).toContain('Honrar a Tradição');
    expect(html).toContain('data-testid="btn-advance-verse"');
    expect(html).toContain('data-testid="btn-skip-chapter"');
  });

  it('permite alternar entre os 6 capítulos com retratos e regiões corretas', () => {
    let exposed: any = {};
    (ModoHistoriaDialogoPanel as any).setup({}, { expose: (o: any) => { exposed = o; } });
    expect(exposed.chapters.length).toBe(6);

    const expected = [
      { id: 1, region: 'Cariri', speaker: 'Vô Tonho' },
      { id: 2, region: 'Caruaru', speaker: 'Cantador' },
      { id: 3, region: 'Velho Chico', speaker: 'Cantador' },
      { id: 4, region: 'Serra da Capivara', speaker: 'Galo Campeão' },
      { id: 5, region: 'Mar de Jangadas', speaker: 'Cantador' },
      { id: 6, region: 'Raso da Catarina', speaker: 'Coronel Ferrabrás' },
    ];

    expected.forEach((exp, idx) => {
      exposed.selectChapter(idx);
      expect(exposed.currentChapterIndex.value).toBe(idx);
      expect(exposed.chapters[idx].region).toBe(exp.region);
      expect(exposed.chapters[idx].speaker.name).toBe(exp.speaker);
      expect(exposed.currentVerseIndex.value).toBe(0);
      expect(exposed.isCompleted.value).toBe(false);
    });
  });

  it('processa escolhas do treinador com bônus, reação e efeito sonoro', () => {
    const spy = vi.spyOn(cordelAudio, 'playTrianguloReward');
    let exposed: any = {};
    (ModoHistoriaDialogoPanel as any).setup({}, { expose: (o: any) => { exposed = o; } });

    exposed.selectChoice(0);
    expect(exposed.selectedChoiceIndex.value).toBe(0);
    expect(exposed.choiceFeedback.value).toContain('Vô Tonho sorri');
    expect(exposed.choiceFeedback.value).toContain('+300 Milho');
    expect(spy).toHaveBeenCalled();

    exposed.selectChoice(1);
    expect(exposed.selectedChoiceIndex.value).toBe(1);
    expect(exposed.choiceFeedback.value).toContain('Vô Tonho acena');
    expect(exposed.choiceFeedback.value).toContain('+1 Fôlego');
    spy.mockRestore();
  });

  it('navega versos com avanço, salto para fim, áudio procedural e banner de conclusão', () => {
    const sfxSpy = vi.spyOn(cordelAudio, 'playZabumbaTabSwitch');
    const vicSpy = vi.spyOn(cordelAudio, 'playSanfonaVictory');
    const triSpy = vi.spyOn(cordelAudio, 'playTrianguloReward');

    let exposed: any = {};
    (ModoHistoriaDialogoPanel as any).setup({}, { expose: (o: any) => { exposed = o; } });

    expect(exposed.currentVerseIndex.value).toBe(0);
    exposed.advanceVerse();
    expect(exposed.currentVerseIndex.value).toBe(1);
    expect(sfxSpy).toHaveBeenCalled();
    expect(exposed.isCompleted.value).toBe(false);

    exposed.advanceVerse();
    expect(exposed.isCompleted.value).toBe(true);
    expect(vicSpy).toHaveBeenCalled();

    exposed.selectChapter(5);
    expect(exposed.isCompleted.value).toBe(false);
    exposed.skipChapter();
    expect(exposed.isCompleted.value).toBe(true);
    expect(exposed.currentVerseIndex.value).toBe(1);
    expect(triSpy).toHaveBeenCalled();

    sfxSpy.mockRestore();
    vicSpy.mockRestore();
    triSpy.mockRestore();
  });

  it('integra ModoHistoriaDialogoPanel no ArenaTabView com seletor de modo historia', async () => {
    const runtime = createWebRuntime();
    const html = await renderToString(h(ArenaTabView, { runtime }));
    expect(html).toContain('data-testid="btn-select-mode-historia"');
    expect(html).toContain('Modo História');
    expect(html).toContain('data-testid="modo-historia-dialogo-panel"');
  });

  it('respeita os limites de linhas (< 180) e zero termos proibidos pela Lei 9.605/98', () => {
    const files = [
      path.resolve(__dirname, '../src/web/panels/ModoHistoriaDialogoPanel.ts'),
      path.resolve(__dirname, '../src/web/ArenaTabView.ts'),
      path.resolve(__dirname, './modo-historia-dialogo.test.ts'),
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
