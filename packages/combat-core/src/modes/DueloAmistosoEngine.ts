import type { CombatUnit } from '../entities/CombatUnit.js';
import type { BattleEvent, BattleResult } from '../simulator/BattleEngine.js';
import { BattleEngine } from '../simulator/BattleEngine.js';

export interface GolpeLogEntry {
  tick: number;
  type: string;
  actorId: string;
  targetId?: string;
  value?: number;
  isCrit?: boolean;
}

export interface DueloAmistosoConfig {
  seed: number;
  athleteA: CombatUnit;
  athleteB: CombatUnit;
  maxTicks?: number;
  recordEvents?: boolean;
}

export interface DueloAmistosoResult {
  seed: number;
  winner: 'A' | 'B' | 'DRAW';
  winnerAthleteId?: string;
  durationTicks: number;
  durationSeconds: number;
  trophiesDelta: 0;
  isFriendly: true;
  athleteARemainingVigor: number;
  athleteBRemainingVigor: number;
  logDeGolpes: GolpeLogEntry[];
  battleResult: BattleResult;
}

function cloneAthlete(u: CombatUnit, team: 'A' | 'B'): CombatUnit {
  return {
    ...u,
    team,
    slotIndex: 0,
    row: u.row ?? 'Frente',
    currentVigor: u.currentVigor > 0 ? u.currentVigor : u.maxVigor,
    canto: 0,
    activeStatuses: [],
    fenixUsed: false,
    reaperBlockedRevive: false,
    firstHitDone: false,
    stunImmuneTicks: 0,
    torcidaTicksRemaining: 0,
    specialAbility: { ...u.specialAbility },
  };
}

export class DueloAmistosoEngine {
  public static readonly MAX_TICKS_45S = 900;

  public static simulate(config: DueloAmistosoConfig): DueloAmistosoResult {
    const maxTicks = config.maxTicks ?? DueloAmistosoEngine.MAX_TICKS_45S;
    const unitA = cloneAthlete(config.athleteA, 'A');
    const unitB = cloneAthlete(config.athleteB, 'B');

    const battleResult = BattleEngine.simulate({
      seed: config.seed,
      teamA: [unitA],
      teamB: [unitB],
      mode: '1x1',
      maxTicks,
      recordEvents: config.recordEvents ?? true,
    });

    const logDeGolpes: GolpeLogEntry[] = battleResult.events
      .filter(
        (e: BattleEvent) =>
          e.type === 'BASIC_ATTACK' ||
          e.type === 'SPECIAL_CAST' ||
          e.type === 'BURN_TICK' ||
          e.type === 'UNIT_KO',
      )
      .map((e: BattleEvent) => ({
        tick: e.tick,
        type: e.type,
        actorId: e.actorId,
        targetId: e.targetId,
        value: e.value,
        isCrit: e.isCrit,
      }));

    const winnerAthleteId =
      battleResult.winner === 'A'
        ? config.athleteA.id
        : battleResult.winner === 'B'
          ? config.athleteB.id
          : undefined;

    return {
      seed: config.seed,
      winner: battleResult.winner,
      winnerAthleteId,
      durationTicks: battleResult.durationTicks,
      durationSeconds: battleResult.durationSeconds,
      trophiesDelta: 0,
      isFriendly: true,
      athleteARemainingVigor: battleResult.teamARemainingVigor,
      athleteBRemainingVigor: battleResult.teamBRemainingVigor,
      logDeGolpes,
      battleResult,
    };
  }
}

export const simulateDueloAmistoso = DueloAmistosoEngine.simulate;
