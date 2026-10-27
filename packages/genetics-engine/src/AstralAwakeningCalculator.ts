export interface StarCostDefinition {
  targetStar: number;
  category: 'Amarela' | 'DespertarAstral';
  orbs: number;
  astralEssences: number;
  cumulativeOrbs: number;
  cumulativeEssences: number;
  unlockedPassive?: string;
  statBonusPercent: number;
  ngCapBonus: number;
}

export interface StarUpgradeCost extends StarCostDefinition {
  orbCost: number;
  astralEssenceCost: number;
}

export interface TotalStarCost {
  targetStar: number;
  totalOrbs: number;
  totalEssences: number;
  orbs: number;
  essences: number;
}

export interface OrbsInput {
  speciesOrbs: number;
  jokerOrbs?: number;
}

export const TOTAL_ASTRAL_ORBS = 11200;
export const TOTAL_ASTRAL_ESSENCES = 15;
export const MAX_STAR_LEVEL = 10;

export const ASTRAL_STAR_CONFIG: readonly StarCostDefinition[] = [
  { targetStar: 1, category: 'Amarela', orbs: 120, astralEssences: 0, cumulativeOrbs: 120, cumulativeEssences: 0, statBonusPercent: 15, ngCapBonus: 0 },
  { targetStar: 2, category: 'Amarela', orbs: 200, astralEssences: 0, cumulativeOrbs: 320, cumulativeEssences: 0, statBonusPercent: 30, ngCapBonus: 0 },
  { targetStar: 3, category: 'Amarela', orbs: 320, astralEssences: 0, cumulativeOrbs: 640, cumulativeEssences: 0, statBonusPercent: 45, ngCapBonus: 0 },
  { targetStar: 4, category: 'Amarela', orbs: 560, astralEssences: 0, cumulativeOrbs: 1200, cumulativeEssences: 0, statBonusPercent: 60, ngCapBonus: 0 },
  { targetStar: 5, category: 'Amarela', orbs: 800, astralEssences: 0, cumulativeOrbs: 2000, cumulativeEssences: 0, statBonusPercent: 75, ngCapBonus: 0 },
  { targetStar: 6, category: 'DespertarAstral', orbs: 1000, astralEssences: 1, cumulativeOrbs: 3000, cumulativeEssences: 1, unlockedPassive: '1ª Passiva Astral', statBonusPercent: 100, ngCapBonus: 2 },
  { targetStar: 7, category: 'DespertarAstral', orbs: 1300, astralEssences: 2, cumulativeOrbs: 4300, cumulativeEssences: 3, statBonusPercent: 125, ngCapBonus: 4 },
  { targetStar: 8, category: 'DespertarAstral', orbs: 1700, astralEssences: 3, cumulativeOrbs: 6000, cumulativeEssences: 6, statBonusPercent: 150, ngCapBonus: 6 },
  { targetStar: 9, category: 'DespertarAstral', orbs: 2200, astralEssences: 4, cumulativeOrbs: 8200, cumulativeEssences: 10, statBonusPercent: 175, ngCapBonus: 8 },
  { targetStar: 10, category: 'DespertarAstral', orbs: 3000, astralEssences: 5, cumulativeOrbs: 11200, cumulativeEssences: 15, unlockedPassive: '2ª Passiva Astral (Aura Suprema)', statBonusPercent: 200, ngCapBonus: 10 },
] as const;

export function getStarUpgradeCost(targetStar: number): StarUpgradeCost {
  if (!Number.isInteger(targetStar) || targetStar < 1 || targetStar > MAX_STAR_LEVEL) {
    throw new Error(`Invalid targetStar: ${targetStar}. Must be an integer between 1 and ${MAX_STAR_LEVEL}`);
  }
  const config = ASTRAL_STAR_CONFIG[targetStar - 1]!;
  return {
    ...config,
    orbCost: config.orbs,
    astralEssenceCost: config.astralEssences,
  };
}

export function getTotalOrbsAndEssencesToStar(targetStar: number): TotalStarCost {
  if (!Number.isInteger(targetStar) || targetStar < 0 || targetStar > MAX_STAR_LEVEL) {
    throw new Error(`Invalid targetStar: ${targetStar}. Must be an integer between 0 and ${MAX_STAR_LEVEL}`);
  }
  if (targetStar === 0) {
    return { targetStar: 0, totalOrbs: 0, totalEssences: 0, orbs: 0, essences: 0 };
  }
  const config = ASTRAL_STAR_CONFIG[targetStar - 1]!;
  return {
    targetStar,
    totalOrbs: config.cumulativeOrbs,
    totalEssences: config.cumulativeEssences,
    orbs: config.cumulativeOrbs,
    essences: config.cumulativeEssences,
  };
}

export function getStarStatBonusPercent(stars: number): number {
  const clamped = Math.max(0, Math.min(MAX_STAR_LEVEL, Math.floor(stars)));
  if (clamped <= 5) {
    return clamped * 15;
  }
  return 75 + (clamped - 5) * 25;
}

export function getStatMultiplier(stars: number): number {
  return 1 + getStarStatBonusPercent(stars) / 100;
}

export function getVigorAndForceMultiplier(stars: number): number {
  return getStatMultiplier(stars);
}

export function getNgCapBonus(stars: number): number {
  const clamped = Math.max(0, Math.min(MAX_STAR_LEVEL, Math.floor(stars)));
  if (clamped <= 5) return 0;
  return (clamped - 5) * 2;
}

export function getUnlockedPassives(stars: number): string[] {
  const passives: string[] = [];
  if (stars >= 6) {
    passives.push('1ª Passiva Astral');
  }
  if (stars >= 10) {
    passives.push('2ª Passiva Astral (Aura Suprema)');
  }
  return passives;
}

export function canAwakenStar(
  currentStar: number,
  orbsAvailable: number | OrbsInput,
  essencesAvailable: number,
  isHappyHour = false,
  jokerOrbsAvailable = 0
): boolean {
  if (!Number.isInteger(currentStar) || currentStar < 0 || currentStar >= MAX_STAR_LEVEL) {
    return false;
  }
  const targetStar = currentStar + 1;
  const cost = getStarUpgradeCost(targetStar);

  if (essencesAvailable < cost.astralEssences) {
    return false;
  }

  if (typeof orbsAvailable === 'number') {
    if (jokerOrbsAvailable > 0) {
      return canSatisfyOrbRequirement(orbsAvailable, jokerOrbsAvailable, cost.orbs, isHappyHour);
    }
    return orbsAvailable >= cost.orbs;
  }

  const species = Math.max(0, orbsAvailable.speciesOrbs ?? 0);
  const joker = Math.max(0, orbsAvailable.jokerOrbs ?? 0);
  return canSatisfyOrbRequirement(species, joker, cost.orbs, isHappyHour);
}

function canSatisfyOrbRequirement(
  speciesOrbs: number,
  jokerOrbs: number,
  requiredOrbs: number,
  isHappyHour: boolean
): boolean {
  if (isHappyHour) {
    return speciesOrbs + jokerOrbs >= requiredOrbs;
  }
  const minSpeciesOrbs = Math.ceil(requiredOrbs * 0.8);
  const maxJokerAllowed = Math.floor(requiredOrbs * 0.2);
  const effectiveJoker = Math.min(jokerOrbs, maxJokerAllowed);
  return speciesOrbs >= minSpeciesOrbs && speciesOrbs + effectiveJoker >= requiredOrbs;
}
