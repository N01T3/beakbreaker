import {
  getCordelFolhetoById,
  getCordelFolhetos,
  getRoosterById,
  type CordelPuzzleFolheto,
  type CordelPuzzleReward,
  type PuzzleVictoryCondition,
} from '@beakbreaker/game-data';
import {
  BattleEngine,
  createCombatUnitFromSpec,
  isUnitAlive,
  type CombatUnit,
} from '@beakbreaker/combat-core';

export const CORDEL_PUZZLE_FOLEGO_COST = 0;

export interface CordelBattleOutcome {
  readonly folhetoId: string;
  readonly victory: boolean;
  readonly victoryConditionMet: boolean;
  readonly battleWinner: 'A' | 'B' | 'DRAW';
  readonly durationTicks: number;
  readonly survivingAlliesCount: number;
  readonly folegoSpent: 0;
  readonly rewards: CordelPuzzleReward | null;
  readonly isFirstClear: boolean;
  readonly isSeasonBonus: boolean;
}

export interface CordelExecutionOptions {
  readonly seed?: number;
  readonly maxTicks?: number;
  readonly isSeasonActive?: boolean;
  readonly completedPuzzleIds?: readonly string[];
}

function buildCombatTeam(
  units: readonly { roosterSpecId: string; row: 'frente' | 'tras' }[],
  teamSide: 'A' | 'B',
): CombatUnit[] {
  return units.map((u, idx) => {
    const spec = getRoosterById(u.roosterSpecId);
    if (!spec) {
      throw new Error(`Galo atleta de spec "${u.roosterSpecId}" nao encontrado.`);
    }
    return createCombatUnitFromSpec(spec, {
      id: `${teamSide}_${idx}_${spec.id}`,
      team: teamSide,
      slotIndex: idx as 0 | 1 | 2,
      row: u.row === 'frente' ? 'Frente' : 'Tras',
    });
  });
}

export function checkVictoryCondition(
  condition: PuzzleVictoryCondition,
  battleWinner: 'A' | 'B' | 'DRAW',
  teamA: readonly CombatUnit[],
  teamB: readonly CombatUnit[],
  durationTicks: number,
  targetTicks?: number,
): boolean {
  switch (condition) {
    case 'defeat_all':
      return battleWinner === 'A' && teamB.every((u) => !isUnitAlive(u));
    case 'no_ally_defeated':
      return battleWinner === 'A' && teamA.every((u) => isUnitAlive(u));
    case 'survive_time': {
      const threshold = targetTicks ?? 400;
      const allyAlive = teamA.some((u) => isUnitAlive(u));
      return allyAlive && (durationTicks >= threshold || battleWinner === 'A');
    }
    default:
      return battleWinner === 'A';
  }
}

export function executeCordelPuzzle(
  folhetoOrId: CordelPuzzleFolheto | string,
  options: CordelExecutionOptions = {},
): CordelBattleOutcome {
  const folheto =
    typeof folhetoOrId === 'string'
      ? getCordelFolhetoById(folhetoOrId)
      : folhetoOrId;

  if (!folheto) {
    throw new Error(`Folheto de cordel nao encontrado.`);
  }

  const teamA = buildCombatTeam(folheto.borrowedTeam, 'A');
  const teamB = buildCombatTeam(folheto.opponentTeam, 'B');

  const maxTicks = options.maxTicks ?? folheto.targetTicks ?? 900;
  const result = BattleEngine.simulate({
    seed: options.seed ?? 19283746,
    teamA,
    teamB,
    maxTicks,
  });

  const survivingAllies = teamA.filter((u) => isUnitAlive(u)).length;
  const conditionMet = checkVictoryCondition(
    folheto.victoryCondition,
    result.winner,
    teamA,
    teamB,
    result.durationTicks,
    folheto.targetTicks,
  );

  const victory = conditionMet;
  const completedIds = options.completedPuzzleIds ?? [];
  const isFirstClear = victory && !completedIds.includes(folheto.id);
  const isSeasonBonus = victory && Boolean(options.isSeasonActive);

  let rewards: CordelPuzzleReward | null = null;
  if (victory) {
    const base = isFirstClear
      ? folheto.firstClearReward
      : { goldenFeathers: 10, wildOrbs: 2 };
    const bonus = isSeasonBonus
      ? folheto.seasonBonusReward
      : { goldenFeathers: 0, wildOrbs: 0 };
    rewards = {
      goldenFeathers: base.goldenFeathers + bonus.goldenFeathers,
      wildOrbs: base.wildOrbs + bonus.wildOrbs,
    };
  }

  return {
    folhetoId: folheto.id,
    victory,
    victoryConditionMet: conditionMet,
    battleWinner: result.winner,
    durationTicks: result.durationTicks,
    survivingAlliesCount: survivingAllies,
    folegoSpent: 0,
    rewards,
    isFirstClear,
    isSeasonBonus,
  };
}

export function getUnlockedFolhetos(
  completedIds: readonly string[],
): readonly CordelPuzzleFolheto[] {
  const all = getCordelFolhetos();
  if (all.length === 0) return [];
  return all.filter((f, idx) => idx === 0 || completedIds.includes(all[idx - 1]!.id));
}
