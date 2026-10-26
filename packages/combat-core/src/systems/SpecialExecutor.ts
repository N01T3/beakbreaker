import type { StatusEffectType } from '@beakbreaker/game-data';
import type { CombatUnit } from '../entities/CombatUnit.js';
import { StatusEffectManager } from '../entities/StatusEffectManager.js';
import { clamp, floorDiv } from '../math/FixedMath.js';
import type { SeededPRNG } from '../math/SeededPRNG.js';
import type { BattleEvent } from '../simulator/BattleEngine.js';
import { CantoSystem } from './CantoSystem.js';
import { DamageCalculator } from './DamageCalculator.js';
import { InterruptSystem } from './InterruptSystem.js';
import { RaidBossSystem } from './RaidBossSystem.js';
import { TargetingSystem } from './TargetingSystem.js';

const POSITIVE_BUFFS: readonly StatusEffectType[] = [
  'Escudo',
  'Espinhos',
  'Furtivo',
  'Regeneracao',
  'RouboDeVida',
];

export class SpecialExecutor {
  public static execute(
    caster: CombatUnit,
    allies: CombatUnit[],
    enemies: CombatUnit[],
    tick: number,
    prng: SeededPRNG,
    emit: (ev: BattleEvent) => void,
  ): void {
    const spec = caster.specialAbility;
    caster.canto = 0;
    const targets = TargetingSystem.resolveSpecialTargets(
      caster,
      allies,
      enemies,
      spec.targetScope,
      prng,
      spec.hitCount,
    );

    if (spec.cleanseDebuffs) {
      for (const a of allies) {
        if (a.currentVigor > 0) StatusEffectManager.cleanseDebuffs(a);
      }
    }

    const allyTargets = targets.some((t) => t.team === caster.team) ? targets : [caster];
    const aoeAllyCount = Math.max(1, allyTargets.length);
    const hasPositiveBuff =
      Boolean(spec.effectApplied && POSITIVE_BUFFS.includes(spec.effectApplied) && spec.effectApplied !== 'Escudo');
    const supActions = Math.max(
      1,
      (spec.healPermille > 0 ? 1 : 0) +
        (spec.shieldPermille > 0 || spec.effectApplied === 'Provocado' ? 1 : 0) +
        (spec.cantoBonus > 0 ? 1 : 0) +
        (hasPositiveBuff ? 1 : 0),
    );
    let supportBudgetUsedPermille = 0;

    if (spec.healPermille > 0) {
      supportBudgetUsedPermille += 140;
      for (const ht of allyTargets) {
        if (ht.currentVigor > 0) {
          const rawHeal = floorDiv(caster.forca * 95, 1000 * aoeAllyCount * supActions);
          const heal = DamageCalculator.calculateHealOrShieldAmount(caster, rawHeal);
          ht.currentVigor = Math.min(ht.maxVigor, ht.currentVigor + heal);
        }
      }
    }

    if (spec.shieldPermille > 0 || spec.effectApplied === 'Provocado') {
      supportBudgetUsedPermille += 140;
      const shRecipients = spec.shieldPermille > 0 ? allyTargets : [caster];
      const shCount = Math.max(1, shRecipients.length);
      for (const st of shRecipients) {
        if (st.currentVigor > 0) {
          const rawShield = floorDiv(caster.forca * 90, 1000 * shCount * supActions);
          const shVal = DamageCalculator.calculateHealOrShieldAmount(caster, rawShield);
          StatusEffectManager.applyStatus(
            st,
            'Escudo',
            spec.effectDurationTicks || 40,
            caster,
            0,
            shVal,
          );
        }
      }
    }

    if (spec.cantoBonus > 0) {
      supportBudgetUsedPermille += 100;
      const grant = floorDiv(16, supActions);
      for (const a of allies) {
        if (a.currentVigor > 0 && a.id !== caster.id) {
          CantoSystem.addCanto(a, grant);
        }
      }
    }

    if (hasPositiveBuff && spec.effectApplied) {
      supportBudgetUsedPermille += 140;
      for (const bt of allyTargets) {
        if (bt.currentVigor > 0) {
          StatusEffectManager.applyStatus(bt, spec.effectApplied, Math.max(4, floorDiv(8, supActions)), caster, 6);
          emit({
            tick,
            type: 'STATUS_APPLIED',
            actorId: caster.id,
            targetId: bt.id,
            detail: spec.effectApplied,
          });
        }
      }
    }

    const focusTarget = TargetingSystem.selectBasicAttackTarget(caster, enemies);
    const enemyTargets = focusTarget ? [focusTarget] : [];
    const isDebuff = Boolean(spec.effectApplied && !POSITIVE_BUFFS.includes(spec.effectApplied));
    const statusTaxPermille = isDebuff ? 110 : 0;
    const normalizedSupportCost = floorDiv(supportBudgetUsedPermille, supActions);
    const perHitPermille = clamp(1020 - normalizedSupportCost - statusTaxPermille, 740, 1020);

    for (const target of enemyTargets) {
      if (target.currentVigor <= 0) continue;
      if (target.team !== caster.team) {
        const res = DamageCalculator.resolveHit(
          {
            attacker: caster,
            defender: target,
            mHabPermille: perHitPermille,
            isSpecial: true,
            ignoreDefensePermille: Math.min(30, spec.ignoreDefensePermille),
          },
          prng,
          false,
        );
        if (target.isRaidBoss && res.isCrit && res.vigorDamage > 0) {
          RaidBossSystem.reflectCritInPhase2(target, caster, res.vigorDamage, res.isCrit);
        }
        emit({
          tick,
          type: 'SPECIAL_CAST',
          actorId: caster.id,
          targetId: target.id,
          value: res.finalDamage,
          isCrit: res.isCrit,
        });
        if (res.triggeredFenixRevive) emit({ tick, type: 'FENIX_REVIVE', actorId: target.id });
        if (res.killedTarget) emit({ tick, type: 'UNIT_KO', actorId: target.id });
      }

      if (spec.cantoBonus < 0 && target.team !== caster.team) {
        const drain = Math.min(target.canto, 20);
        target.canto = clamp(target.canto - drain, 0, 1000);
        CantoSystem.addCanto(caster, drain);
      }

      if (isDebuff && spec.effectApplied && spec.effectDurationTicks > 0 && target.currentVigor > 0) {
        const wasWinding = target.castWindupRemainingTicks > 0;
        const cappedTicks = 5;
        if (StatusEffectManager.applyStatus(target, spec.effectApplied, cappedTicks, caster)) {
          emit({
            tick,
            type: 'STATUS_APPLIED',
            actorId: caster.id,
            targetId: target.id,
            detail: spec.effectApplied,
          });
          if (
            spec.effectApplied === 'Atordoado' &&
            wasWinding &&
            InterruptSystem.triggerCortaCanto(target)
          ) {
            emit({ tick, type: 'INTERRUPT_CORTA_CANTO', actorId: target.id, value: target.canto });
          }
        }
      }
    }
  }
}
