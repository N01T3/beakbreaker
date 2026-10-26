import { ElementType, Rarity } from './schemas/index.js';

export const NINHAL_RARITY_WEIGHTS: Record<Rarity, number> = {
  Comum: 40,
  Raro: 30,
  Epico: 20,
  Lendario: 10,
  Mitico: 0,
  Heroico: 0,
  Primordial: 0,
};

export const NINHAL_CONSTANTS = {
  maxBreedCountPerRooster: 5,
  hybridChancePermille: 350,
  secretMutationChancePermille: 50,
  minParentNgForSecretMutation: 30,
  baseCornCost: 3_000,
  cornCostPerParentNg: 200,
  goldenBarMinStars: 3,
  goldenBarLegendaryWeight: 8,
} as const;

export interface LegendaryBreedCombination {
  id: string;
  elementA: ElementType;
  elementB: ElementType;
  roosterId: string;
  roosterNumber: number;
  roosterName: string;
  goldenBarWeight: 8;
}

export const LEGENDARY_BREED_COMBINATIONS: readonly LegendaryBreedCombination[] = [
  { id: 'brasa_sol', elementA: 'Brasa', elementB: 'Sol', roosterId: 'rooster_18', roosterNumber: 18, roosterName: 'Trovão do Sertão', goldenBarWeight: 8 },
  { id: 'brasa_lua', elementA: 'Brasa', elementB: 'Lua', roosterId: 'rooster_23', roosterNumber: 23, roosterName: 'Mula sem Cabeça', goldenBarWeight: 8 },
  { id: 'mata_sol', elementA: 'Mata', elementB: 'Sol', roosterId: 'rooster_19', roosterNumber: 19, roosterName: 'Asa Branca', goldenBarWeight: 8 },
  { id: 'lua_mata', elementA: 'Lua', elementB: 'Mata', roosterId: 'rooster_24', roosterNumber: 24, roosterName: 'Cuca do Agreste', goldenBarWeight: 8 },
  { id: 'correnteza_lua', elementA: 'Correnteza', elementB: 'Lua', roosterId: 'rooster_20', roosterNumber: 20, roosterName: 'Rei do Baião', goldenBarWeight: 8 },
  { id: 'lua_sol', elementA: 'Lua', elementB: 'Sol', roosterId: 'rooster_22', roosterNumber: 22, roosterName: 'Saci da Ventania', goldenBarWeight: 8 },
  { id: 'brasa_correnteza', elementA: 'Brasa', elementB: 'Correnteza', roosterId: 'rooster_39', roosterNumber: 39, roosterName: 'Fogo-Apagou', goldenBarWeight: 8 },
  { id: 'correnteza_sol', elementA: 'Correnteza', elementB: 'Sol', roosterId: 'rooster_40', roosterNumber: 40, roosterName: 'Arco-Íris do Sertão', goldenBarWeight: 8 },
] as const;

export interface SecretMutationSpec {
  id: string;
  name: string;
  elementA: ElementType;
  elementB: ElementType;
  roosterId: string;
  minParentNg: 30;
  chancePermille: 50;
  releaseSeason: number;
  releaseLabel: string;
}

export const SECRET_MUTATIONS: readonly SecretMutationSpec[] = [
  { id: 'mut_sombra_armorial', name: '#26 Sombra Armorial', elementA: 'Lua', elementB: 'Lua', roosterId: 'rooster_26', minParentNg: 30, chancePermille: 50, releaseSeason: 0, releaseLabel: 'No Lançamento' },
  { id: 'mut_galo_de_vapor', name: 'Galo de Vapor', elementA: 'Brasa', elementB: 'Correnteza', roosterId: 'seasonal_mut_vapor', minParentNg: 30, chancePermille: 50, releaseSeason: 3, releaseLabel: 'Temporada 3' },
  { id: 'mut_galo_queimada', name: 'Galo Queimada', elementA: 'Brasa', elementB: 'Mata', roosterId: 'seasonal_mut_queimada', minParentNg: 30, chancePermille: 50, releaseSeason: 5, releaseLabel: 'Temporada 5' },
  { id: 'mut_galo_mare_alta', name: 'Galo Maré Alta', elementA: 'Correnteza', elementB: 'Sol', roosterId: 'seasonal_mut_mare_alta', minParentNg: 30, chancePermille: 50, releaseSeason: 7, releaseLabel: 'Temporada 7' },
  { id: 'mut_galo_do_mangue', name: 'Galo do Mangue', elementA: 'Correnteza', elementB: 'Mata', roosterId: 'seasonal_mut_mangue', minParentNg: 30, chancePermille: 50, releaseSeason: 9, releaseLabel: 'Temporada 9' },
  { id: 'mut_galo_eclipse', name: 'Galo Eclipse', elementA: 'Sol', elementB: 'Sol', roosterId: 'seasonal_mut_eclipse', minParentNg: 30, chancePermille: 50, releaseSeason: 11, releaseLabel: 'Temporada 11' },
] as const;

export interface SanctuaryRecipeSpec {
  id: string;
  sanctuaryLevel: number;
  slotIndex: 1 | 2 | 3;
  requiredSedeLevel: number;
  name: string;
  resultType: 'Rooster' | 'GeneticPerk';
  roosterId?: string;
  description: string;
}

export const SANCTUARY_RECIPES: readonly SanctuaryRecipeSpec[] = [
  { id: 'sanct_1_1', sanctuaryLevel: 1, slotIndex: 1, requiredSedeLevel: 6, name: '#18 Trovão do Sertão', resultType: 'Rooster', roosterId: 'rooster_18', description: 'Síntese garantida de #18 Trovão do Sertão (Brasa + Sol).' },
  { id: 'sanct_1_2', sanctuaryLevel: 1, slotIndex: 2, requiredSedeLevel: 6, name: '#23 Mula sem Cabeça', resultType: 'Rooster', roosterId: 'rooster_23', description: 'Síntese garantida de #23 Mula sem Cabeça (Brasa + Lua).' },
  { id: 'sanct_1_3', sanctuaryLevel: 1, slotIndex: 3, requiredSedeLevel: 6, name: '#24 Cuca do Agreste', resultType: 'Rooster', roosterId: 'rooster_24', description: 'Síntese garantida de #24 Cuca do Agreste (Lua + Mata).' },
  { id: 'sanct_2_1', sanctuaryLevel: 2, slotIndex: 1, requiredSedeLevel: 7, name: '#19 Asa Branca', resultType: 'Rooster', roosterId: 'rooster_19', description: 'Síntese garantida de #19 Asa Branca (Sol + Mata).' },
  { id: 'sanct_2_2', sanctuaryLevel: 2, slotIndex: 2, requiredSedeLevel: 7, name: '#22 Saci da Ventania', resultType: 'Rooster', roosterId: 'rooster_22', description: 'Síntese garantida de #22 Saci da Ventania (Lua + Sol).' },
  { id: 'sanct_2_3', sanctuaryLevel: 2, slotIndex: 3, requiredSedeLevel: 7, name: '#27 Boitatá de Fogo (Mítico)', resultType: 'Rooster', roosterId: 'rooster_27', description: 'Síntese Mítica garantida de #27 Boitatá de Fogo.' },
  { id: 'sanct_3_1', sanctuaryLevel: 3, slotIndex: 1, requiredSedeLevel: 8, name: '#20 Rei do Baião', resultType: 'Rooster', roosterId: 'rooster_20', description: 'Síntese garantida de #20 Rei do Baião (Correnteza + Lua).' },
  { id: 'sanct_3_2', sanctuaryLevel: 3, slotIndex: 2, requiredSedeLevel: 8, name: 'Híbrido sob Encomenda', resultType: 'GeneticPerk', description: 'Garante 100% de Dupla Linhagem (Híbrido) entre os pais selecionados.' },
  { id: 'sanct_3_3', sanctuaryLevel: 3, slotIndex: 3, requiredSedeLevel: 8, name: 'Crista Recessiva Garantida', resultType: 'GeneticPerk', description: 'Transfere determinística a peça visual de crista recessiva ao filhote.' },
  { id: 'sanct_4_1', sanctuaryLevel: 4, slotIndex: 1, requiredSedeLevel: 8, name: '#28 Carcará de Aço (Mítico)', resultType: 'Rooster', roosterId: 'rooster_28', description: 'Síntese Mítica garantida de #28 Carcará de Aço.' },
  { id: 'sanct_4_2', sanctuaryLevel: 4, slotIndex: 2, requiredSedeLevel: 8, name: 'Plumagem Recessiva Garantida', resultType: 'GeneticPerk', description: 'Transfere determinística a paleta e plumagem recessiva dos pais.' },
  { id: 'sanct_4_3', sanctuaryLevel: 4, slotIndex: 3, requiredSedeLevel: 8, name: 'Passiva Rara Garantida', resultType: 'GeneticPerk', description: 'Garante herança de Passiva Genética Rara no filhote.' },
  { id: 'sanct_5_1', sanctuaryLevel: 5, slotIndex: 1, requiredSedeLevel: 9, name: '#11 Galo Cangaceiro Direto', resultType: 'Rooster', roosterId: 'rooster_11', description: 'Reprodução direta de #11 Galo Cangaceiro sem exigir evolução no NG 20.' },
  { id: 'sanct_5_2', sanctuaryLevel: 5, slotIndex: 2, requiredSedeLevel: 9, name: '#12 Galo Mata-Guerreiro Direto', resultType: 'Rooster', roosterId: 'rooster_12', description: 'Reprodução direta de #12 Galo Mata-Guerreiro sem exigir evolução no NG 20.' },
  { id: 'sanct_5_3', sanctuaryLevel: 5, slotIndex: 3, requiredSedeLevel: 9, name: 'Dupla Herança de Passivas', resultType: 'GeneticPerk', description: 'Filhote herda simultaneamente o traço positivo do pai e a passiva da mãe.' },
  { id: 'sanct_6_1', sanctuaryLevel: 6, slotIndex: 1, requiredSedeLevel: 10, name: '#26 Sombra Armorial (Mítico)', resultType: 'Rooster', roosterId: 'rooster_26', description: 'Síntese Mítica garantida de #26 Sombra Armorial.' },
  { id: 'sanct_6_2', sanctuaryLevel: 6, slotIndex: 2, requiredSedeLevel: 10, name: 'Passiva Lendária Garantida', resultType: 'GeneticPerk', description: 'Garante herança de Passiva Genética de grau Lendário.' },
  { id: 'sanct_6_3', sanctuaryLevel: 6, slotIndex: 3, requiredSedeLevel: 10, name: 'Fertilidade Renovada (+ cruzamentos)', resultType: 'GeneticPerk', description: 'Zera o contador breedCount de uma ave veterana para novos cruzamentos.' },
  { id: 'sanct_7_1', sanctuaryLevel: 7, slotIndex: 1, requiredSedeLevel: 11, name: '#25 Guardião da Mata Direto', resultType: 'Rooster', roosterId: 'rooster_25', description: 'Síntese Mítica direta de #25 Guardião da Mata.' },
  { id: 'sanct_7_2', sanctuaryLevel: 7, slotIndex: 2, requiredSedeLevel: 11, name: '#21 Galo Brasa-do-Sertão Direto', resultType: 'Rooster', roosterId: 'rooster_21', description: 'Síntese Lendária direta de #21 Brasa-do-Sertão.' },
  { id: 'sanct_7_3', sanctuaryLevel: 7, slotIndex: 3, requiredSedeLevel: 11, name: 'Mutação Dobrada (5% → 10%)', resultType: 'GeneticPerk', description: 'Eleva a chance base de Mutação Secreta de 5% para 10% no cruzamento.' },
  { id: 'sanct_8_1', sanctuaryLevel: 8, slotIndex: 1, requiredSedeLevel: 12, name: '#29 Asa Branca Celestial (Mítico)', resultType: 'Rooster', roosterId: 'rooster_29', description: 'Síntese Mítica garantida de #29 Asa Branca Celestial.' },
  { id: 'sanct_8_2', sanctuaryLevel: 8, slotIndex: 2, requiredSedeLevel: 12, name: 'Linhagem Pura Perfeita', resultType: 'GeneticPerk', description: 'Remove a penalidade do traço negativo na ave gerada.' },
  { id: 'sanct_8_3', sanctuaryLevel: 8, slotIndex: 3, requiredSedeLevel: 12, name: 'Ovo de Festa Sazonal', resultType: 'GeneticPerk', description: 'Sintetiza um Ovo da Temporada Cultural vigente.' },
] as const;

export interface AstralStarStep {
  star: number;
  category: 'Amarela' | 'DespertarAstral';
  orbsRequired: number;
  cumulativeOrbs: number;
  astralEssencesRequired: number;
  cumulativeAstralEssences: number;
  duplicatesNg30Equivalent: number;
  perchProductionBonusPermille: number;
  combatStatsBonusPermille: number;
  ngCapBonus: number;
  maxNgAtSede12: number;
}

export const ASTRAL_STAR_CURVE: readonly AstralStarStep[] = [
  { star: 1, category: 'Amarela', orbsRequired: 120, cumulativeOrbs: 120, astralEssencesRequired: 0, cumulativeAstralEssences: 0, duplicatesNg30Equivalent: 1, perchProductionBonusPermille: 150, combatStatsBonusPermille: 0, ngCapBonus: 0, maxNgAtSede12: 60 },
  { star: 2, category: 'Amarela', orbsRequired: 200, cumulativeOrbs: 320, astralEssencesRequired: 0, cumulativeAstralEssences: 0, duplicatesNg30Equivalent: 3, perchProductionBonusPermille: 300, combatStatsBonusPermille: 0, ngCapBonus: 0, maxNgAtSede12: 60 },
  { star: 3, category: 'Amarela', orbsRequired: 320, cumulativeOrbs: 640, astralEssencesRequired: 0, cumulativeAstralEssences: 0, duplicatesNg30Equivalent: 6, perchProductionBonusPermille: 450, combatStatsBonusPermille: 0, ngCapBonus: 0, maxNgAtSede12: 60 },
  { star: 4, category: 'Amarela', orbsRequired: 560, cumulativeOrbs: 1_200, astralEssencesRequired: 0, cumulativeAstralEssences: 0, duplicatesNg30Equivalent: 10, perchProductionBonusPermille: 600, combatStatsBonusPermille: 0, ngCapBonus: 0, maxNgAtSede12: 60 },
  { star: 5, category: 'Amarela', orbsRequired: 800, cumulativeOrbs: 2_000, astralEssencesRequired: 0, cumulativeAstralEssences: 0, duplicatesNg30Equivalent: 16, perchProductionBonusPermille: 750, combatStatsBonusPermille: 0, ngCapBonus: 0, maxNgAtSede12: 60 },
  { star: 6, category: 'DespertarAstral', orbsRequired: 1_000, cumulativeOrbs: 3_000, astralEssencesRequired: 1, cumulativeAstralEssences: 1, duplicatesNg30Equivalent: 24, perchProductionBonusPermille: 900, combatStatsBonusPermille: 150, ngCapBonus: 2, maxNgAtSede12: 62 },
  { star: 7, category: 'DespertarAstral', orbsRequired: 1_300, cumulativeOrbs: 4_300, astralEssencesRequired: 2, cumulativeAstralEssences: 3, duplicatesNg30Equivalent: 35, perchProductionBonusPermille: 1_050, combatStatsBonusPermille: 300, ngCapBonus: 4, maxNgAtSede12: 64 },
  { star: 8, category: 'DespertarAstral', orbsRequired: 1_700, cumulativeOrbs: 6_000, astralEssencesRequired: 3, cumulativeAstralEssences: 6, duplicatesNg30Equivalent: 48, perchProductionBonusPermille: 1_200, combatStatsBonusPermille: 450, ngCapBonus: 6, maxNgAtSede12: 66 },
  { star: 9, category: 'DespertarAstral', orbsRequired: 2_200, cumulativeOrbs: 8_200, astralEssencesRequired: 4, cumulativeAstralEssences: 10, duplicatesNg30Equivalent: 66, perchProductionBonusPermille: 1_350, combatStatsBonusPermille: 600, ngCapBonus: 8, maxNgAtSede12: 68 },
  { star: 10, category: 'DespertarAstral', orbsRequired: 3_000, cumulativeOrbs: 11_200, astralEssencesRequired: 5, cumulativeAstralEssences: 15, duplicatesNg30Equivalent: 90, perchProductionBonusPermille: 1_500, combatStatsBonusPermille: 750, ngCapBonus: 10, maxNgAtSede12: 70 },
] as const;
