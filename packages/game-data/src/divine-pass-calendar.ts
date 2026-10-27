export interface DivinePassReward {
  goldenFeathers: number;
  milho: number;
  unguentos: number;
  wildOrbs: number;
  epicEggs?: number;
  exclusiveFrame?: string;
  astralEssence?: number;
  seasonalRooster?: string;
  seasonalRoosterGuaranteed?: boolean;
}

export interface DivinePassLevelRewards {
  level: number;
  requiredXp: number;
  retirante: DivinePassReward;
  coronelBonus: DivinePassReward;
  coronel: DivinePassReward;
  trilhaDoRetirante: DivinePassReward;
  trilhaDoCoronel: DivinePassReward;
}

export interface PassMission {
  id: string;
  title: string;
  category: 'diaria' | 'semanal';
  xpReward: number;
  requirementCount: number;
  description: string;
}

export interface LoginCalendarReward {
  day: number;
  goldenFeathers: number;
  milho: number;
  wildOrbs: number;
  unguentos: number;
  epicEggs: number;
  legendaryRoosterGuaranteed: boolean;
  description: string;
}

export const DIVINE_PASS_CONFIG = {
  totalLevels: 40,
  xpPerLevel: 900,
  totalXpRequired: 36_000,
  coronelUnlockCostCoroas: 800,
  dailyMissionsCount: 3,
  dailyMissionXp: 100,
  totalDailyXp: 300,
  weeklyMissionsCount: 5,
  weeklyMissionXp: 500,
  totalWeeklyXp: 2500,
  seasonalRoosterGuaranteedLevel: 30,
} as const;

export const LOGIN_CALENDAR_CONFIG = {
  totalDays: 28,
  milestoneDays: [7, 14, 21, 28] as const,
} as const;

export const DIVINE_PASS_DAILY_MISSIONS: readonly PassMission[] = [
  { id: 'dp_daily_1', title: 'Milharal', category: 'diaria', xpReward: 100, requirementCount: 3, description: 'Colha milho 3 vezes.' },
  { id: 'dp_daily_2', title: 'Duelo Sertanejo', category: 'diaria', xpReward: 100, requirementCount: 2, description: 'Vença 2 combates na campanha.' },
  { id: 'dp_daily_3', title: 'Enfermaria', category: 'diaria', xpReward: 100, requirementCount: 1, description: 'Aplique 1 ungüento de cura.' },
];

export const DIVINE_PASS_WEEKLY_MISSIONS: readonly PassMission[] = [
  { id: 'dp_week_1', title: 'Torre Mandacaru', category: 'semanal', xpReward: 500, requirementCount: 10, description: 'Supere 10 andares na Torre.' },
  { id: 'dp_week_2', title: 'Chocadeira', category: 'semanal', xpReward: 500, requirementCount: 5, description: 'Choque 5 ovos no ninhal.' },
  { id: 'dp_week_3', title: 'Celeiro Cheio', category: 'semanal', xpReward: 500, requirementCount: 50000, description: 'Acumule 50.000 milhos.' },
  { id: 'dp_week_4', title: 'Linhagem Nobre', category: 'semanal', xpReward: 500, requirementCount: 3, description: 'Realize 3 cruzamentos.' },
  { id: 'dp_week_5', title: 'Campanha Maior', category: 'semanal', xpReward: 500, requirementCount: 15, description: 'Vença 15 confrontos.' },
];

const RAW_LOGINS: Array<Partial<LoginCalendarReward> & { desc: string }> = [
  { milho: 1000, desc: '1.000 Milho' }, { unguentos: 2, desc: '2 Ungüentos' },
  { goldenFeathers: 20, desc: '20 Penas Douradas' }, { milho: 2000, desc: '2.000 Milho' },
  { wildOrbs: 5, desc: '5 Orbes Curinga' }, { unguentos: 3, desc: '3 Ungüentos' },
  { goldenFeathers: 100, desc: '100 Penas Douradas' }, // Dia 7
  { milho: 3000, desc: '3.000 Milho' }, { goldenFeathers: 30, desc: '30 Penas Douradas' },
  { unguentos: 4, desc: '4 Ungüentos' }, { wildOrbs: 10, desc: '10 Orbes Curinga' },
  { milho: 4000, desc: '4.000 Milho' }, { goldenFeathers: 50, desc: '50 Penas Douradas' },
  { epicEggs: 1, desc: 'Ovo de Galo Épico' }, // Dia 14
  { milho: 5000, desc: '5.000 Milho' }, { wildOrbs: 15, desc: '15 Orbes Curinga' },
  { goldenFeathers: 50, desc: '50 Penas Douradas' }, { unguentos: 5, desc: '5 Ungüentos' },
  { milho: 6000, desc: '6.000 Milho' }, { wildOrbs: 20, desc: '20 Orbes Curinga' },
  { goldenFeathers: 300, wildOrbs: 50, desc: '300 Penas Douradas + 50 Orbes Curinga' }, // Dia 21
  { milho: 8000, desc: '8.000 Milho' }, { unguentos: 6, desc: '6 Ungüentos' },
  { goldenFeathers: 100, desc: '100 Penas Douradas' }, { milho: 10000, desc: '10.000 Milho' },
  { wildOrbs: 30, desc: '30 Orbes Curinga' }, { unguentos: 8, desc: '8 Ungüentos' },
  { legendaryRoosterGuaranteed: true, desc: 'Galo Lendário Garantido' }, // Dia 28
];

export const LOGIN_CALENDAR_REWARDS: readonly LoginCalendarReward[] = RAW_LOGINS.map((r, i) => ({
  day: i + 1, goldenFeathers: r.goldenFeathers ?? 0, milho: r.milho ?? 0,
  wildOrbs: r.wildOrbs ?? 0, unguentos: r.unguentos ?? 0, epicEggs: r.epicEggs ?? 0,
  legendaryRoosterGuaranteed: r.legendaryRoosterGuaranteed ?? false, description: r.desc,
}));

export const LOGIN_CALENDAR_28_DAYS = LOGIN_CALENDAR_REWARDS;

function buildPassLevel(level: number): DivinePassLevelRewards {
  const isLvl30 = level === 30;
  const isLvl40 = level === 40;
  const retirante: DivinePassReward = {
    goldenFeathers: level % 2 === 0 ? 15 + level * 2 : 0,
    milho: 1000 + level * 250,
    unguentos: level % 4 === 0 ? Math.floor(level / 8) + 1 : 0,
    wildOrbs: level % 5 === 0 ? Math.floor(level / 5) * 2 : 0,
  };
  const coronelBonus: DivinePassReward = {
    goldenFeathers: 30 + level * 5,
    milho: 2000 + level * 500,
    unguentos: 1 + Math.floor(level / 10),
    wildOrbs: 5 + Math.floor(level / 4),
    astralEssence: level % 5 === 0 ? Math.floor(level / 5) * 5 : 0,
    epicEggs: (level === 10 || level === 20 || isLvl40) ? 1 : 0,
    exclusiveFrame: isLvl40 ? 'Moldura do Coronel do Sertão' : undefined,
    seasonalRooster: isLvl30 ? 'Galo Sazonal do Mês' : undefined,
    seasonalRoosterGuaranteed: isLvl30 ? true : undefined,
  };
  const coronel: DivinePassReward = {
    goldenFeathers: retirante.goldenFeathers + coronelBonus.goldenFeathers,
    milho: retirante.milho + coronelBonus.milho,
    unguentos: retirante.unguentos + coronelBonus.unguentos,
    wildOrbs: retirante.wildOrbs + coronelBonus.wildOrbs,
    astralEssence: coronelBonus.astralEssence,
    epicEggs: coronelBonus.epicEggs,
    exclusiveFrame: coronelBonus.exclusiveFrame,
    seasonalRooster: coronelBonus.seasonalRooster,
    seasonalRoosterGuaranteed: coronelBonus.seasonalRoosterGuaranteed,
  };
  return {
    level, requiredXp: level * DIVINE_PASS_CONFIG.xpPerLevel,
    retirante, coronelBonus, coronel,
    trilhaDoRetirante: retirante, trilhaDoCoronel: coronel,
  };
}

export const DIVINE_PASS_LEVELS: readonly DivinePassLevelRewards[] = Array.from(
  { length: DIVINE_PASS_CONFIG.totalLevels }, (_, i) => buildPassLevel(i + 1),
);

export function getDivinePassRewards(level: number): DivinePassLevelRewards | undefined {
  if (level < 1 || level > DIVINE_PASS_CONFIG.totalLevels) return undefined;
  return DIVINE_PASS_LEVELS[level - 1];
}

export function getLoginCalendarReward(day: number): LoginCalendarReward | undefined {
  if (day < 1 || day > LOGIN_CALENDAR_CONFIG.totalDays) return undefined;
  return LOGIN_CALENDAR_REWARDS[day - 1];
}

export function calculatePassLevel(totalXp: number): number {
  if (totalXp < 0) return 0;
  return Math.min(DIVINE_PASS_CONFIG.totalLevels, Math.floor(totalXp / DIVINE_PASS_CONFIG.xpPerLevel));
}
