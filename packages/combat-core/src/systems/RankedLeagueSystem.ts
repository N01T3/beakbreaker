/**
 * RankedLeagueSystem.ts
 * Sistema oficial da Liga Ranqueada do Sertão com 6 Divisões e cálculo de ELO / Troféus.
 */

export type LeagueDivisionName =
  | 'Bronze do Brejo'
  | 'Prata da Caatinga'
  | 'Ouro do Sertão'
  | 'Diamante Mandacaru'
  | 'Lenda do Agreste'
  | 'Supremo Sertão';

export type LeagueTierName = LeagueDivisionName;

export interface SeasonRewards {
  penasDouradas: number;
  orbesCuringa: number;
}

export interface LeagueDivisionConfig {
  readonly name: LeagueDivisionName;
  readonly minTrophies: number;
  readonly maxTrophies: number;
  readonly rewards: SeasonRewards;
}

export const LEAGUE_DIVISIONS: readonly LeagueDivisionConfig[] = [
  {
    name: 'Bronze do Brejo',
    minTrophies: 0,
    maxTrophies: 399,
    rewards: { penasDouradas: 100, orbesCuringa: 0 },
  },
  {
    name: 'Prata da Caatinga',
    minTrophies: 400,
    maxTrophies: 999,
    rewards: { penasDouradas: 300, orbesCuringa: 0 },
  },
  {
    name: 'Ouro do Sertão',
    minTrophies: 1000,
    maxTrophies: 1799,
    rewards: { penasDouradas: 800, orbesCuringa: 10 },
  },
  {
    name: 'Diamante Mandacaru',
    minTrophies: 1800,
    maxTrophies: 2799,
    rewards: { penasDouradas: 1500, orbesCuringa: 30 },
  },
  {
    name: 'Lenda do Agreste',
    minTrophies: 2800,
    maxTrophies: 3999,
    rewards: { penasDouradas: 2500, orbesCuringa: 60 },
  },
  {
    name: 'Supremo Sertão',
    minTrophies: 4000,
    maxTrophies: Number.POSITIVE_INFINITY,
    rewards: { penasDouradas: 4000, orbesCuringa: 100 },
  },
] as const;

export function getLeagueTier(trophies: number): LeagueDivisionName {
  const t = Math.max(0, Math.floor(trophies));
  if (t >= 4000) return 'Supremo Sertão';
  if (t >= 2800) return 'Lenda do Agreste';
  if (t >= 1800) return 'Diamante Mandacaru';
  if (t >= 1000) return 'Ouro do Sertão';
  if (t >= 400) return 'Prata da Caatinga';
  return 'Bronze do Brejo';
}

export function getLeagueDivision(trophies: number): LeagueDivisionConfig {
  const tierName = getLeagueTier(trophies);
  return (
    LEAGUE_DIVISIONS.find((d) => d.name === tierName) ?? LEAGUE_DIVISIONS[0]
  );
}

export function getSeasonEndRewards(trophies: number): SeasonRewards {
  const div = getLeagueDivision(trophies);
  return { ...div.rewards };
}

export function calculateMatchTrophies(
  playerTrophies: number,
  opponentTrophies: number,
  won: boolean,
  winStreak = 0,
): number {
  const pTrophies = Math.max(0, Math.floor(playerTrophies));
  const oTrophies = Math.max(0, Math.floor(opponentTrophies));

  if (won) {
    const diff = oTrophies - pTrophies;
    const diffBonus = Math.max(-15, Math.min(15, Math.round(diff / 50)));
    const streakBonus = Math.max(0, Math.floor(winStreak)) >= 3 ? 10 : 0;
    return 30 + diffBonus + streakBonus;
  }

  if (pTrophies <= 0) return 0;
  const isBelowGold = pTrophies < 1000;
  const baseLoss = isBelowGold ? -10 : -20;
  return Math.max(-pTrophies, baseLoss);
}

export class RankedLeagueSystem {
  public static readonly DIVISIONS = LEAGUE_DIVISIONS;
  public static getLeagueTier = getLeagueTier;
  public static getLeagueDivision = getLeagueDivision;
  public static getSeasonEndRewards = getSeasonEndRewards;
  public static calculateMatchTrophies = calculateMatchTrophies;
}
