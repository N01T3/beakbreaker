export type PredatorType = 'gaviao_sertao' | 'raposa_caatinga' | 'teiu_ligeiro';

export interface PredatorSpec {
  readonly type: PredatorType;
  readonly name: string;
  readonly threatPower: number;
  readonly favoriteCounter: 'estilingue' | 'espantalho' | 'cata_vento';
  readonly description: string;
}

export const PREDATORS: Record<PredatorType, PredatorSpec> = {
  gaviao_sertao: {
    type: 'gaviao_sertao',
    name: 'Gavião do Sertão',
    threatPower: 450,
    favoriteCounter: 'estilingue',
    description: 'Predador alado veloz que ataca pelo céu.',
  },
  raposa_caatinga: {
    type: 'raposa_caatinga',
    name: 'Raposa da Caatinga',
    threatPower: 520,
    favoriteCounter: 'espantalho',
    description: 'Predadora esperta e sorrateira que ronda o celeiro.',
  },
  teiu_ligeiro: {
    type: 'teiu_ligeiro',
    name: 'Teiú Ligeiro',
    threatPower: 380,
    favoriteCounter: 'cata_vento',
    description: 'Lagarto rápido e guloso de ovos no terreiro.',
  },
};

export const MAX_DAILY_PREDATOR_INCURSIONS = 2;

export interface FarmActiveDefenses {
  readonly estilingueLevel?: number;
  readonly espantalhoLevel?: number;
  readonly cataVentoLevel?: number;
}

export interface WatchmanAthlete {
  readonly roosterId: string;
  readonly name: string;
  readonly vigor: number;
  readonly forca: number;
  readonly velocidade?: number;
}

export interface PredatorDefenseDrops {
  readonly rescuedCorn: number;
  readonly rareSeeds: number;
  readonly goldenFeathers: number;
  readonly caipiraEggs: number;
}

export interface PredatorRepelResult {
  readonly repelled: boolean;
  readonly predator: PredatorSpec;
  readonly defenseScore: number;
  readonly requiredScore: number;
  readonly efficiencyRatio: number;
  readonly drops: PredatorDefenseDrops;
}

export interface PredatorIncursion {
  readonly incursionId: string;
  readonly dateKey: string;
  readonly slotIndex: 1 | 2;
  readonly predator: PredatorSpec;
}

export function canTriggerPredatorIncursion(incursionsCompletedToday: number): boolean {
  return incursionsCompletedToday < MAX_DAILY_PREDATOR_INCURSIONS;
}

export function generatePredatorIncursion(
  dateKey: string,
  slotIndex: 1 | 2,
  seed = 42,
): PredatorIncursion {
  const types: PredatorType[] = ['gaviao_sertao', 'raposa_caatinga', 'teiu_ligeiro'];
  const hash = Math.abs(seed + slotIndex * 31 + dateKey.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  const selectedType = types[hash % types.length]!;
  const predator = PREDATORS[selectedType];
  return {
    incursionId: `inc_${dateKey}_slot${slotIndex}`,
    dateKey,
    slotIndex,
    predator,
  };
}

export function calculateDefensePower(
  defenses: FarmActiveDefenses,
  watchmen: readonly WatchmanAthlete[],
  predator: PredatorSpec,
  interactiveTaps = 0,
): number {
  let score = 0;
  const eLvl = Math.max(0, defenses.estilingueLevel ?? 0);
  const espLvl = Math.max(0, defenses.espantalhoLevel ?? 0);
  const cataLvl = Math.max(0, defenses.cataVentoLevel ?? 0);

  score += eLvl * (predator.favoriteCounter === 'estilingue' ? 180 : 100);
  score += espLvl * (predator.favoriteCounter === 'espantalho' ? 180 : 100);
  score += cataLvl * (predator.favoriteCounter === 'cata_vento' ? 180 : 100);

  for (const w of watchmen) {
    score += Math.floor(w.forca * 0.4 + w.vigor * 0.02 + (w.velocidade ?? 100) * 0.3);
  }

  const tapBonus = Math.min(10, Math.max(0, interactiveTaps)) * 20;
  return score + tapBonus;
}

export function repelPredator(
  predatorType: PredatorType,
  defenses: FarmActiveDefenses,
  watchmen: readonly WatchmanAthlete[],
  interactiveTaps = 0,
): PredatorRepelResult {
  const predator = PREDATORS[predatorType];
  const defenseScore = calculateDefensePower(defenses, watchmen, predator, interactiveTaps);
  const requiredScore = predator.threatPower;
  const repelled = defenseScore >= requiredScore;
  const efficiencyRatio = Math.round((defenseScore / requiredScore) * 100) / 100;

  if (!repelled) {
    return {
      repelled: false,
      predator,
      defenseScore,
      requiredScore,
      efficiencyRatio,
      drops: { rescuedCorn: 0, rareSeeds: 0, goldenFeathers: 0, caipiraEggs: 0 },
    };
  }

  const bonusScale = Math.min(2.0, Math.max(1.0, efficiencyRatio));
  const drops: PredatorDefenseDrops = {
    rescuedCorn: Math.floor(15000 * bonusScale),
    rareSeeds: Math.max(1, Math.floor(2 * bonusScale)),
    goldenFeathers: Math.floor(25 * bonusScale),
    caipiraEggs: Math.max(1, Math.floor(1 * bonusScale)),
  };

  return {
    repelled: true,
    predator,
    defenseScore,
    requiredScore,
    efficiencyRatio,
    drops,
  };
}
