import { describe, expect, it } from 'vitest';
import {
  CAMPAIGN_CHAPTER_SPECS,
  CHAPTER_BOSS_SPECS,
  getAllCampaignChapters,
  getAllCampaignStages,
  getCampaignStage,
  getChapterBoss,
} from '../src/index.js';

describe('Catálogo Completo da Campanha 90 Fases & 6 Chefes de Capítulo', () => {
  it('retorna os 6 capítulos da Estrada do Sertão com dados e chefes oficiais', () => {
    const chapters = getAllCampaignChapters();
    expect(chapters).toHaveLength(6);
    expect(CAMPAIGN_CHAPTER_SPECS).toHaveLength(6);

    const expected = [
      { chapter: 1, region: 'Cariri', boss: 'Valentão do Cariri', start: 1, end: 15 },
      { chapter: 2, region: 'Caruaru', boss: 'Zabumba Gigante', start: 16, end: 30 },
      { chapter: 3, region: 'Velho Chico', boss: 'Barqueira do Rio', start: 31, end: 45 },
      { chapter: 4, region: 'Serra da Capivara', boss: 'Caipora Ancestral', start: 46, end: 60 },
      { chapter: 5, region: 'Mar de Jangadas', boss: 'Jangadeiro do Vento', start: 61, end: 75 },
      { chapter: 6, region: 'Raso da Catarina', boss: 'Galo de Ferro', start: 76, end: 90 },
    ];

    expected.forEach((exp, idx) => {
      const ch = chapters[idx]!;
      expect(ch.chapter).toBe(exp.chapter);
      expect(ch.regionName).toBe(exp.region);
      expect(ch.bossName).toBe(exp.boss);
      expect(ch.stageStart).toBe(exp.start);
      expect(ch.stageEnd).toBe(exp.end);
      expect(ch.staminaCostPerStage).toBe(6);
    });
  });

  it('valida os 6 chefes de capítulo com classes, elementos e posicionamento', () => {
    expect(CHAPTER_BOSS_SPECS).toHaveLength(6);

    const bosses = [
      { cap: 1, stage: 15, name: 'Valentão do Cariri', cls: 'Bruiser', elem: 'Brasa', row: 'frente' },
      { cap: 2, stage: 30, name: 'Zabumba Gigante', cls: 'Tanque', elem: 'Barro', row: 'frente' },
      { cap: 3, stage: 45, name: 'Barqueira do Rio', cls: 'Controle', elem: 'Correnteza', row: 'tras' },
      { cap: 4, stage: 60, name: 'Caipora Ancestral', cls: 'Assassino', elem: 'Mata', row: 'tras' },
      { cap: 5, stage: 75, name: 'Jangadeiro do Vento', cls: 'Atirador', elem: 'Vento', row: 'tras' },
      { cap: 6, stage: 90, name: 'Galo de Ferro', cls: 'Tanque/Bruiser', elem: 'Sol', row: 'frente' },
    ];

    bosses.forEach((b) => {
      const boss = getChapterBoss(b.cap);
      expect(boss).toBeDefined();
      expect(boss?.stage).toBe(b.stage);
      expect(boss?.name).toBe(b.name);
      expect(boss?.roosterClass).toBe(b.cls);
      expect(boss?.element).toBe(b.elem);
      expect(boss?.row).toBe(b.row);
    });
    expect(getChapterBoss(999)).toBeUndefined();
  });

  it('garante que todas as 90 fases possuem custo de Fôlego igual a 6 e estrutura válida', () => {
    const allStages = getAllCampaignStages();
    expect(allStages).toHaveLength(90);

    for (let s = 1; s <= 90; s++) {
      const stage = getCampaignStage(s);
      expect(stage.stageNumber).toBe(s);
      expect(stage.chapterNumber).toBe(Math.ceil(s / 15));
      expect(stage.folegoCost).toBe(6);
      expect(stage.firstClearRewards.feathers).toBeGreaterThan(0);
      expect(stage.firstClearRewards.milho).toBeGreaterThan(0);
      expect(stage.firstClearRewards.wildOrbs).toBeGreaterThanOrEqual(0);
      expect(stage.sweepRewards.milho).toBeGreaterThan(0);
      expect(stage.sweepRewards.trainerXp).toBeGreaterThan(0);

      expect(stage.enemyTeam.length).toBeGreaterThan(0);
      for (const foe of stage.enemyTeam) {
        expect(foe.roosterSpecId).toBeTruthy();
        expect(foe.level).toBeGreaterThan(0);
        expect(['frente', 'tras']).toContain(foe.row);
      }
    }
  });

  it('valida escalonamento suave de NG de 1 na fase 1 até 65 na fase 90', () => {
    const first = getCampaignStage(1);
    const last = getCampaignStage(90);
    expect(first.recommendedNg).toBe(1);
    expect(last.recommendedNg).toBe(65);

    let prevNg = 1;
    for (let s = 1; s <= 90; s++) {
      const stage = getCampaignStage(s);
      expect(stage.recommendedNg).toBeGreaterThanOrEqual(prevNg);
      expect(stage.recommendedNg - prevNg).toBeLessThanOrEqual(1);
      prevNg = stage.recommendedNg;
    }
  });

  it('valida que as 6 fases de chefe ocorrem exatamente em 15, 30, 45, 60, 75 e 90', () => {
    const bossStages = [15, 30, 45, 60, 75, 90];
    const bossNames = [
      'Valentão do Cariri',
      'Zabumba Gigante',
      'Barqueira do Rio',
      'Caipora Ancestral',
      'Jangadeiro do Vento',
      'Galo de Ferro',
    ];

    for (let s = 1; s <= 90; s++) {
      const stage = getCampaignStage(s);
      if (bossStages.includes(s)) {
        expect(stage.isBossStage).toBe(true);
        const idx = bossStages.indexOf(s);
        expect(stage.name).toBe(bossNames[idx]);
        expect(stage.firstClearRewards.wildOrbs).toBeGreaterThan(0);
        expect(stage.enemyTeam[0]?.roosterSpecId).toContain('boss_');
      } else {
        expect(stage.isBossStage).toBe(false);
      }
    }
  });

  it('rejeita números de fase fora dos limites com erro descritivo', () => {
    expect(() => getCampaignStage(0)).toThrow('Fase da campanha inválida');
    expect(() => getCampaignStage(91)).toThrow('Fase da campanha inválida');
    expect(() => getCampaignStage(-1)).toThrow('Fase da campanha inválida');
    expect(() => getCampaignStage(12.5)).toThrow('Fase da campanha inválida');
  });
});
