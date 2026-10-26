import type { StatusEffectType } from '@beakbreaker/game-data';
import { clamp, mulPermille } from '../math/FixedMath.js';
import type { SeededPRNG } from '../math/SeededPRNG.js';
import type { CombatUnit } from './CombatUnit.js';

export const CONTROL_EFFECTS: readonly StatusEffectType[] = [
  'Atordoado',
  'Cego',
  'Silenciado',
  'Lento',
  'Provocado',
];

export const DEBUFF_EFFECTS: readonly StatusEffectType[] = [
  'Atordoado',
  'Cego',
  'Silenciado',
  'Lento',
  'Queimadura',
  'Provocado',
];

export interface StatusTickResult {
  burnDamage: number;
  regenHeal: number;
  stunExpired: boolean;
}

export class StatusEffectManager {
  public static hasStatus(unit: CombatUnit, type: StatusEffectType): boolean {
    return unit.activeStatuses.some((s) => s.type === type && s.remainingTicks > 0);
  }

  public static isStunImmune(unit: CombatUnit): boolean {
    return unit.stunImmuneTicks > 0;
  }

  public static getTotalShield(unit: CombatUnit): number {
    let total = 0;
    for (const s of unit.activeStatuses) {
      if (s.type === 'Escudo' && s.remainingTicks > 0 && s.shieldValue > 0) {
        total += s.shieldValue;
      }
    }
    return total;
  }

  public static applyStatus(
    target: CombatUnit,
    type: StatusEffectType,
    durationTicks: number,
    sourceUnit?: CombatUnit,
    valuePermille = 0,
    shieldAmount = 0,
  ): boolean {
    if (target.currentVigor <= 0) return false;

    if (type === 'Provocado' && target.roosterClass === 'Tanque') {
      return false;
    }
    if (type === 'Atordoado' && target.stunImmuneTicks > 0) {
      return false;
    }
    if (target.isRaidBoss && (type === 'Atordoado' || type === 'Provocado')) {
      const vigorRatioPermille = Math.floor((target.currentVigor * 1000) / target.maxVigor);
      if (vigorRatioPermille <= 330) return false;
    }

    let finalTicks = durationTicks;
    if (sourceUnit?.roosterClass === 'Controle' && CONTROL_EFFECTS.includes(type)) {
      finalTicks += 10;
    }

    if (type === 'Atordoado') finalTicks = clamp(finalTicks, 1, 60);
    else if (type === 'Silenciado') finalTicks = clamp(finalTicks, 1, 40);
    else if (type === 'Furtivo') finalTicks = clamp(finalTicks, 1, 30);
    else finalTicks = Math.max(1, finalTicks);

    let cappedValuePermille = valuePermille;
    if (type === 'RouboDeVida') {
      cappedValuePermille = clamp(valuePermille || 150, 0, 300);
    } else if (type === 'Regeneracao' && cappedValuePermille <= 0) {
      cappedValuePermille = 20;
    } else if (type === 'Espinhos' && cappedValuePermille <= 0) {
      cappedValuePermille = 200;
    }

    if (type === 'Escudo') {
      const maxShield = mulPermille(target.maxVigor, 500);
      const currentShield = this.getTotalShield(target);
      const allowedAdd = Math.max(0, maxShield - currentShield);
      const finalShield = Math.min(shieldAmount, allowedAdd);
      if (finalShield <= 0) return false;
      target.activeStatuses.push({
        type: 'Escudo',
        remainingTicks: finalTicks,
        valuePermille: 0,
        shieldValue: finalShield,
        sourceUnitId: sourceUnit?.id ?? target.id,
      });
      return true;
    }

    const existing = target.activeStatuses.find((s) => s.type === type);
    if (existing) {
      existing.remainingTicks = Math.max(existing.remainingTicks, finalTicks);
      existing.valuePermille = Math.max(existing.valuePermille, cappedValuePermille);
      existing.sourceUnitId = sourceUnit?.id ?? existing.sourceUnitId;
    } else {
      target.activeStatuses.push({
        type,
        remainingTicks: finalTicks,
        valuePermille: cappedValuePermille,
        shieldValue: 0,
        sourceUnitId: sourceUnit?.id ?? target.id,
      });
    }
    return true;
  }

  public static absorbDamageWithShield(target: CombatUnit, damage: number): number {
    let remainingDamage = damage;
    for (let i = target.activeStatuses.length - 1; i >= 0; i--) {
      const s = target.activeStatuses[i];
      if (s.type === 'Escudo' && s.remainingTicks > 0 && s.shieldValue > 0 && remainingDamage > 0) {
        const absorbed = Math.min(s.shieldValue, remainingDamage);
        s.shieldValue -= absorbed;
        remainingDamage -= absorbed;
        if (s.shieldValue <= 0) {
          target.activeStatuses.splice(i, 1);
        }
      }
    }
    return remainingDamage;
  }

  public static rollBlindMiss(attacker: CombatUnit, prng: SeededPRNG): boolean {
    if (!this.hasStatus(attacker, 'Cego')) return false;
    return prng.chancePermille(500);
  }

  public static getEffectiveVelocidade(unit: CombatUnit): number {
    let vel = unit.velocidade;
    if (unit.torcidaTicksRemaining > 0) {
      vel = mulPermille(vel, 1150);
    }
    if (this.hasStatus(unit, 'Lento')) {
      vel = mulPermille(vel, 700);
    }
    return Math.max(1, vel);
  }

  public static cleanseDebuffs(unit: CombatUnit): void {
    unit.activeStatuses = unit.activeStatuses.filter((s) => !DEBUFF_EFFECTS.includes(s.type));
  }

  public static tickUnitStatuses(unit: CombatUnit, currentTick: number): StatusTickResult {
    const result: StatusTickResult = { burnDamage: 0, regenHeal: 0, stunExpired: false };
    if (unit.currentVigor <= 0) return result;

    if (unit.stunImmuneTicks > 0) {
      unit.stunImmuneTicks -= 1;
    }
    if (unit.torcidaTicksRemaining > 0) {
      unit.torcidaTicksRemaining -= 1;
    }

    if (currentTick > 0 && currentTick % 10 === 0 && this.hasStatus(unit, 'Queimadura')) {
      const baseVigor = unit.maxVigor > 15000 ? Math.floor(unit.maxVigor / 3) : unit.maxVigor;
      const dmg = Math.max(1, mulPermille(baseVigor, 15));
      unit.currentVigor = Math.max(0, unit.currentVigor - dmg);
      result.burnDamage = dmg;
    }

    if (unit.currentVigor > 0 && currentTick > 0 && currentTick % 20 === 0) {
      const regen = unit.activeStatuses.find((s) => s.type === 'Regeneracao' && s.remainingTicks > 0);
      if (regen) {
        const baseVigor = unit.maxVigor > 15000 ? Math.floor(unit.maxVigor / 3) : unit.maxVigor;
        const heal = Math.max(1, mulPermille(baseVigor, regen.valuePermille || 20));
        const actual = Math.min(heal, unit.maxVigor - unit.currentVigor);
        unit.currentVigor += actual;
        result.regenHeal = actual;
      }
    }

    for (let i = unit.activeStatuses.length - 1; i >= 0; i--) {
      const s = unit.activeStatuses[i];
      s.remainingTicks -= 1;
      if (s.remainingTicks <= 0) {
        if (s.type === 'Atordoado') {
          unit.stunImmuneTicks = 40;
          result.stunExpired = true;
        }
        unit.activeStatuses.splice(i, 1);
      }
    }
    return result;
  }
}
