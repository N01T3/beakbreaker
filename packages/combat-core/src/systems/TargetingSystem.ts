import type { RoosterSpec } from '@beakbreaker/game-data';
import type { CombatUnit } from '../entities/CombatUnit.js';
import { StatusEffectManager } from '../entities/StatusEffectManager.js';
import type { SeededPRNG } from '../math/SeededPRNG.js';

export type TargetScope = RoosterSpec['specialAbility']['targetScope'];

export class TargetingSystem {
  public static getTargetableEnemies(enemies: CombatUnit[]): CombatUnit[] {
    const alive = enemies.filter((u) => u.currentVigor > 0);
    if (alive.length <= 1) return alive;
    const nonStealth = alive.filter((u) => !StatusEffectManager.hasStatus(u, 'Furtivo'));
    return nonStealth.length > 0 ? nonStealth : alive;
  }

  public static selectBasicAttackTarget(
    attacker: CombatUnit,
    enemies: CombatUnit[],
  ): CombatUnit | null {
    const targetable = this.getTargetableEnemies(enemies);
    if (targetable.length === 0) return null;

    if (attacker.roosterClass !== 'Tanque') {
      const tauntStatus = attacker.activeStatuses.find(
        (s) => s.type === 'Provocado' && s.remainingTicks > 0,
      );
      if (tauntStatus) {
        const taunter = targetable.find((e) => e.id === tauntStatus.sourceUnitId);
        if (taunter) return taunter;
      }
    }

    const frontRow = targetable.filter((e) => e.row === 'Frente');
    const rowPool = frontRow.length > 0 ? frontRow : targetable;
    rowPool.sort((a, b) => a.slotIndex - b.slotIndex);
    return rowPool[0] ?? null;
  }

  public static resolveSpecialTargets(
    caster: CombatUnit,
    allies: CombatUnit[],
    enemies: CombatUnit[],
    scope: TargetScope,
    prng: SeededPRNG,
    hitCount = 1,
  ): CombatUnit[] {
    const aliveAllies = allies
      .filter((u) => u.currentVigor > 0)
      .sort((a, b) => a.slotIndex - b.slotIndex);
    const aliveEnemies = enemies
      .filter((u) => u.currentVigor > 0)
      .sort((a, b) => a.slotIndex - b.slotIndex);
    const targetableEnemies = this.getTargetableEnemies(aliveEnemies);

    switch (scope) {
      case 'Self':
        return caster.currentVigor > 0 ? [caster] : [];

      case 'AllAllies':
        return aliveAllies;

      case 'MostWoundedAlly': {
        if (aliveAllies.length === 0) return [];
        const sorted = [...aliveAllies].sort((a, b) => {
          const ratioA = Math.floor((a.currentVigor * 1000) / a.maxVigor);
          const ratioB = Math.floor((b.currentVigor * 1000) / b.maxVigor);
          if (ratioA !== ratioB) return ratioA - ratioB;
          if (a.currentVigor !== b.currentVigor) return a.currentVigor - b.currentVigor;
          return a.slotIndex - b.slotIndex;
        });
        return [sorted[0]];
      }

      case 'Lowest2VigorAllies': {
        const sorted = [...aliveAllies].sort((a, b) => {
          const ratioA = Math.floor((a.currentVigor * 1000) / a.maxVigor);
          const ratioB = Math.floor((b.currentVigor * 1000) / b.maxVigor);
          if (ratioA !== ratioB) return ratioA - ratioB;
          return a.slotIndex - b.slotIndex;
        });
        return sorted.slice(0, 2);
      }

      case 'CurrentTarget': {
        const t = this.selectBasicAttackTarget(caster, aliveEnemies);
        return t ? [t] : [];
      }

      case 'LowestVigorEnemy': {
        if (targetableEnemies.length === 0) return [];
        const sorted = [...targetableEnemies].sort((a, b) => {
          if (a.currentVigor !== b.currentVigor) return a.currentVigor - b.currentVigor;
          return a.slotIndex - b.slotIndex;
        });
        return [sorted[0]];
      }

      case 'HighestForcaEnemy': {
        if (targetableEnemies.length === 0) return [];
        const sorted = [...targetableEnemies].sort((a, b) => {
          if (b.forca !== a.forca) return b.forca - a.forca;
          return a.slotIndex - b.slotIndex;
        });
        return [sorted[0]];
      }

      case 'LowestDefBackEnemy': {
        if (targetableEnemies.length === 0) return [];
        const back = targetableEnemies.filter((e) => e.row === 'Tras');
        const pool = back.length > 0 ? back : targetableEnemies;
        const sorted = [...pool].sort((a, b) => {
          if (a.defesa !== b.defesa) return a.defesa - b.defesa;
          return a.slotIndex - b.slotIndex;
        });
        return [sorted[0]];
      }

      case 'EnemyFrontRow': {
        if (aliveEnemies.length === 0) return [];
        const front = aliveEnemies.filter((e) => e.row === 'Frente');
        return front.length > 0 ? front : aliveEnemies;
      }

      case 'EnemyBackRow': {
        if (aliveEnemies.length === 0) return [];
        const back = aliveEnemies.filter((e) => e.row === 'Tras');
        return back.length > 0 ? back : aliveEnemies;
      }

      case 'AllEnemies':
        return aliveEnemies;

      case 'Top2CantoEnemies': {
        const sorted = [...targetableEnemies].sort((a, b) => {
          if (b.canto !== a.canto) return b.canto - a.canto;
          return a.slotIndex - b.slotIndex;
        });
        return sorted.slice(0, 2);
      }

      case 'Top2ForcaEnemies': {
        const sorted = [...targetableEnemies].sort((a, b) => {
          if (b.forca !== a.forca) return b.forca - a.forca;
          return a.slotIndex - b.slotIndex;
        });
        return sorted.slice(0, 2);
      }

      case 'RandomEnemies': {
        if (targetableEnemies.length === 0) return [];
        const picks: CombatUnit[] = [];
        const count = Math.max(1, hitCount);
        for (let i = 0; i < count; i++) {
          const idx = prng.pickIndex(targetableEnemies.length);
          picks.push(targetableEnemies[idx]);
        }
        return picks;
      }
    }
  }
}
