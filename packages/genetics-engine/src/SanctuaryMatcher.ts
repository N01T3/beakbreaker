import type { ElementType, Rarity } from './NinhalCalculator.js';

export type SanctuaryRecipeEffect =
  | 'GUARANTEED_SPECIES'
  | 'CUSTOM_HYBRID'
  | 'RECESSIVE_CREST'
  | 'RECESSIVE_PLUMAGE'
  | 'RARE_PASSIVE'
  | 'DUAL_PASSIVE_INHERITANCE'
  | 'LEGENDARY_PASSIVE'
  | 'RENEW_FERTILITY'
  | 'DOUBLE_MUTATION_RATE'
  | 'PURE_LINEAGE_PERFECT'
  | 'SEASONAL_FESTIVAL_EGG';

export interface SanctuaryRecipe {
  recipeId: number;
  code: string;
  name: string;
  sanctuaryLevel: number;
  requiredSedeLevel: number;
  effectType: SanctuaryRecipeEffect;
  outputSpeciesId?: string;
  outputRarity?: Rarity;
  requiredElements?: readonly [ElementType, ElementType];
}

export const SANCTUARY_LEVEL_TO_SEDE: Record<number, number> = {
  1: 6,
  2: 7,
  3: 8,
  4: 8,
  5: 9,
  6: 10,
  7: 11,
  8: 12,
};

export const SANCTUARY_RECIPES: readonly SanctuaryRecipe[] = [
  // Nível 1 (Sede 6)
  { recipeId: 1, code: 'S1_TROVAO', name: '#18 Trovão do Sertão', sanctuaryLevel: 1, requiredSedeLevel: 6, effectType: 'GUARANTEED_SPECIES', outputSpeciesId: '#18', outputRarity: 'Lendario', requiredElements: ['Brasa', 'Sol'] },
  { recipeId: 2, code: 'S1_MULA', name: '#23 Mula sem Cabeça', sanctuaryLevel: 1, requiredSedeLevel: 6, effectType: 'GUARANTEED_SPECIES', outputSpeciesId: '#23', outputRarity: 'Lendario', requiredElements: ['Brasa', 'Lua'] },
  { recipeId: 3, code: 'S1_CUCA', name: '#24 Cuca do Agreste', sanctuaryLevel: 1, requiredSedeLevel: 6, effectType: 'GUARANTEED_SPECIES', outputSpeciesId: '#24', outputRarity: 'Lendario', requiredElements: ['Lua', 'Mata'] },
  // Nível 2 (Sede 7)
  { recipeId: 4, code: 'S2_ASA_BRANCA', name: '#19 Asa Branca', sanctuaryLevel: 2, requiredSedeLevel: 7, effectType: 'GUARANTEED_SPECIES', outputSpeciesId: '#19', outputRarity: 'Lendario', requiredElements: ['Mata', 'Sol'] },
  { recipeId: 5, code: 'S2_SACI', name: '#22 Saci da Ventania', sanctuaryLevel: 2, requiredSedeLevel: 7, effectType: 'GUARANTEED_SPECIES', outputSpeciesId: '#22', outputRarity: 'Lendario', requiredElements: ['Lua', 'Sol'] },
  { recipeId: 6, code: 'S2_BOITATA', name: '#27 Boitatá de Fogo', sanctuaryLevel: 2, requiredSedeLevel: 7, effectType: 'GUARANTEED_SPECIES', outputSpeciesId: '#27', outputRarity: 'Mitico', requiredElements: ['Brasa', 'Assombracao'] },
  // Nível 3 (Sede 8)
  { recipeId: 7, code: 'S3_REI_BAIAO', name: '#20 Rei do Baião', sanctuaryLevel: 3, requiredSedeLevel: 8, effectType: 'GUARANTEED_SPECIES', outputSpeciesId: '#20', outputRarity: 'Lendario', requiredElements: ['Correnteza', 'Lua'] },
  { recipeId: 8, code: 'S3_HIBRIDO_ENCOMENDA', name: 'Híbrido sob Encomenda', sanctuaryLevel: 3, requiredSedeLevel: 8, effectType: 'CUSTOM_HYBRID' },
  { recipeId: 9, code: 'S3_CRISTA_RECESSIVA', name: 'Crista Recessiva Garantida', sanctuaryLevel: 3, requiredSedeLevel: 8, effectType: 'RECESSIVE_CREST' },
  // Nível 4 (Sede 8)
  { recipeId: 10, code: 'S4_CARCARA', name: '#28 Carcará de Aço', sanctuaryLevel: 4, requiredSedeLevel: 8, effectType: 'GUARANTEED_SPECIES', outputSpeciesId: '#28', outputRarity: 'Mitico', requiredElements: ['Sol', 'Cangaco'] },
  { recipeId: 11, code: 'S4_PLUMAGEM_RECESSIVA', name: 'Plumagem Recessiva Garantida', sanctuaryLevel: 4, requiredSedeLevel: 8, effectType: 'RECESSIVE_PLUMAGE' },
  { recipeId: 12, code: 'S4_PASSIVA_RARA', name: 'Passiva Rara Garantida', sanctuaryLevel: 4, requiredSedeLevel: 8, effectType: 'RARE_PASSIVE' },
  // Nível 5 (Sede 9)
  { recipeId: 13, code: 'S5_CANGACEIRO_DIRETO', name: '#11 Galo Cangaceiro Direto', sanctuaryLevel: 5, requiredSedeLevel: 9, effectType: 'GUARANTEED_SPECIES', outputSpeciesId: '#11', outputRarity: 'Epico', requiredElements: ['Brasa', 'Brasa'] },
  { recipeId: 14, code: 'S5_MATA_GUERREIRO_DIRETO', name: '#12 Galo Mata-Guerreiro Direto', sanctuaryLevel: 5, requiredSedeLevel: 9, effectType: 'GUARANTEED_SPECIES', outputSpeciesId: '#12', outputRarity: 'Epico', requiredElements: ['Mata', 'Mata'] },
  { recipeId: 15, code: 'S5_DUPLA_PASSIVA', name: 'Dupla Herança de Passivas', sanctuaryLevel: 5, requiredSedeLevel: 9, effectType: 'DUAL_PASSIVE_INHERITANCE' },
  // Nível 6 (Sede 10)
  { recipeId: 16, code: 'S6_SOMBRA_ARMORIAL', name: '#26 Sombra Armorial', sanctuaryLevel: 6, requiredSedeLevel: 10, effectType: 'GUARANTEED_SPECIES', outputSpeciesId: '#26', outputRarity: 'Mitico', requiredElements: ['Lua', 'Lua'] },
  { recipeId: 17, code: 'S6_PASSIVA_LENDARIA', name: 'Passiva Lendária Garantida', sanctuaryLevel: 6, requiredSedeLevel: 10, effectType: 'LEGENDARY_PASSIVE' },
  { recipeId: 18, code: 'S6_FERTILIDADE_RENOVADA', name: 'Fertilidade Renovada (+ cruzamentos)', sanctuaryLevel: 6, requiredSedeLevel: 10, effectType: 'RENEW_FERTILITY' },
  // Nível 7 (Sede 11)
  { recipeId: 19, code: 'S7_GUARDIAO_MATA_DIRETO', name: '#25 Guardião da Mata Direto', sanctuaryLevel: 7, requiredSedeLevel: 11, effectType: 'GUARANTEED_SPECIES', outputSpeciesId: '#25', outputRarity: 'Mitico', requiredElements: ['Mata', 'Correnteza'] },
  { recipeId: 20, code: 'S7_BRASA_SERTAO_DIRETO', name: '#21 Galo Brasa-do-Sertão Direto', sanctuaryLevel: 7, requiredSedeLevel: 11, effectType: 'GUARANTEED_SPECIES', outputSpeciesId: '#21', outputRarity: 'Lendario', requiredElements: ['Brasa', 'Brasa'] },
  { recipeId: 21, code: 'S7_MUTACAO_DOBRADA', name: 'Mutação Dobrada (5% -> 10%)', sanctuaryLevel: 7, requiredSedeLevel: 11, effectType: 'DOUBLE_MUTATION_RATE' },
  // Nível 8 (Sede 12)
  { recipeId: 22, code: 'S8_ASA_BRANCA_CELESTIAL', name: '#29 Asa Branca Celestial', sanctuaryLevel: 8, requiredSedeLevel: 12, effectType: 'GUARANTEED_SPECIES', outputSpeciesId: '#29', outputRarity: 'Mitico', requiredElements: ['Sol', 'Correnteza'] },
  { recipeId: 23, code: 'S8_LINHAGEM_PURA', name: 'Linhagem Pura Perfeita', sanctuaryLevel: 8, requiredSedeLevel: 12, effectType: 'PURE_LINEAGE_PERFECT' },
  { recipeId: 24, code: 'S8_OVO_FESTA_SAZONAL', name: 'Ovo de Festa Sazonal', sanctuaryLevel: 8, requiredSedeLevel: 12, effectType: 'SEASONAL_FESTIVAL_EGG' },
] as const;

export interface SanctuaryExecutionRequest {
  recipeIdOrCode: number | string;
  playerSanctuaryLevel: number;
  playerSedeLevel: number;
  fatherElement?: ElementType;
  motherElement?: ElementType;
}

export interface SanctuaryExecutionResult {
  recipe: SanctuaryRecipe;
  guaranteedSpeciesId: string | null;
  effectApplied: SanctuaryRecipeEffect;
  fertilityBonusCrossings: number;
  mutationRateMultiplier: number;
}

export function getSanctuaryRecipe(recipeIdOrCode: number | string): SanctuaryRecipe | null {
  return (
    SANCTUARY_RECIPES.find(
      (r) => r.recipeId === recipeIdOrCode || r.code === recipeIdOrCode
    ) ?? null
  );
}

export function getUnlockedSanctuaryRecipes(
  sanctuaryLevel: number,
  sedeLevel: number
): SanctuaryRecipe[] {
  return SANCTUARY_RECIPES.filter(
    (r) =>
      r.sanctuaryLevel <= sanctuaryLevel && r.requiredSedeLevel <= sedeLevel
  );
}

export function canExecuteSanctuaryRecipe(req: SanctuaryExecutionRequest): {
  allowed: boolean;
  reason?: string;
} {
  const recipe = getSanctuaryRecipe(req.recipeIdOrCode);
  if (!recipe) {
    return { allowed: false, reason: 'Recipe not found' };
  }
  if (req.playerSedeLevel < recipe.requiredSedeLevel) {
    return {
      allowed: false,
      reason: `Requires Sede ${recipe.requiredSedeLevel} (current: ${req.playerSedeLevel})`,
    };
  }
  if (req.playerSanctuaryLevel < recipe.sanctuaryLevel) {
    return {
      allowed: false,
      reason: `Requires Sanctuary Lv.${recipe.sanctuaryLevel} (current: ${req.playerSanctuaryLevel})`,
    };
  }
  if (recipe.requiredElements && req.fatherElement && req.motherElement) {
    const [e1, e2] = recipe.requiredElements;
    const match =
      (req.fatherElement === e1 && req.motherElement === e2) ||
      (req.fatherElement === e2 && req.motherElement === e1);
    if (!match) {
      return {
        allowed: false,
        reason: `Parent elements do not match required pair ${e1}+${e2}`,
      };
    }
  }
  return { allowed: true };
}

export function executeSanctuaryRecipe(
  req: SanctuaryExecutionRequest
): SanctuaryExecutionResult {
  const check = canExecuteSanctuaryRecipe(req);
  if (!check.allowed) {
    throw new Error(check.reason ?? 'Sanctuary recipe execution denied');
  }
  const recipe = getSanctuaryRecipe(req.recipeIdOrCode)!;
  return {
    recipe,
    guaranteedSpeciesId: recipe.outputSpeciesId ?? null,
    effectApplied: recipe.effectType,
    fertilityBonusCrossings: recipe.effectType === 'RENEW_FERTILITY' ? 5 : 0,
    mutationRateMultiplier: recipe.effectType === 'DOUBLE_MUTATION_RATE' ? 2 : 1,
  };
}
