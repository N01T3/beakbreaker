import type { TowerModifierId } from '@beakbreaker/game-data';
import { type CombatUnit, isUnitAlive } from '../entities/CombatUnit.js';
import { StatusEffectManager } from '../entities/StatusEffectManager.js';
import { floorDiv, sha256Hex } from '../math/FixedMath.js';
import { SeededPRNG } from '../math/SeededPRNG.js';
import { CantoSystem } from '../systems/CantoSystem.js';
import { DamageCalculator } from '../systems/DamageCalculator.js';
import { InterruptSystem } from '../systems/InterruptSystem.js';
import { RaidBossSystem } from '../systems/RaidBossSystem.js';
import { SpecialExecutor } from '../systems/SpecialExecutor.js';
import { SynergyResolver } from '../systems/SynergyResolver.js';
import { TargetingSystem } from '../systems/TargetingSystem.js';

export type BattleEventType =
  | 'SYNERGY_APPLIED'
  | 'BASIC_ATTACK'
  | 'SPECIAL_WINDUP_START'
  | 'SPECIAL_CAST'
  | 'INTERRUPT_CORTA_CANTO'
  | 'STATUS_APPLIED'
  | 'BURN_TICK'
  | 'REGEN_TICK'
  | 'TORCIDA_ACTIVATED'
  | 'FENIX_REVIVE'
  | 'RAID_PHASE_TICK'
  | 'UNIT_KO';

export interface BattleEvent {
  tick: number;
  type: BattleEventType;
  actorId: string;
  targetId?: string;
  value?: number;
  isCrit?: boolean;
  detail?: string;
}

export interface TorcidaTrigger {
  tick: number;
  team: 'A' | 'B';
}

export interface BattleConfig {
  seed: number;
  teamA: CombatUnit[];
  teamB: CombatUnit[];
  mode?: '3v3' | '1x1' | 'raid' | 'tower';
  maxTicks?: number;
  towerModifier?: TowerModifierId;
  torcidaTriggers?: TorcidaTrigger[];
  recordEvents?: boolean;
}

export interface BattleResult {
  seed: number;
  winner: 'A' | 'B' | 'DRAW';
  durationTicks: number;
  durationSeconds: number;
  events: BattleEvent[];
  digestHash: string;
  teamARemainingVigor: number;
  teamBRemainingVigor: number;
}

export class BattleEngine {
  public static simulate(config: BattleConfig): BattleResult {
    const prng = new SeededPRNG(config.seed);
    const maxTicks = config.maxTicks ?? (config.mode === '1x1' ? 900 : 1800);
    const recordEvents = config.recordEvents ?? true;
    const events: BattleEvent[] = [];
    let h1 = (config.seed ^ 0x811c9dc5) >>> 0;
    let h2 = (config.seed ^ 0x9e3779b9) >>> 0;
    let eventCount = 0;
    const { teamA, teamB } = config;
    const allUnits = [...teamA, ...teamB];

    const emit = (ev: BattleEvent): void => {
      if (recordEvents) events.push(ev);
      eventCount += 1;
      h1 = Math.imul(h1 ^ ev.tick ^ (ev.value ?? 0), 0x01000193) >>> 0;
      h2 = Math.imul(h2 ^ eventCount ^ (ev.isCrit ? 0x55 : 0xaa) ^ ev.actorId.charCodeAt(0), 0x01000193) >>> 0;
    };

    const synA = SynergyResolver.applyTeamSynergiesAndSets(teamA);
    const synB = SynergyResolver.applyTeamSynergiesAndSets(teamB);
    emit({ tick: 0, type: 'SYNERGY_APPLIED', actorId: 'TEAM_A', detail: synA.activeSynergyIds.join(',') });
    emit({ tick: 0, type: 'SYNERGY_APPLIED', actorId: 'TEAM_B', detail: synB.activeSynergyIds.join(',') });
    for (const u of allUnits) u.nextAttackTick = CantoSystem.computeUnitAttackIntervalTicks(u);

    const maxTorcida = config.towerModifier === 'FestaNoArraial' ? 2 : 1;
    const torcidaUsed = { A: 0, B: 0 };
    const doubleCanto = config.towerModifier === 'FeNaSanfona';
    let lastTick = 0;

    for (let tick = 1; tick <= maxTicks; tick++) {
      lastTick = tick;
      if (!teamA.some(isUnitAlive) || !teamB.some(isUnitAlive)) break;

      if (config.torcidaTriggers) {
        for (const trig of config.torcidaTriggers) {
          if (trig.tick === tick && torcidaUsed[trig.team] < maxTorcida) {
            torcidaUsed[trig.team] += 1;
            for (const ally of trig.team === 'A' ? teamA : teamB) {
              if (ally.currentVigor > 0) ally.torcidaTicksRemaining = 100;
            }
            emit({ tick, type: 'TORCIDA_ACTIVATED', actorId: `TEAM_${trig.team}`, value: 100 });
          }
        }
      }

      let anyReady = false;
      for (const u of allUnits) {
        if (u.currentVigor <= 0) continue;
        if (u.isRaidBoss) {
          const bossOut = RaidBossSystem.processBossTick(u, u.team === 'A' ? teamB : teamA, tick);
          if (bossOut.appliedMassBurn || bossOut.furiaStackAdded) {
            emit({ tick, type: 'RAID_PHASE_TICK', actorId: u.id, value: bossOut.phase });
          }
        }
        const stOut = StatusEffectManager.tickUnitStatuses(u, tick);
        if (stOut.burnDamage > 0) {
          emit({ tick, type: 'BURN_TICK', actorId: u.id, value: stOut.burnDamage });
          if (u.currentVigor <= 0) emit({ tick, type: 'UNIT_KO', actorId: u.id });
        }
        if (stOut.regenHeal > 0) emit({ tick, type: 'REGEN_TICK', actorId: u.id, value: stOut.regenHeal });
        if (u.currentVigor > 0 && (u.castWindupRemainingTicks > 0 || u.canto >= 1000 || tick >= u.nextAttackTick)) {
          anyReady = true;
        }
      }
      if (!anyReady) continue;

      for (const actor of this.sortUnitsForTick(allUnits, prng)) {
        if (actor.currentVigor <= 0) continue;
        const allies = actor.team === 'A' ? teamA : teamB;
        const enemies = actor.team === 'A' ? teamB : teamA;
        if (!enemies.some(isUnitAlive)) break;

        const wState = InterruptSystem.advanceWindupTick(actor);
        if (wState === 'INTERRUPTED') {
          emit({ tick, type: 'INTERRUPT_CORTA_CANTO', actorId: actor.id, value: actor.canto });
          continue;
        }
        if (wState === 'READY_TO_FIRE') {
          SpecialExecutor.execute(actor, allies, enemies, tick, prng, emit);
          continue;
        }
        if (wState === 'WINDING_UP' || StatusEffectManager.hasStatus(actor, 'Atordoado')) continue;
        if (InterruptSystem.startSpecialWindup(actor)) {
          emit({ tick, type: 'SPECIAL_WINDUP_START', actorId: actor.id });
          continue;
        }
        if (tick >= actor.nextAttackTick) {
          const target = TargetingSystem.selectBasicAttackTarget(actor, enemies);
          if (target) {
            const hit = DamageCalculator.resolveHit({ attacker: actor, defender: target, mHabPermille: 1000, isSpecial: false }, prng);
            if (target.isRaidBoss && hit.isCrit && hit.vigorDamage > 0) {
              RaidBossSystem.reflectCritInPhase2(target, actor, hit.vigorDamage, hit.isCrit);
            }
            const gain = CantoSystem.computeUnitCantoPerHit(actor, doubleCanto);
            CantoSystem.addCanto(actor, gain);
            CantoSystem.addCanto(target, floorDiv(gain, 3));
            emit({ tick, type: 'BASIC_ATTACK', actorId: actor.id, targetId: target.id, value: hit.finalDamage, isCrit: hit.isCrit });
            if (hit.triggeredFenixRevive) emit({ tick, type: 'FENIX_REVIVE', actorId: target.id });
            if (hit.killedTarget) emit({ tick, type: 'UNIT_KO', actorId: target.id });
          }
          actor.nextAttackTick = tick + CantoSystem.computeUnitAttackIntervalTicks(actor);
        }
      }
    }

    const remA = teamA.reduce((acc, u) => acc + Math.max(0, u.currentVigor), 0);
    const remB = teamB.reduce((acc, u) => acc + Math.max(0, u.currentVigor), 0);
    const winner: 'A' | 'B' | 'DRAW' = remA > remB ? 'A' : remB > remA ? 'B' : 'DRAW';
    const summary = `${config.seed}:${winner}:${lastTick}:${remA}:${remB}:${eventCount}:${h1}:${h2}`;
    return {
      seed: config.seed, winner, durationTicks: lastTick,
      durationSeconds: Math.floor((lastTick * 10) / 20) / 10,
      events, digestHash: sha256Hex(summary),
      teamARemainingVigor: remA, teamBRemainingVigor: remB,
    };
  }

  private static sortUnitsForTick(allUnits: CombatUnit[], prng: SeededPRNG): CombatUnit[] {
    const alive = allUnits.filter(isUnitAlive);
    return alive.sort((a, b) => {
      const vd = StatusEffectManager.getEffectiveVelocidade(b) - StatusEffectManager.getEffectiveVelocidade(a);
      if (vd !== 0) return vd;
      if (a.row !== b.row) return a.row === 'Frente' ? -1 : 1;
      if (a.slotIndex !== b.slotIndex) return a.slotIndex - b.slotIndex;
      return (prng.nextUint32() & 1) === 0 ? -1 : 1;
    });
  }
}
