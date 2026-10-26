import { getElementalMultiplierPermille } from '@beakbreaker/game-data';
import type { CombatUnit } from '../entities/CombatUnit.js';
import { StatusEffectManager } from '../entities/StatusEffectManager.js';
import { addPermille, clamp, mulPermille } from '../math/FixedMath.js';
import type { SeededPRNG } from '../math/SeededPRNG.js';

export interface DamageCalculationInput {
  attacker: CombatUnit;
  defender: CombatUnit;
  mHabPermille: number;
  isSpecial: boolean;
  ignoreDefensePermille?: number;
  forceCrit?: boolean;
}

export interface DamageCalculationResult {
  rawDamage: number;
  finalDamage: number;
  shieldAbsorbed: number;
  vigorDamage: number;
  isCrit: boolean;
  isDodged: boolean;
  isBlindMiss: boolean;
  elemMultiplierPermille: 800 | 1000 | 1250;
  thornsReflected: number;
  lifestealHealed: number;
  killedTarget: boolean;
  triggeredFenixRevive: boolean;
}

export class DamageCalculator {
  public static computeEffectiveForca(unit: CombatUnit): number {
    let forca = unit.forca;
    if (unit.roosterClass === 'Bruiser' && unit.maxVigor > 0) {
      const lostVigor = Math.max(0, unit.maxVigor - unit.currentVigor);
      const stepsOf10Pct = clamp(Math.floor((lostVigor * 10) / unit.maxVigor), 0, 8);
      if (stepsOf10Pct > 0) forca = addPermille(forca, stepsOf10Pct * 10);
    }
    if (unit.torcidaTicksRemaining > 0) forca = addPermille(forca, 150);
    if (unit.colossoFuriaStacks > 0) forca = addPermille(forca, unit.colossoFuriaStacks * 50);
    return Math.max(1, forca);
  }

  public static computeEffectiveDefesa(
    attacker: CombatUnit,
    defender: CombatUnit,
    isSpecial: boolean,
    extraIgnorePermille = 0,
  ): number {
    let ignorePermille = extraIgnorePermille;
    if (!isSpecial && attacker.roosterClass === 'Atirador') ignorePermille += 150;
    if (attacker.equippedSet === 'CangacoDeAco') ignorePermille += 200;
    ignorePermille = clamp(ignorePermille, 0, 1000);
    return Math.max(0, mulPermille(defender.defesa, 1000 - ignorePermille));
  }

  public static computeFormulaDamage(
    forca: number,
    mHabPermille: number,
    effectiveDef: number,
    mElemPermille: number,
    mCritPermille: number,
  ): number {
    const num =
      BigInt(Math.max(1, Math.floor(forca))) *
      BigInt(Math.max(0, Math.floor(mHabPermille))) *
      1000n *
      BigInt(Math.max(0, Math.floor(mElemPermille))) *
      BigInt(Math.max(0, Math.floor(mCritPermille)));
    const den = 1000n * BigInt(1000 + 3 * Math.max(0, Math.floor(effectiveDef))) * 1000n * 1000n;
    return Math.max(1, Number(num / den));
  }

  public static calculateHealOrShieldAmount(caster: CombatUnit, baseAmount: number): number {
    let bonusPermille = caster.roosterClass === 'Suporte' ? 150 : 0;
    if (caster.equippedSet === 'AguasDoVelhoChico') bonusPermille += 200;
    return Math.max(1, addPermille(baseAmount, bonusPermille));
  }

  public static resolveHit(
    input: DamageCalculationInput,
    prng: SeededPRNG,
    ignoreShield = false,
  ): DamageCalculationResult {
    const { attacker, defender, mHabPermille, isSpecial } = input;
    const elemMultiplierPermille = getElementalMultiplierPermille(
      attacker.primaryElement,
      defender.primaryElement,
    );
    const emptyRes = (isBlindMiss: boolean, isDodged: boolean): DamageCalculationResult => ({
      rawDamage: 0, finalDamage: 0, shieldAbsorbed: 0, vigorDamage: 0,
      isCrit: false, isDodged, isBlindMiss, elemMultiplierPermille,
      thornsReflected: 0, lifestealHealed: 0, killedTarget: false, triggeredFenixRevive: false,
    });

    if (StatusEffectManager.rollBlindMiss(attacker, prng)) {
      attacker.firstHitDone = true;
      return emptyRes(true, false);
    }
    if (defender.esquiva > 0 && prng.chancePercent(clamp(defender.esquiva, 0, 60))) {
      attacker.firstHitDone = true;
      return emptyRes(false, true);
    }

    const guaranteedBote = attacker.roosterClass === 'Assassino' && !attacker.firstHitDone;
    attacker.firstHitDone = true;
    const isCrit =
      Boolean(input.forceCrit) ||
      guaranteedBote ||
      prng.chancePercent(clamp(attacker.tecnica, 0, 100));
    const mCritPermille = isCrit ? (attacker.equippedSet === 'BrasaViva' ? 1950 : 1500) : 1000;

    const effForca = this.computeEffectiveForca(attacker);
    const effDef = this.computeEffectiveDefesa(
      attacker, defender, isSpecial, input.ignoreDefensePermille ?? 0,
    );
    const rawDamage = this.computeFormulaDamage(
      effForca, mHabPermille, effDef, elemMultiplierPermille, mCritPermille,
    );

    let dmg = rawDamage;
    if (isSpecial && defender.roosterClass === 'Tanque') dmg = Math.max(1, mulPermille(dmg, 900));
    if (isCrit && defender.equippedSet === 'CouroDeGibao') dmg = Math.max(1, mulPermille(dmg, 850));
    if (
      attacker.synergyDamageVsControlledPermille > 0 &&
      (StatusEffectManager.hasStatus(defender, 'Atordoado') ||
        StatusEffectManager.hasStatus(defender, 'Cego'))
    ) {
      dmg = Math.max(1, addPermille(dmg, attacker.synergyDamageVsControlledPermille));
    }
    if (attacker.perkGem === 'Ceifador' && defender.currentVigor * 1000 < defender.maxVigor * 200) {
      dmg = Math.max(1, mulPermille(dmg, 1250));
    }

    const remAfterShield = ignoreShield
      ? dmg
      : StatusEffectManager.absorbDamageWithShield(defender, dmg);
    const shieldAbsorbed = dmg - remAfterShield;
    const vigorDamage = Math.min(defender.currentVigor, remAfterShield);
    defender.currentVigor = Math.max(0, defender.currentVigor - vigorDamage);

    let thornsReflected = 0;
    if (!isSpecial && dmg > 0) {
      const thornSt = defender.activeStatuses.find((s) => s.type === 'Espinhos' && s.remainingTicks > 0);
      const thornPerm = (thornSt?.valuePermille ?? 0) + (defender.equippedSet === 'Mandacaru' ? 120 : 0);
      if (thornPerm > 0) {
        thornsReflected = Math.max(1, mulPermille(dmg, thornPerm));
        attacker.currentVigor = Math.max(0, attacker.currentVigor - thornsReflected);
      }
    }

    let lifestealHealed = 0;
    const lsSt = attacker.activeStatuses.find((s) => s.type === 'RouboDeVida' && s.remainingTicks > 0);
    if (lsSt && vigorDamage > 0 && attacker.currentVigor > 0) {
      const heal = Math.max(1, mulPermille(vigorDamage, clamp(lsSt.valuePermille, 0, 300)));
      lifestealHealed = Math.min(heal, attacker.maxVigor - attacker.currentVigor);
      attacker.currentVigor += lifestealHealed;
    }

    let killedTarget = defender.currentVigor <= 0;
    let triggeredFenixRevive = false;
    if (killedTarget) {
      if (attacker.perkGem === 'Ceifador') defender.reaperBlockedRevive = true;
      if (defender.perkGem === 'FenixSertaneja' && !defender.fenixUsed && !defender.reaperBlockedRevive) {
        defender.fenixUsed = true;
        defender.currentVigor = Math.max(1, mulPermille(defender.maxVigor, 300));
        defender.canto = clamp(defender.canto + 500, 0, 1000);
        defender.activeStatuses = [];
        killedTarget = false;
        triggeredFenixRevive = true;
      }
    }

    return {
      rawDamage, finalDamage: dmg, shieldAbsorbed, vigorDamage, isCrit,
      isDodged: false, isBlindMiss: false, elemMultiplierPermille,
      thornsReflected, lifestealHealed, killedTarget, triggeredFenixRevive,
    };
  }
}
