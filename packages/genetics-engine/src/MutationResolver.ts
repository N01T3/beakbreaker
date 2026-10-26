import type { BreedingParent, ElementType, Rarity } from './NinhalCalculator.js';

export type EvolutionBiome = 'Caatinga' | 'Agreste';
export type EvolutionCatalyst = 'PimentaBrasa' | 'FolhaSagrada';

export interface SecretMutationDefinition {
  pair: readonly [ElementType, ElementType];
  speciesId: string;
  name: string;
  minSeason: number;
  rarity: Rarity;
}

export const SECRET_MUTATIONS: readonly SecretMutationDefinition[] = [
  { pair: ['Lua', 'Lua'], speciesId: '#26', name: 'Sombra Armorial', minSeason: 1, rarity: 'Mitico' },
  { pair: ['Brasa', 'Correnteza'], speciesId: 'S03_VAPOR', name: 'Galo de Vapor', minSeason: 3, rarity: 'Mitico' },
  { pair: ['Brasa', 'Mata'], speciesId: 'S05_QUEIMADA', name: 'Galo Queimada', minSeason: 5, rarity: 'Mitico' },
  { pair: ['Correnteza', 'Sol'], speciesId: 'S07_MARE_ALTA', name: 'Galo Maré Alta', minSeason: 7, rarity: 'Mitico' },
  { pair: ['Correnteza', 'Mata'], speciesId: 'S09_MANGUE', name: 'Galo do Mangue', minSeason: 9, rarity: 'Mitico' },
  { pair: ['Sol', 'Sol'], speciesId: 'S11_ECLIPSE', name: 'Galo Eclipse', minSeason: 11, rarity: 'Mitico' },
] as const;

export interface MutationRollOptions {
  currentSeason?: number;
  hasTorreDoCangacoBuff?: boolean;
  hasSanctuaryDoubleMutation?: boolean;
  rollValue?: number;
}

export interface MutationResolutionResult {
  eligible: boolean;
  mutationChance: number;
  triggered: boolean;
  secretMutation: SecretMutationDefinition | null;
  isGoldenPlumage: boolean;
  rarePassiveGranted: boolean;
}

export function findSecretMutation(
  elemA: ElementType,
  elemB: ElementType,
  currentSeason = 1
): SecretMutationDefinition | null {
  for (const mut of SECRET_MUTATIONS) {
    const [p1, p2] = mut.pair;
    const matchesPair = (p1 === elemA && p2 === elemB) || (p1 === elemB && p2 === elemA);
    if (matchesPair && currentSeason >= mut.minSeason) return mut;
  }
  return null;
}

export function resolveBreedingMutation(
  father: Pick<BreedingParent, 'ng' | 'primaryElement'>,
  mother: Pick<BreedingParent, 'ng' | 'primaryElement'>,
  options: MutationRollOptions = {}
): MutationResolutionResult {
  const eligible = father.ng >= 30 && mother.ng >= 30;
  const isDoubled = Boolean(options.hasTorreDoCangacoBuff || options.hasSanctuaryDoubleMutation);
  const mutationChance = eligible ? (isDoubled ? 0.1 : 0.05) : 0;

  if (!eligible) {
    return { eligible: false, mutationChance: 0, triggered: false, secretMutation: null, isGoldenPlumage: false, rarePassiveGranted: false };
  }

  const roll = options.rollValue ?? Math.random();
  if (roll >= mutationChance) {
    return { eligible: true, mutationChance, triggered: false, secretMutation: null, isGoldenPlumage: false, rarePassiveGranted: false };
  }

  const secretMutation = findSecretMutation(father.primaryElement, mother.primaryElement, options.currentSeason ?? 1);
  if (secretMutation) {
    return { eligible: true, mutationChance, triggered: true, secretMutation, isGoldenPlumage: false, rarePassiveGranted: false };
  }

  return { eligible: true, mutationChance, triggered: true, secretMutation: null, isGoldenPlumage: true, rarePassiveGranted: true };
}

export interface BranchedEvolutionResult {
  sourceRoosterId: string;
  targetSpeciesId: '#11' | '#12' | '#21' | '#25';
  targetName: string;
  targetRarity: Rarity;
  tierNg: 20 | 40;
  biome: EvolutionBiome;
  catalyst: EvolutionCatalyst;
}

export function resolveBranchedEvolution(
  roosterId: string,
  ng: number,
  biome: EvolutionBiome,
  catalyst: EvolutionCatalyst
): BranchedEvolutionResult {
  if (ng < 20) {
    throw new Error('Rooster must reach at least NG 20 for branched evolution');
  }
  if ((biome === 'Caatinga' && catalyst !== 'PimentaBrasa') || (biome === 'Agreste' && catalyst !== 'FolhaSagrada')) {
    throw new Error(`Invalid biome and catalyst combination: ${biome} + ${catalyst}`);
  }

  if (ng >= 40) {
    return biome === 'Caatinga'
      ? { sourceRoosterId: roosterId, targetSpeciesId: '#21', targetName: 'Brasa-do-Sertão', targetRarity: 'Lendario', tierNg: 40, biome, catalyst }
      : { sourceRoosterId: roosterId, targetSpeciesId: '#25', targetName: 'Guardião da Mata', targetRarity: 'Mitico', tierNg: 40, biome, catalyst };
  }

  return biome === 'Caatinga'
    ? { sourceRoosterId: roosterId, targetSpeciesId: '#11', targetName: 'Galo Cangaceiro', targetRarity: 'Epico', tierNg: 20, biome, catalyst }
    : { sourceRoosterId: roosterId, targetSpeciesId: '#12', targetName: 'Galo Mata-Guerreiro', targetRarity: 'Epico', tierNg: 20, biome, catalyst };
}
