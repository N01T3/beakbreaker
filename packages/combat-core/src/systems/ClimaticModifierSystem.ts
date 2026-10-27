import type { TowerModifierId as GameDataTowerModifierId } from '@beakbreaker/game-data';
import type { CombatUnit } from '../entities/CombatUnit.js';
import { StatusEffectManager } from '../entities/StatusEffectManager.js';
import { mulPermille } from '../math/FixedMath.js';
import { CantoSystem } from './CantoSystem.js';

export type TowerModifierAlias =
  | 'Sol a Pino'
  | 'Neblina da Serra'
  | 'Assombração'
  | 'Fúria do Coronel'
  | 'Fé na Sanfona'
  | 'Festa no Arraial';

export type TowerModifierId = GameDataTowerModifierId | TowerModifierAlias;

export const ALL_TOWER_MODIFIERS: readonly GameDataTowerModifierId[] = [
  'Seca', 'Chuva', 'Noite', 'Ventania', 'SolAPino', 'NeblinaDaSerra',
  'Muralha', 'Assombracao', 'FuriaDoCoronel', 'FeNaSanfona', 'Espinheiro', 'FestaNoArraial',
];

const MODIFIER_ALIAS_MAP: Record<string, GameDataTowerModifierId> = {
  'Sol a Pino': 'SolAPino',
  'Neblina da Serra': 'NeblinaDaSerra',
  'Assombração': 'Assombracao',
  'Fúria do Coronel': 'FuriaDoCoronel',
  'Fé na Sanfona': 'FeNaSanfona',
  'Festa no Arraial': 'FestaNoArraial',
};

export function normalizeModifier(
  modifier?: TowerModifierId | string,
): GameDataTowerModifierId | undefined {
  if (!modifier) return undefined;
  return MODIFIER_ALIAS_MAP[modifier] ?? (modifier as GameDataTowerModifierId);
}

export class ClimaticModifierSystem {
  public static applyInitialBuffs(units: CombatUnit[], modifier?: TowerModifierId): void {
    const mod = normalizeModifier(modifier);
    if (!mod) return;
    for (const unit of units) {
      if (mod === 'Noite') {
        const hasLua = unit.primaryElement === 'Lua' || unit.secondaryElement === 'Lua' || unit.equippedSet === 'LuarDoSertao';
        if (hasLua) CantoSystem.addCanto(unit, 150);
      } else if (mod === 'NeblinaDaSerra') {
        StatusEffectManager.applyStatus(unit, 'Furtivo', 30);
      } else if (mod === 'Muralha') {
        if (unit.row === 'Frente') unit.defesa = Math.max(1, mulPermille(unit.defesa, 1250));
      } else if (mod === 'Espinheiro') {
        StatusEffectManager.applyStatus(unit, 'Espinhos', 9999, undefined, 150);
      }
    }
  }

  public static adjustDamage(
    attacker: CombatUnit,
    _defender: CombatUnit,
    rawDamage: number,
    modifier?: TowerModifierId,
  ): number {
    const mod = normalizeModifier(modifier);
    let dmg = rawDamage;
    if (mod === 'Chuva') {
      const isWater = attacker.primaryElement === 'Correnteza' || attacker.secondaryElement === 'Correnteza';
      if (isWater) dmg = mulPermille(dmg, 1250);
    } else if (mod === 'Assombracao' && attacker.roosterClass === 'Assassino') {
      dmg = mulPermille(dmg, 1200);
    } else if (mod === 'FuriaDoCoronel' && attacker.team === 'B') {
      dmg = mulPermille(dmg, 1300);
    }
    return dmg;
  }

  public static adjustHealing(healAmount: number, modifier?: TowerModifierId): number {
    return normalizeModifier(modifier) === 'Seca' ? mulPermille(healAmount, 800) : healAmount;
  }

  public static getMaxTorcidaAllowed(modifier?: TowerModifierId): number {
    return normalizeModifier(modifier) === 'FestaNoArraial' ? 2 : 1;
  }

  public static getShooterAccuracyPenalty(unit: CombatUnit, modifier?: TowerModifierId): number {
    return normalizeModifier(modifier) === 'Ventania' && unit.roosterClass === 'Atirador' ? 150 : 0;
  }

  public static adjustAccuracy(unit: CombatUnit, baseAccuracyPermille: number, modifier?: TowerModifierId): number {
    return Math.max(0, baseAccuracyPermille - this.getShooterAccuracyPenalty(unit, modifier));
  }

  public static adjustBurnDamage(burnDamage: number, modifier?: TowerModifierId): number {
    return normalizeModifier(modifier) === 'SolAPino' ? mulPermille(burnDamage, 2000) : burnDamage;
  }

  public static adjustCantoGain(cantoGain: number, modifier?: TowerModifierId): number {
    return normalizeModifier(modifier) === 'FeNaSanfona' ? mulPermille(cantoGain, 1050) : cantoGain;
  }

  public static getThornsReflectPermille(modifier?: TowerModifierId): number {
    return normalizeModifier(modifier) === 'Espinheiro' ? 150 : 0;
  }

  public static computeThornsDamage(rawDamage: number, modifier?: TowerModifierId): number {
    const permille = this.getThornsReflectPermille(modifier);
    return permille > 0 ? Math.max(1, mulPermille(rawDamage, permille)) : 0;
  }
}
