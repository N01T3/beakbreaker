import { type CombatUnit, isUnitAlive } from '../entities/CombatUnit.js';
import { StatusEffectManager } from '../entities/StatusEffectManager.js';
import { floorDiv, sha256Hex } from '../math/FixedMath.js';
import { SeededPRNG } from '../math/SeededPRNG.js';
import type { BattleEvent, BattleResult } from './BattleEngine.js';
import { CantoSystem } from '../systems/CantoSystem.js';
import { DamageCalculator } from '../systems/DamageCalculator.js';
import { FarmDefenseSystem, type DefenseWaveLevels, createRuralDefenseWave } from '../systems/FarmDefenseSystem.js';
import { InterruptSystem } from '../systems/InterruptSystem.js';
import { SpecialExecutor } from '../systems/SpecialExecutor.js';
import { SynergyResolver } from '../systems/SynergyResolver.js';
import { TargetingSystem } from '../systems/TargetingSystem.js';

export interface TwoWaveRaidConfig {
  seed: number; attackerTeam?: CombatUnit[]; attackers?: CombatUnit[];
  defenses?: CombatUnit[]; ruralDefenses?: CombatUnit[]; defenseLevels?: DefenseWaveLevels;
  guardianTeam?: CombatUnit[]; guardians?: CombatUnit[];
  maxTicksPerWave?: number; recordEvents?: boolean;
}

export interface TwoWaveRaidResult {
  winner: 'ATTACKER' | 'DEFENDER';
  wave1Result: BattleResult; wave2Result?: BattleResult;
  survivingAttackerUnits: CombatUnit[];
  totalTicks: number; shieldDurationHours: number;
}

function simulateWave(
  teamA: CombatUnit[], teamB: CombatUnit[], seed: number, maxTicks: number, recordEvents: boolean, isWave1: boolean,
): BattleResult {
  const prng = new SeededPRNG(seed);
  const events: BattleEvent[] = [];
  let h1 = (seed ^ 0x811c9dc5) >>> 0, h2 = (seed ^ 0x9e3779b9) >>> 0, eventCount = 0;
  const emit = (ev: BattleEvent): void => {
    if (recordEvents) events.push(ev);
    eventCount += 1;
    h1 = Math.imul(h1 ^ ev.tick ^ (ev.value ?? 0), 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ eventCount ^ (ev.isCrit ? 0x55 : 0xaa) ^ ev.actorId.charCodeAt(0), 0x01000193) >>> 0;
  };

  if (isWave1) {
    const synA = SynergyResolver.applyTeamSynergiesAndSets(teamA);
    emit({ tick: 0, type: 'SYNERGY_APPLIED', actorId: 'TEAM_A', detail: synA.activeSynergyIds.join(',') });
    FarmDefenseSystem.applyCataVentoAura(teamB);
  } else {
    const synB = SynergyResolver.applyTeamSynergiesAndSets(teamB);
    emit({ tick: 0, type: 'SYNERGY_APPLIED', actorId: 'TEAM_B', detail: synB.activeSynergyIds.join(',') });
  }

  for (const u of [...teamA, ...teamB]) u.nextAttackTick = CantoSystem.computeUnitAttackIntervalTicks(u);
  let lastTick = 0;

  for (let tick = 1; tick <= maxTicks; tick++) {
    lastTick = tick;
    if (!teamA.some(isUnitAlive) || !teamB.some(isUnitAlive)) break;
    if (isWave1) {
      FarmDefenseSystem.enforceAntiStealth(teamB, teamA);
      if (tick % FarmDefenseSystem.ESTILINGUE_INTERVAL_TICKS === 0) {
        for (const def of teamB) {
          if (def.specId === 'estilingue_sabugo' && isUnitAlive(def)) {
            const hit = FarmDefenseSystem.executeEstilingueArtillery(def, teamA, prng);
            if (hit) {
              emit({ tick, type: 'BASIC_ATTACK', actorId: def.id, targetId: hit.target.id, value: hit.damage });
              if (hit.target.currentVigor <= 0) emit({ tick, type: 'UNIT_KO', actorId: hit.target.id });
            }
          }
        }
      }
    }

    for (const u of [...teamA, ...teamB]) {
      if (u.currentVigor <= 0) continue;
      const stOut = StatusEffectManager.tickUnitStatuses(u, tick);
      if (stOut.burnDamage > 0) emit({ tick, type: 'BURN_TICK', actorId: u.id, value: stOut.burnDamage });
      if (stOut.regenHeal > 0) emit({ tick, type: 'REGEN_TICK', actorId: u.id, value: stOut.regenHeal });
    }

    const aliveUnits = [...teamA, ...teamB].filter(isUnitAlive).sort((a, b) => {
      const vd = StatusEffectManager.getEffectiveVelocidade(b) - StatusEffectManager.getEffectiveVelocidade(a);
      if (vd !== 0) return vd;
      if (a.row !== b.row) return a.row === 'Frente' ? -1 : 1;
      return a.slotIndex - b.slotIndex;
    });

    for (const actor of aliveUnits) {
      if (actor.currentVigor <= 0) continue;
      const allies = actor.team === 'A' ? teamA : teamB;
      const enemies = actor.team === 'A' ? teamB : teamA;
      if (!enemies.some(isUnitAlive)) break;
      const wState = InterruptSystem.advanceWindupTick(actor);
      if (wState === 'INTERRUPTED') { emit({ tick, type: 'INTERRUPT_CORTA_CANTO', actorId: actor.id, value: actor.canto }); continue; }
      if (wState === 'READY_TO_FIRE') { SpecialExecutor.execute(actor, allies, enemies, tick, prng, emit); continue; }
      if (wState === 'WINDING_UP' || StatusEffectManager.hasStatus(actor, 'Atordoado')) continue;
      if (InterruptSystem.startSpecialWindup(actor)) { emit({ tick, type: 'SPECIAL_WINDUP_START', actorId: actor.id }); continue; }

      if (tick >= actor.nextAttackTick) {
        const target = TargetingSystem.selectBasicAttackTarget(actor, enemies);
        if (target) {
          const prevVigor = target.currentVigor;
          const hit = DamageCalculator.resolveHit({ attacker: actor, defender: target, mHabPermille: 1000, isSpecial: false }, prng);
          if (isWave1 && target.specId === 'espantalho_assombrado') {
            const stunned = FarmDefenseSystem.checkEspantalhoTrigger(target, prevVigor, actor);
            if (stunned) emit({ tick, type: 'STATUS_APPLIED', actorId: target.id, targetId: actor.id, value: 20 });
          }
          const gain = CantoSystem.computeUnitCantoPerHit(actor);
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
  const summary = `${seed}:${winner}:${lastTick}:${remA}:${remB}:${eventCount}:${h1}:${h2}`;
  return {
    seed, winner, durationTicks: lastTick, durationSeconds: Math.floor((lastTick * 10) / 20) / 10,
    events, digestHash: sha256Hex(summary), teamARemainingVigor: remA, teamBRemainingVigor: remB,
  };
}

export class TwoWaveRaidSimulator {
  public static simulate(config: TwoWaveRaidConfig): TwoWaveRaidResult {
    const attackers = config.attackerTeam ?? config.attackers;
    const guardians = config.guardianTeam ?? config.guardians;
    if (!attackers || !guardians) throw new Error('attackers and guardians are required');
    const defenses = config.defenses ?? config.ruralDefenses ?? createRuralDefenseWave(config.defenseLevels);
    const maxTicks = config.maxTicksPerWave ?? 1800;
    const recordEvents = config.recordEvents ?? true;
    const prng = new SeededPRNG(config.seed);

    const wave1Result = simulateWave(attackers, defenses, prng.nextUint32(), maxTicks, recordEvents, true);
    const survivingAttackers = attackers.filter(isUnitAlive);
    if (wave1Result.winner !== 'A' || survivingAttackers.length === 0) {
      return { winner: 'DEFENDER', wave1Result, survivingAttackerUnits: [], totalTicks: wave1Result.durationTicks, shieldDurationHours: 8 };
    }

    for (const u of survivingAttackers) {
      u.activeStatuses = []; u.canto = 0; u.castWindupRemainingTicks = 0; u.firstHitDone = false; u.nextAttackTick = 1;
    }

    const wave2Result = simulateWave(survivingAttackers, guardians, prng.nextUint32(), maxTicks, recordEvents, false);
    const finalSurviving = survivingAttackers.filter(isUnitAlive);
    const winner = wave2Result.winner === 'A' ? 'ATTACKER' : 'DEFENDER';

    return {
      winner, wave1Result, wave2Result, survivingAttackerUnits: finalSurviving,
      totalTicks: wave1Result.durationTicks + wave2Result.durationTicks, shieldDurationHours: 8,
    };
  }
}

export const simulateTwoWaveRaid = TwoWaveRaidSimulator.simulate;
