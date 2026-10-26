import type { CombatUnit } from '../entities/CombatUnit.js';
import { StatusEffectManager } from '../entities/StatusEffectManager.js';
import { clamp, floorDiv } from '../math/FixedMath.js';

export const MAX_CANTO = 1000;

export class CantoSystem {
  public static computeAttackIntervalTicks(velocidade: number): number {
    const v = Math.max(0, Math.floor(velocidade));
    return Math.max(10, 40 - floorDiv(v, 12));
  }

  public static computeUnitAttackIntervalTicks(unit: CombatUnit): number {
    const effectiveVel = StatusEffectManager.getEffectiveVelocidade(unit);
    return this.computeAttackIntervalTicks(effectiveVel);
  }

  public static computeCantoPerHit(garra: number, velocidade: number): number {
    const g = Math.max(0, Math.floor(garra));
    const v = Math.max(0, Math.floor(velocidade));
    const excessVelBonus = floorDiv(Math.max(0, v - 360), 4);
    return 120 + g + excessVelBonus;
  }

  public static computeUnitCantoPerHit(unit: CombatUnit, doubleCantoModifier = false): number {
    const effectiveVel = StatusEffectManager.getEffectiveVelocidade(unit);
    const baseGain = this.computeCantoPerHit(unit.garra, effectiveVel);
    return doubleCantoModifier ? baseGain * 2 : baseGain;
  }

  public static addCanto(unit: CombatUnit, amount: number): number {
    if (unit.currentVigor <= 0) return unit.canto;
    unit.canto = clamp(unit.canto + Math.floor(amount), 0, MAX_CANTO);
    return unit.canto;
  }

  public static canStartSpecialWindup(unit: CombatUnit): boolean {
    if (unit.currentVigor <= 0) return false;
    if (unit.castWindupRemainingTicks > 0) return false;
    if (unit.canto < MAX_CANTO) return false;
    if (StatusEffectManager.hasStatus(unit, 'Atordoado')) return false;
    if (StatusEffectManager.hasStatus(unit, 'Silenciado')) return false;
    return true;
  }
}
