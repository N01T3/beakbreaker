import type { CombatUnit } from '../entities/CombatUnit.js';
import { StatusEffectManager } from '../entities/StatusEffectManager.js';
import { clamp, mulPermille } from '../math/FixedMath.js';

export const COLOSSO_DIFFICULTY_VIGOR: readonly number[] = [
  20_000_000,
  32_000_000,
  51_200_000,
  81_920_000,
  131_072_000,
  209_715_200,
  335_544_320,
  536_870_912,
  858_993_459,
  1_370_000_000,
] as const;

export type ColossoPhase = 1 | 2 | 3;

export interface ColossoTickOutcome {
  phase: ColossoPhase;
  appliedMassBurn: boolean;
  furiaStackAdded: boolean;
  totalFuriaStacks: number;
}

export class RaidBossSystem {
  public static getDifficultyMaxVigor(difficulty: number): number {
    const idx = clamp(difficulty, 1, 10) - 1;
    return COLOSSO_DIFFICULTY_VIGOR[idx];
  }

  public static createColossoBossUnit(
    difficulty: number,
    initialVigor?: number,
  ): CombatUnit {
    const d = clamp(difficulty, 1, 10);
    const maxVigor = this.getDifficultyMaxVigor(d);
    const curVigor = initialVigor !== undefined ? clamp(initialVigor, 1, maxVigor) : maxVigor;
    return {
      id: `raid_colosso_d${d}`,
      specId: 'galo_colosso',
      name: `Galo Colosso (Dif. ${d})`,
      team: 'B',
      slotIndex: 0,
      row: 'Frente',
      roosterClass: 'Tanque',
      primaryElement: 'Brasa',
      maxVigor,
      currentVigor: curVigor,
      forca: 1200 + d * 250,
      defesa: 450 + d * 80,
      velocidade: 180 + d * 10,
      tecnica: 20,
      garra: 120,
      esquiva: 0,
      canto: 0,
      nextAttackTick: 1,
      castWindupRemainingTicks: 0,
      fenixUsed: false,
      reaperBlockedRevive: false,
      firstHitDone: false,
      stunImmuneTicks: 0,
      torcidaTicksRemaining: 0,
      synergyDamageVsControlledPermille: 0,
      isRaidBoss: true,
      raidDifficulty: d,
      colossoFuriaStacks: 0,
      specialAbility: {
        name: 'Rugido do Colosso',
        multiplierPermille: 1600,
        targetScope: 'AllEnemies',
        hitCount: 1,
        effectDurationTicks: 0,
        shieldPermille: 0,
        healPermille: 0,
        cantoBonus: 0,
        cleanseDebuffs: false,
        ignoreDefensePermille: 0,
        ignoreShield: false,
        description: 'Golpe sísmico em todo o trio adversário.',
      },
      activeStatuses: [],
    };
  }

  public static getPhase(boss: CombatUnit): ColossoPhase {
    if (boss.maxVigor <= 0) return 1;
    const ratioPermille = Math.floor((boss.currentVigor * 1000) / boss.maxVigor);
    if (ratioPermille > 670) return 1;
    if (ratioPermille > 330) return 2;
    return 3;
  }

  public static processBossTick(
    boss: CombatUnit,
    enemies: CombatUnit[],
    currentTick: number,
  ): ColossoTickOutcome {
    const phase = this.getPhase(boss);
    if (phase === 1) boss.primaryElement = 'Brasa';
    else if (phase === 2) boss.primaryElement = 'Lua';
    else {
      boss.primaryElement = 'Armorial';
      boss.activeStatuses = boss.activeStatuses.filter(
        (s) => s.type !== 'Atordoado' && s.type !== 'Provocado',
      );
    }

    let appliedMassBurn = false;
    let furiaStackAdded = false;

    if (currentTick > 0 && currentTick % 200 === 0 && boss.currentVigor > 0) {
      if (phase === 1) {
        for (const enemy of enemies) {
          if (enemy.currentVigor > 0) {
            StatusEffectManager.applyStatus(enemy, 'Queimadura', 60, boss);
          }
        }
        appliedMassBurn = true;
      } else if (phase === 3) {
        boss.colossoFuriaStacks += 1;
        furiaStackAdded = true;
      }
    }

    return {
      phase,
      appliedMassBurn,
      furiaStackAdded,
      totalFuriaStacks: boss.colossoFuriaStacks,
    };
  }

  public static reflectCritInPhase2(
    boss: CombatUnit,
    attacker: CombatUnit,
    critDamageDealt: number,
    isCrit: boolean,
  ): number {
    if (!boss.isRaidBoss || !isCrit || critDamageDealt <= 0) return 0;
    if (this.getPhase(boss) !== 2) return 0;
    const reflected = Math.max(1, mulPermille(critDamageDealt, 500));
    attacker.currentVigor = Math.max(0, attacker.currentVigor - reflected);
    return reflected;
  }
}
