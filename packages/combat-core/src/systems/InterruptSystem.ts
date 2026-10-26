import type { CombatUnit } from '../entities/CombatUnit.js';
import { StatusEffectManager } from '../entities/StatusEffectManager.js';
import { clamp } from '../math/FixedMath.js';
import { CantoSystem } from './CantoSystem.js';

export const CAST_WINDUP_TICKS = 6;
export const CORTA_CANTO_PENALTY = 500;

export type WindupTickStatus =
  | 'NONE'
  | 'INTERRUPTED'
  | 'WINDING_UP'
  | 'READY_TO_FIRE';

export class InterruptSystem {
  public static startSpecialWindup(unit: CombatUnit): boolean {
    if (!CantoSystem.canStartSpecialWindup(unit)) {
      return false;
    }
    unit.castWindupRemainingTicks = CAST_WINDUP_TICKS;
    return true;
  }

  public static triggerCortaCanto(unit: CombatUnit): boolean {
    if (unit.castWindupRemainingTicks <= 0) {
      return false;
    }
    unit.castWindupRemainingTicks = 0;
    unit.canto = clamp(unit.canto - CORTA_CANTO_PENALTY, 0, 1000);
    return true;
  }

  public static advanceWindupTick(unit: CombatUnit): WindupTickStatus {
    if (unit.castWindupRemainingTicks <= 0) {
      return 'NONE';
    }
    if (unit.currentVigor <= 0) {
      unit.castWindupRemainingTicks = 0;
      return 'NONE';
    }
    if (StatusEffectManager.hasStatus(unit, 'Atordoado')) {
      this.triggerCortaCanto(unit);
      return 'INTERRUPTED';
    }
    unit.castWindupRemainingTicks -= 1;
    if (unit.castWindupRemainingTicks <= 0) {
      unit.castWindupRemainingTicks = 0;
      return 'READY_TO_FIRE';
    }
    return 'WINDING_UP';
  }
}
