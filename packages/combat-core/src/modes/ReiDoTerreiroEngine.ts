import { type CombatUnit, type SlotIndex, isUnitAlive } from '../entities/CombatUnit.js';
import { SeededPRNG } from '../math/SeededPRNG.js';
import type { BattleResult } from '../simulator/BattleEngine.js';
import { BattleEngine } from '../simulator/BattleEngine.js';

export interface ReiDoTerreiroRoundInfo {
  roundNumber: number;
  winner: 'A' | 'B' | 'DRAW';
  durationTicks: number;
  durationSeconds: number;
  championRemainingVigor: number;
  challengerRemainingVigor: number;
  survivingChampionCount: number;
  battleResult: BattleResult;
}

export interface ReiDoTerreiroConfig {
  seed: number;
  championTeam: CombatUnit[];
  challengers: CombatUnit[][];
  reliefVigorPercent?: number;
  baseMilhoPerWin?: number;
  basePenasPerWin?: number;
  maxTicksPerRound?: number;
  recordEvents?: boolean;
}

export interface ReiDoTerreiroResult {
  championDefendedSuccessfully: boolean;
  winStreak: number;
  totalRoundsFought: number;
  rewardMultiplier: number;
  rewards: {
    milho: number;
    penas: number;
  };
  rounds: ReiDoTerreiroRoundInfo[];
  survivingChampionUnits: CombatUnit[];
}

function cloneRoster(units: CombatUnit[], side: 'A' | 'B'): CombatUnit[] {
  return units.map((u, i) => ({
    ...u,
    team: side,
    slotIndex: (i % 3) as SlotIndex,
    currentVigor: u.currentVigor > 0 ? u.currentVigor : u.maxVigor,
    canto: 0,
    activeStatuses: [],
    fenixUsed: false,
    reaperBlockedRevive: false,
    firstHitDone: false,
    stunImmuneTicks: 0,
    torcidaTicksRemaining: 0,
    specialAbility: { ...u.specialAbility },
  }));
}

export class ReiDoTerreiroEngine {
  public static readonly DEFAULT_RELIEF_PERCENT = 15;
  public static readonly DEFAULT_BASE_MILHO = 250;
  public static readonly DEFAULT_BASE_PENAS = 15;

  public static simulate(config: ReiDoTerreiroConfig): ReiDoTerreiroResult {
    const prng = new SeededPRNG(config.seed);
    const reliefPct = config.reliefVigorPercent ?? ReiDoTerreiroEngine.DEFAULT_RELIEF_PERCENT;
    const baseMilho = config.baseMilhoPerWin ?? ReiDoTerreiroEngine.DEFAULT_BASE_MILHO;
    const basePenas = config.basePenasPerWin ?? ReiDoTerreiroEngine.DEFAULT_BASE_PENAS;
    const maxTicks = config.maxTicksPerRound ?? 1800;
    const recordEvents = config.recordEvents ?? true;

    const championUnits = cloneRoster(config.championTeam, 'A');
    const rounds: ReiDoTerreiroRoundInfo[] = [];
    let winStreak = 0;

    for (let i = 0; i < config.challengers.length; i++) {
      const challengerUnits = cloneRoster(config.challengers[i]!, 'B');
      const roundSeed = prng.nextUint32();

      const battleResult = BattleEngine.simulate({
        seed: roundSeed,
        teamA: championUnits,
        teamB: challengerUnits,
        mode: championUnits.length === 1 ? '1x1' : '3v3',
        maxTicks,
        recordEvents,
      });

      const livingChampions = championUnits.filter(isUnitAlive);
      rounds.push({
        roundNumber: i + 1,
        winner: battleResult.winner,
        durationTicks: battleResult.durationTicks,
        durationSeconds: battleResult.durationSeconds,
        championRemainingVigor: battleResult.teamARemainingVigor,
        challengerRemainingVigor: battleResult.teamBRemainingVigor,
        survivingChampionCount: livingChampions.length,
        battleResult,
      });

      if (battleResult.winner === 'A') {
        winStreak += 1;
        for (const u of championUnits) {
          if (isUnitAlive(u)) {
            const relief = Math.floor((u.maxVigor * reliefPct) / 100);
            u.currentVigor = Math.min(u.maxVigor, u.currentVigor + relief);
            u.activeStatuses = [];
            u.canto = 0;
            u.castWindupRemainingTicks = 0;
            u.firstHitDone = false;
            u.nextAttackTick = 1;
          }
        }
      } else {
        break;
      }
    }

    const mult = winStreak > 0 ? 1.0 + winStreak * 0.2 : 1.0;
    const roundedMult = Math.round(mult * 100) / 100;
    const milho = Math.floor(winStreak * baseMilho * roundedMult);
    const penas = Math.floor(winStreak * basePenas * roundedMult);

    return {
      championDefendedSuccessfully:
        config.challengers.length > 0 && winStreak === config.challengers.length,
      winStreak,
      totalRoundsFought: rounds.length,
      rewardMultiplier: roundedMult,
      rewards: { milho, penas },
      rounds,
      survivingChampionUnits: championUnits.filter(isUnitAlive),
    };
  }
}

export const simulateReiDoTerreiro = ReiDoTerreiroEngine.simulate;
