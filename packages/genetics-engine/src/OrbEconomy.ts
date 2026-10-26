export const SUMMON_NEW_ROOSTER_ORB_COST = 100;

export const STAR_ORB_COSTS: readonly number[] = [
  120,  // 1★ (Amarela)
  200,  // 2★ (Amarela)
  320,  // 3★ (Amarela) -> Acumulado: 640 Orbes
  560,  // 4★ (Amarela) -> Acumulado: 1.200 Orbes
  800,  // 5★ (Amarela) -> Acumulado: 2.000 Orbes
  1000, // 6★ (1ª Vermelha / Despertar Astral) -> Acumulado: 3.000 Orbes
  1300, // 7★ (2ª Vermelha) -> Acumulado: 4.300 Orbes
  1700, // 8★ (3ª Vermelha) -> Acumulado: 6.000 Orbes
  2200, // 9★ (4ª Vermelha) -> Acumulado: 8.200 Orbes
  3000, // 10★ (5ª Vermelha) -> Acumulado: 11.200 Orbes
] as const;

export const STAR_ASTRAL_ESSENCE_COSTS: readonly number[] = [
  0, // 1★
  0, // 2★
  0, // 3★
  0, // 4★
  0, // 5★
  1, // 6★ (acumulado: 1)
  2, // 7★ (acumulado: 3)
  3, // 8★ (acumulado: 6)
  4, // 9★ (acumulado: 10)
  5, // 10★ (acumulado: 15)
] as const;

export const TOTAL_ORBS_TO_MAX_STARS = 11200;
export const TOTAL_ASTRAL_ESSENCES_TO_MAX = 15;

export interface StarRequirementInfo {
  targetStar: number;
  category: 'Amarela' | 'DespertarAstral';
  orbCost: number;
  cumulativeOrbs: number;
  astralEssenceCost: number;
  cumulativeAstralEssences: number;
  perchBonusPercent: number;
  combatStatBonusPercent: number;
  ngCapBonus: number;
}

export function calculateOrbExtraction(ng: number): number {
  const clampedNg = Math.max(1, Math.min(30, Math.floor(ng)));
  return 40 + Math.floor(((clampedNg - 1) * 60) / 29);
}

export function getStarRequirement(targetStar: number): StarRequirementInfo {
  if (targetStar < 1 || targetStar > 10 || !Number.isInteger(targetStar)) {
    throw new Error(`Invalid targetStar: ${targetStar}. Must be integer 1..10`);
  }
  const idx = targetStar - 1;
  const orbCost = STAR_ORB_COSTS[idx]!;
  const astralEssenceCost = STAR_ASTRAL_ESSENCE_COSTS[idx]!;
  const cumulativeOrbs = STAR_ORB_COSTS.slice(0, targetStar).reduce(
    (a, b) => a + b,
    0
  );
  const cumulativeAstralEssences = STAR_ASTRAL_ESSENCE_COSTS.slice(
    0,
    targetStar
  ).reduce((a, b) => a + b, 0);
  const redStars = Math.max(0, targetStar - 5);

  return {
    targetStar,
    category: targetStar <= 5 ? 'Amarela' : 'DespertarAstral',
    orbCost,
    cumulativeOrbs,
    astralEssenceCost,
    cumulativeAstralEssences,
    perchBonusPercent: targetStar * 15,
    combatStatBonusPercent: redStars * 15,
    ngCapBonus: redStars * 2,
  };
}

export function calculateMaxNgCap(sedeLevel: number, stars: number): number {
  const redStars = Math.max(0, Math.min(10, stars) - 5);
  return sedeLevel * 5 + redStars * 2;
}

export function isHappyHourDay(dayOfWeekUtc: number): boolean {
  // 3 = Wednesday, 5 = Friday
  return dayOfWeekUtc === 3 || dayOfWeekUtc === 5;
}

export interface EmpowerValidationInput {
  targetStar: number;
  speciesOrbsAvailable: number;
  jokerOrbsAvailable: number;
  astralEssencesAvailable: number;
  isHappyHourActive: boolean;
}

export interface EmpowerValidationResult {
  canEmpower: boolean;
  orbCost: number;
  minSpeciesOrbsRequired: number;
  maxJokerOrbsAllowed: number;
  speciesOrbsToSpend: number;
  jokerOrbsToSpend: number;
  astralEssencesToSpend: number;
  reason?: string;
}

export function validateStarEmpowerment(
  input: EmpowerValidationInput
): EmpowerValidationResult {
  const req = getStarRequirement(input.targetStar);
  const minSpeciesOrbsRequired = input.isHappyHourActive
    ? 0
    : Math.ceil(req.orbCost * 0.8);
  const maxJokerOrbsAllowed = input.isHappyHourActive
    ? req.orbCost
    : Math.floor(req.orbCost * 0.2);

  if (input.astralEssencesAvailable < req.astralEssenceCost) {
    return {
      canEmpower: false,
      orbCost: req.orbCost,
      minSpeciesOrbsRequired,
      maxJokerOrbsAllowed,
      speciesOrbsToSpend: 0,
      jokerOrbsToSpend: 0,
      astralEssencesToSpend: req.astralEssenceCost,
      reason: 'Insufficient Astral Essences',
    };
  }

  if (input.speciesOrbsAvailable < minSpeciesOrbsRequired) {
    return {
      canEmpower: false,
      orbCost: req.orbCost,
      minSpeciesOrbsRequired,
      maxJokerOrbsAllowed,
      speciesOrbsToSpend: 0,
      jokerOrbsToSpend: 0,
      astralEssencesToSpend: req.astralEssenceCost,
      reason: 'Insufficient species orbs (requires >= 80% on normal days)',
    };
  }

  const speciesOrbsToSpend = Math.min(input.speciesOrbsAvailable, req.orbCost);
  const remainingNeeded = req.orbCost - speciesOrbsToSpend;
  const jokerUsable = Math.min(input.jokerOrbsAvailable, maxJokerOrbsAllowed);

  if (jokerUsable < remainingNeeded) {
    return {
      canEmpower: false,
      orbCost: req.orbCost,
      minSpeciesOrbsRequired,
      maxJokerOrbsAllowed,
      speciesOrbsToSpend: 0,
      jokerOrbsToSpend: 0,
      astralEssencesToSpend: req.astralEssenceCost,
      reason: 'Insufficient total orbs (species + allowed joker orbs)',
    };
  }

  return {
    canEmpower: true,
    orbCost: req.orbCost,
    minSpeciesOrbsRequired,
    maxJokerOrbsAllowed,
    speciesOrbsToSpend,
    jokerOrbsToSpend: remainingNeeded,
    astralEssencesToSpend: req.astralEssenceCost,
  };
}
