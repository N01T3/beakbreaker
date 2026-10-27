import { getRoosterById } from '@beakbreaker/game-data';
import type { CombatUnit, SlotIndex } from '../entities/CombatUnit.js';
import { clamp } from '../math/FixedMath.js';
import type { BattleResult } from '../simulator/BattleEngine.js';
import { BattleEngine } from '../simulator/BattleEngine.js';
import { SynergyResolver } from '../systems/SynergyResolver.js';

export interface ArenaNiveladaConfig {
  seed: number;
  teamA: CombatUnit[];
  teamB: CombatUnit[];
  maxTicks?: number;
  recordEvents?: boolean;
}

export interface ArenaNiveladaResult {
  seed: number;
  winner: 'A' | 'B' | 'DRAW';
  durationTicks: number;
  durationSeconds: number;
  teamARemainingVigor: number;
  teamBRemainingVigor: number;
  synergiesTeamA: string[];
  synergiesTeamB: string[];
  normalizedTeamA: CombatUnit[];
  normalizedTeamB: CombatUnit[];
  battleResult: BattleResult;
}

export function normalizeUnitToLevel30(
  unit: CombatUnit,
  team: 'A' | 'B',
  slotIndex: SlotIndex,
): CombatUnit {
  const spec = getRoosterById(unit.specId);
  const base = spec?.baseStats;
  const maxVigor = base ? base.vigor : unit.maxVigor;

  return {
    ...unit,
    team,
    slotIndex,
    row: unit.row ?? spec?.preferredRow ?? 'Frente',
    maxVigor,
    currentVigor: maxVigor,
    forca: base ? base.forca : unit.forca,
    defesa: base ? base.defesa : unit.defesa,
    velocidade: base ? base.velocidade : unit.velocidade,
    tecnica: clamp(base ? base.tecnica : unit.tecnica, 0, 100),
    garra: base ? base.garra : unit.garra,
    esquiva: clamp(base?.esquiva ?? unit.esquiva ?? 0, 0, 60),
    equippedSet: undefined,
    perkGem: undefined,
    canto: 0,
    nextAttackTick: 1,
    castWindupRemainingTicks: 0,
    fenixUsed: false,
    reaperBlockedRevive: false,
    firstHitDone: false,
    stunImmuneTicks: 0,
    torcidaTicksRemaining: 0,
    synergyDamageVsControlledPermille: 0,
    isRaidBoss: false,
    raidDifficulty: 1,
    colossoFuriaStacks: 0,
    activeStatuses: [],
    specialAbility: spec ? { ...spec.specialAbility } : { ...unit.specialAbility },
  };
}

export class ArenaNiveladaEngine {
  public static readonly MAX_TICKS_3V3 = 1800;

  public static simulate(config: ArenaNiveladaConfig): ArenaNiveladaResult {
    const maxTicks = config.maxTicks ?? ArenaNiveladaEngine.MAX_TICKS_3V3;

    const normalizedTeamA = config.teamA.map((u, i) =>
      normalizeUnitToLevel30(u, 'A', (i % 3) as SlotIndex),
    );
    const normalizedTeamB = config.teamB.map((u, i) =>
      normalizeUnitToLevel30(u, 'B', (i % 3) as SlotIndex),
    );

    const synA = SynergyResolver.evaluateClasses(normalizedTeamA.map((u) => u.roosterClass));
    const synB = SynergyResolver.evaluateClasses(normalizedTeamB.map((u) => u.roosterClass));

    const battleResult = BattleEngine.simulate({
      seed: config.seed,
      teamA: normalizedTeamA,
      teamB: normalizedTeamB,
      mode: '3v3',
      maxTicks,
      recordEvents: config.recordEvents ?? true,
    });

    return {
      seed: config.seed,
      winner: battleResult.winner,
      durationTicks: battleResult.durationTicks,
      durationSeconds: battleResult.durationSeconds,
      teamARemainingVigor: battleResult.teamARemainingVigor,
      teamBRemainingVigor: battleResult.teamBRemainingVigor,
      synergiesTeamA: synA.activeSynergyIds,
      synergiesTeamB: synB.activeSynergyIds,
      normalizedTeamA,
      normalizedTeamB,
      battleResult,
    };
  }
}

export const simulateArenaNivelada = ArenaNiveladaEngine.simulate;
