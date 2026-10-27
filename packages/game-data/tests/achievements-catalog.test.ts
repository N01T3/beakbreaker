import { describe, expect, it } from 'vitest';
import {
  CORDEL_ACHIEVEMENTS,
  calculateTotalAchievementFeathers,
  getAchievementById,
  getAchievementsByCategory,
  getAllCordelAchievements,
} from '../src/index.js';

describe('Catálogo de Conquistas do Cordel', () => {
  it('deve conter exatamente 50 conquistas no catálogo oficial', () => {
    const all = getAllCordelAchievements();
    expect(all).toHaveLength(50);
    expect(CORDEL_ACHIEVEMENTS).toHaveLength(50);
  });

  it('deve possuir IDs únicos para todas as 50 conquistas', () => {
    const all = getAllCordelAchievements();
    const ids = all.map((item) => item.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(50);
  });

  it('deve distribuir as conquistas exatamente nas 4 categorias oficiais', () => {
    const criacao = getAchievementsByCategory('CRIACAO');
    const combate = getAchievementsByCategory('COMBATE');
    const fazenda = getAchievementsByCategory('FAZENDA');
    const colecao = getAchievementsByCategory('COLECAO');

    expect(criacao).toHaveLength(12);
    expect(combate).toHaveLength(15);
    expect(fazenda).toHaveLength(12);
    expect(colecao).toHaveLength(11);

    expect(criacao.length + combate.length + fazenda.length + colecao.length).toBe(50);

    for (const item of criacao) expect(item.category).toBe('CRIACAO');
    for (const item of combate) expect(item.category).toBe('COMBATE');
    for (const item of fazenda) expect(item.category).toBe('FAZENDA');
    for (const item of colecao) expect(item.category).toBe('COLECAO');
  });

  it('deve recuperar conquista específica por ID ou retornar undefined', () => {
    const firstCriacao = getAchievementById('ach_cri_01');
    expect(firstCriacao).toBeDefined();
    expect(firstCriacao?.name).toBe('Primeiro Galeto');
    expect(firstCriacao?.category).toBe('CRIACAO');
    expect(firstCriacao?.reward.title).toBe('Iniciante do Sertão');

    const torre = getAchievementById('ach_com_05');
    expect(torre).toBeDefined();
    expect(torre?.name).toBe('Fúria da Torre');
    expect(torre?.category).toBe('COMBATE');

    const missing = getAchievementById('ach_inexistente');
    expect(missing).toBeUndefined();
  });

  it('deve conter atributos e valores de metas consistentes e positivos', () => {
    const all = getAllCordelAchievements();
    for (const ach of all) {
      expect(ach.id.length).toBeGreaterThan(0);
      expect(ach.name.trim().length).toBeGreaterThan(0);
      expect(ach.description.trim().length).toBeGreaterThan(0);
      expect(ach.targetValue).toBeGreaterThan(0);
      expect(ach.reward.goldenFeathers).toBeGreaterThan(0);
      expect(ach.reward.breederXp).toBeGreaterThan(0);

      if (ach.reward.title !== undefined) {
        expect(ach.reward.title.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('deve somar corretamente o total de penas douradas do catálogo', () => {
    const totalFeathers = calculateTotalAchievementFeathers();
    const manualSum = getAllCordelAchievements().reduce(
      (acc, curr) => acc + curr.reward.goldenFeathers,
      0
    );

    expect(totalFeathers).toBe(manualSum);
    expect(totalFeathers).toBe(8640);
  });

  it('deve incluir conquistas icônicas citadas no GDD v5.0', () => {
    const names = getAllCordelAchievements().map((a) => a.name);
    expect(names).toContain('Primeiro Galeto');
    expect(names).toContain('Mestre do Ninhal');
    expect(names).toContain('Genética Pura');
    expect(names).toContain('Herdeiro Astral');
    expect(names).toContain('Lenda de Ouro');
    expect(names).toContain('Pai de Família');
    expect(names).toContain('Primeiro Canto');
    expect(names).toContain('Corta-Canto Perfeito');
    expect(names).toContain('Vencedor do Cariri');
    expect(names).toContain('Derrubador de Colosso');
    expect(names).toContain('Fúria da Torre');
    expect(names).toContain('Supremo Campeão');
    expect(names).toContain('Celeiro Cheio');
    expect(names).toContain('Sede de Ouro');
    expect(names).toContain('Rei do Milho');
    expect(names).toContain('Guardião Rural');
    expect(names).toContain('Terra Adubada');
    expect(names).toContain('Santo Protetor');
    expect(names).toContain('Álbum Completo 40');
    expect(names).toContain('Seis Primordiais');
    expect(names).toContain('Conjunto Brasa Viva +15');
    expect(names).toContain('Plumagem Dourada');
    expect(names).toContain('Amigo do Vô Tonho');
  });
});
