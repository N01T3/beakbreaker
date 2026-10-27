import { describe, expect, it } from 'vitest';
import {
  BASE_REST_TIME_MINUTES,
  INFIRMARY_BED_SPECS,
  INFIRMARY_POTIONS,
  INFIRMARY_REST_SPEC,
  STRAW_BED_REST_TIME_MINUTES,
  getAllInfirmaryPotions,
  getInfirmaryBedCapacity,
  getPotionById,
} from '../src/index.js';

describe('Enfermaria Rural & Poções de Arnica do Sertão', () => {
  it('retorna exatamente as 6 poções e ungüentos tradicionais', () => {
    const potions = getAllInfirmaryPotions();
    expect(potions).toHaveLength(6);
    expect(INFIRMARY_POTIONS).toHaveLength(6);

    const expectedIds = [
      'unguento_arnica',
      'cha_de_erva_cidreira',
      'garrafada_do_sertao',
      'oleo_de_pequi',
      'rapadura_energetica',
      'elixir_da_serra',
    ];

    expect(potions.map((p) => p.id)).toEqual(expectedIds);
  });

  it('valida os custos em milho de todas as poções', () => {
    const potions = getAllInfirmaryPotions();
    for (const potion of potions) {
      expect(potion.cornCost).toBeGreaterThan(0);
      expect(potion.milhoCost).toBe(potion.cornCost);
      expect(potion.cost.milho).toBe(potion.cornCost);
    }

    expect(getPotionById('unguento_arnica')?.cornCost).toBe(250);
    expect(getPotionById('cha_de_erva_cidreira')?.cornCost).toBe(150);
    expect(getPotionById('garrafada_do_sertao')?.cornCost).toBe(400);
    expect(getPotionById('oleo_de_pequi')?.cornCost).toBe(400);
    expect(getPotionById('rapadura_energetica')?.cornCost).toBe(300);
    expect(getPotionById('elixir_da_serra')?.cornCost).toBe(500);
  });

  it('valida efeitos, valores e durações específicas de cada poção', () => {
    const arnica = getPotionById('unguento_arnica');
    expect(arnica).toBeDefined();
    expect(arnica?.name).toBe('Ungüento de Arnica');
    expect(arnica?.effectType).toBe('cura_vigor');
    expect(arnica?.effectValue).toBe(50);

    const cidreira = getPotionById('cha_de_erva_cidreira');
    expect(cidreira).toBeDefined();
    expect(cidreira?.name).toBe('Chá de Erva-Cidreira');
    expect(cidreira?.effectType).toBe('remove_debuffs');

    const garrafada = getPotionById('garrafada_do_sertao');
    expect(garrafada).toBeDefined();
    expect(garrafada?.name).toBe('Garrafada do Sertão');
    expect(garrafada?.effectType).toBe('buff_forca');
    expect(garrafada?.effectValue).toBe(15);
    expect(garrafada?.durationCombats).toBe(3);

    const pequi = getPotionById('oleo_de_pequi');
    expect(pequi).toBeDefined();
    expect(pequi?.name).toBe('Óleo de Pequi');
    expect(pequi?.effectType).toBe('buff_defesa');
    expect(pequi?.effectValue).toBe(20);
    expect(pequi?.durationCombats).toBe(3);

    const rapadura = getPotionById('rapadura_energetica');
    expect(rapadura).toBeDefined();
    expect(rapadura?.name).toBe('Rapadura Energética');
    expect(rapadura?.effectType).toBe('restaura_folego');
    expect(rapadura?.effectValue).toBe(30);
    expect(rapadura?.dailyUsageLimit).toBe(2);

    const elixir = getPotionById('elixir_da_serra');
    expect(elixir).toBeDefined();
    expect(elixir?.name).toBe('Elixir da Serra');
    expect(elixir?.effectType).toBe('canto_inicial');
    expect(elixir?.effectValue).toBe(100);
    expect(elixir?.durationCombats).toBe(1);
  });

  it('retorna undefined para IDs de poção inexistentes', () => {
    expect(getPotionById('pocao_fantasma')).toBeUndefined();
  });

  it('calcula capacidade de leitos conforme progressão da Sede', () => {
    expect(getInfirmaryBedCapacity(0)).toBe(0);
    expect(getInfirmaryBedCapacity(1)).toBe(2);
    expect(getInfirmaryBedCapacity(2)).toBe(2);
    expect(getInfirmaryBedCapacity(5)).toBe(2);
    expect(getInfirmaryBedCapacity(6)).toBe(4);
    expect(getInfirmaryBedCapacity(11)).toBe(4);
    expect(getInfirmaryBedCapacity(12)).toBe(6);
    expect(getInfirmaryBedCapacity(15)).toBe(6);

    expect(INFIRMARY_BED_SPECS).toHaveLength(3);
    expect(INFIRMARY_BED_SPECS[0]?.bedCapacity).toBe(2);
    expect(INFIRMARY_BED_SPECS[1]?.bedCapacity).toBe(4);
    expect(INFIRMARY_BED_SPECS[2]?.bedCapacity).toBe(6);
  });

  it('valida tempos de descanso natural e redução por cama de palha de milho', () => {
    expect(BASE_REST_TIME_MINUTES).toBe(60);
    expect(STRAW_BED_REST_TIME_MINUTES).toBe(30);
    expect(INFIRMARY_REST_SPEC.baseRestMinutes).toBe(60);
    expect(INFIRMARY_REST_SPEC.strawBedRestMinutes).toBe(30);
    expect(INFIRMARY_REST_SPEC.vigorRecoveryPercent).toBe(100);
  });
});
