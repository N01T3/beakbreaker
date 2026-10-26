export type GeneticMutationId =
  | 'PlumagemDourada'
  | 'CristaDeFogo'
  | 'OlhoDeGaviao'
  | 'CascoDeJabuti'
  | 'CantoDaSerra'
  | 'SangueDeRei';

export type EvolutionBranch = 'TRILHA_A_OFENSIVA' | 'TRILHA_B_TATICA';

export interface BreedingPreview {
  hybridChancePct: 35;
  mutationChancePct: number;
  goldenEmpowermentWeight: number;
  eligibleForMutation: boolean;
}

export interface SanctuaryRecipeItem {
  recipeId: number;
  sanctuaryLevelRequired: number;
  parentAElement: string;
  parentBElement: string;
  resultRoosterName: string;
}

export class GeneticsController {
  private sanctuaryLevel = 1;
  private branchChoices = new Map<string, { ng20?: EvolutionBranch; ng40?: EvolutionBranch }>();

  public previewNinhalCross(
    parentANg: number,
    parentBNg: number,
    hasProcriacaoGem = false,
  ): BreedingPreview {
    const eligibleForMutation = parentANg >= 30 && parentBNg >= 30;
    return {
      hybridChancePct: 35,
      mutationChancePct: eligibleForMutation ? 5 : 0,
      goldenEmpowermentWeight: hasProcriacaoGem ? 8 : 0,
      eligibleForMutation,
    };
  }

  public selectEvolutionBranch(
    roosterId: string,
    milestone: 20 | 40,
    branch: EvolutionBranch,
  ): boolean {
    const current = this.branchChoices.get(roosterId) ?? {};
    if (milestone === 20) current.ng20 = branch;
    if (milestone === 40) current.ng40 = branch;
    this.branchChoices.set(roosterId, current);
    return true;
  }

  public getEvolutionBranches(roosterId: string) {
    return this.branchChoices.get(roosterId) ?? {};
  }

  public setSanctuaryLevel(level: number): number {
    this.sanctuaryLevel = Math.max(1, Math.min(8, Math.floor(level)));
    return this.sanctuaryLevel;
  }

  public getUnlockedSanctuaryRecipesCount(): number {
    // 3 receitas por nível do Santuário (Níveis 1 a 8 = 24 receitas determinísticas)
    return this.sanctuaryLevel * 3;
  }

  public calculateTreeOfLifeExtractionOrbs(roosterNg: number): number {
    // NG 1 rende 40 Orbes; NG 30+ rende até 100 Orbes
    const clamped = Math.max(1, Math.min(30, Math.floor(roosterNg)));
    return Math.min(100, Math.floor(40 + ((clamped - 1) / 29) * 60));
  }

  public canSummonWithWildcardOrbs(
    specificOrbs: number,
    wildcardOrbs: number,
    isHappyHourWednesdayOrFriday: boolean,
  ): boolean {
    const requiredTotal = 100;
    if (specificOrbs >= requiredTotal) return true;
    if (!isHappyHourWednesdayOrFriday) {
      return specificOrbs >= 80 && specificOrbs + wildcardOrbs >= requiredTotal;
    }
    // No Happy Hour (quarta e sexta), permite usar até 99 Orbes Curinga!
    return specificOrbs >= 1 && specificOrbs + wildcardOrbs >= requiredTotal;
  }
}
