export type PotionEffectType =
  | 'cura_vigor'
  | 'remove_debuffs'
  | 'buff_forca'
  | 'buff_defesa'
  | 'restaura_folego'
  | 'canto_inicial'
  | 'heal_vigor'
  | 'cleanse_debuffs'
  | 'buff_strength'
  | 'buff_defense'
  | 'restore_folego'
  | 'initial_canto';

export interface InfirmaryBedSpec {
  sedeLevel: number;
  bedCapacity: number;
  beds?: number;
}

export interface InfirmaryRestSpec {
  baseRestMinutes: number;
  strawBedRestMinutes: number;
  vigorRecoveryPercent: number;
}

export interface InfirmaryPotionSpec {
  id: string;
  name: string;
  description: string;
  effectType: PotionEffectType;
  effectValue: number;
  durationCombats?: number;
  dailyUsageLimit?: number;
  cornCost: number;
  milhoCost: number;
  cost: {
    milho: number;
  };
}

export const BASE_REST_TIME_MINUTES = 60;
export const STRAW_BED_REST_TIME_MINUTES = 30;

export const INFIRMARY_REST_SPEC: InfirmaryRestSpec = {
  baseRestMinutes: 60,
  strawBedRestMinutes: 30,
  vigorRecoveryPercent: 100,
};

export const INFIRMARY_BED_SPECS: readonly InfirmaryBedSpec[] = [
  { sedeLevel: 1, bedCapacity: 2, beds: 2 },
  { sedeLevel: 6, bedCapacity: 4, beds: 4 },
  { sedeLevel: 12, bedCapacity: 6, beds: 6 },
] as const;

export const INFIRMARY_POTIONS: readonly InfirmaryPotionSpec[] = [
  {
    id: 'unguento_arnica',
    name: 'Ungüento de Arnica',
    description: 'Cura instantânea de 50% do Vigor na enfermaria.',
    effectType: 'cura_vigor',
    effectValue: 50,
    cornCost: 250,
    milhoCost: 250,
    cost: { milho: 250 },
  },
  {
    id: 'cha_de_erva_cidreira',
    name: 'Chá de Erva-Cidreira',
    description: 'Remove todos os debuffs e reduz fadiga de combate.',
    effectType: 'remove_debuffs',
    effectValue: 1,
    cornCost: 150,
    milhoCost: 150,
    cost: { milho: 150 },
  },
  {
    id: 'garrafada_do_sertao',
    name: 'Garrafada do Sertão',
    description: 'Buff temporário (+15% Força por 3 combates).',
    effectType: 'buff_forca',
    effectValue: 15,
    durationCombats: 3,
    cornCost: 400,
    milhoCost: 400,
    cost: { milho: 400 },
  },
  {
    id: 'oleo_de_pequi',
    name: 'Óleo de Pequi',
    description: 'Buff temporário (+20% Defesa por 3 combates).',
    effectType: 'buff_defesa',
    effectValue: 20,
    durationCombats: 3,
    cornCost: 400,
    milhoCost: 400,
    cost: { milho: 400 },
  },
  {
    id: 'rapadura_energetica',
    name: 'Rapadura Energética',
    description: 'Restaura 30 de Fôlego imediatamente (máximo 2 usos por dia).',
    effectType: 'restaura_folego',
    effectValue: 30,
    dailyUsageLimit: 2,
    cornCost: 300,
    milhoCost: 300,
    cost: { milho: 300 },
  },
  {
    id: 'elixir_da_serra',
    name: 'Elixir da Serra',
    description: 'Concede +100 Canto inicial no próximo combate.',
    effectType: 'canto_inicial',
    effectValue: 100,
    durationCombats: 1,
    cornCost: 500,
    milhoCost: 500,
    cost: { milho: 500 },
  },
] as const;

export function getAllInfirmaryPotions(): readonly InfirmaryPotionSpec[] {
  return INFIRMARY_POTIONS;
}

export function getPotionById(id: string): InfirmaryPotionSpec | undefined {
  return INFIRMARY_POTIONS.find((potion) => potion.id === id);
}

export function getInfirmaryBedCapacity(sedeLevel: number): number {
  if (sedeLevel < 1) return 0;
  if (sedeLevel >= 12) return 6;
  if (sedeLevel >= 6) return 4;
  return 2;
}
