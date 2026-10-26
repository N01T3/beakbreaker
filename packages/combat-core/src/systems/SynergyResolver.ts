import type { RoosterClass } from '@beakbreaker/game-data';
import { TRIO_SYNERGIES, type TrioSynergySpec } from '@beakbreaker/game-data';
import type { CombatUnit } from '../entities/CombatUnit.js';
import { addPermille, clamp } from '../math/FixedMath.js';

export interface ResolvedTeamSynergies {
  activeSynergyIds: string[];
  activeSynergies: TrioSynergySpec[];
  isMonoclassBlocked: boolean;
  maxVigorBonusPermille: number;
  frontRowDefesaBonusPermille: number;
  damageVsControlledBonusPermille: number;
  velocidadeBonusPermille: number;
  tecnicaFlatBonus: number;
  startingCantoBonus: number;
  allStatsBonusPermille: number;
}

export class SynergyResolver {
  public static evaluateClasses(classes: readonly RoosterClass[]): ResolvedTeamSynergies {
    const empty: ResolvedTeamSynergies = {
      activeSynergyIds: [],
      activeSynergies: [],
      isMonoclassBlocked: false,
      maxVigorBonusPermille: 0,
      frontRowDefesaBonusPermille: 0,
      damageVsControlledBonusPermille: 0,
      velocidadeBonusPermille: 0,
      tecnicaFlatBonus: 0,
      startingCantoBonus: 0,
      allStatsBonusPermille: 0,
    };

    if (classes.length === 0) return empty;

    const uniqueClasses = new Set<RoosterClass>(classes);
    if (classes.length >= 3 && uniqueClasses.size === 1) {
      return { ...empty, isMonoclassBlocked: true };
    }

    const activeSynergies: TrioSynergySpec[] = [];
    for (const syn of TRIO_SYNERGIES) {
      if (syn.requiresThreeDistinctClasses) {
        if (uniqueClasses.size >= 3) {
          activeSynergies.push(syn);
        }
      } else if (
        syn.requiredClasses.length > 0 &&
        syn.requiredClasses.every((req) => uniqueClasses.has(req))
      ) {
        activeSynergies.push(syn);
      }
    }

    const result: ResolvedTeamSynergies = {
      ...empty,
      activeSynergies,
      activeSynergyIds: activeSynergies.map((s) => s.id),
    };

    for (const syn of activeSynergies) {
      result.maxVigorBonusPermille += syn.bonuses.maxVigorPermille ?? 0;
      result.frontRowDefesaBonusPermille += syn.bonuses.frontRowDefesaPermille ?? 0;
      result.damageVsControlledBonusPermille += syn.bonuses.damageVsControlledPermille ?? 0;
      result.velocidadeBonusPermille += syn.bonuses.velocidadePermille ?? 0;
      result.tecnicaFlatBonus += syn.bonuses.tecnicaFlatBonus ?? 0;
      result.startingCantoBonus += syn.bonuses.startingCantoBonus ?? 0;
      result.allStatsBonusPermille += syn.bonuses.allStatsPermille ?? 0;
    }

    return result;
  }

  public static applyTeamSynergiesAndSets(units: CombatUnit[]): ResolvedTeamSynergies {
    const classes = units.map((u) => u.roosterClass);
    const resolved = this.evaluateClasses(classes);

    for (const unit of units) {
      const setVigorDefBonus = unit.equippedSet === 'ArmorialReal' ? 120 : 0;
      const setVelBonus = unit.equippedSet === 'VentoDoArraial' ? 150 : 0;
      const setCantoBonus = unit.equippedSet === 'LuarDoSertao' ? 150 : 0;

      const totalVigorPermille =
        resolved.maxVigorBonusPermille + resolved.allStatsBonusPermille + setVigorDefBonus;
      const totalForcaPermille = resolved.allStatsBonusPermille;
      const frontBonus = unit.row === 'Frente' ? resolved.frontRowDefesaBonusPermille : 0;
      const totalDefesaPermille =
        resolved.allStatsBonusPermille + frontBonus + setVigorDefBonus;
      const totalVelPermille = resolved.velocidadeBonusPermille + setVelBonus;

      if (totalVigorPermille > 0) {
        unit.maxVigor = Math.max(1, addPermille(unit.maxVigor, totalVigorPermille));
        unit.currentVigor = unit.maxVigor;
      }
      if (totalForcaPermille > 0) {
        unit.forca = Math.max(1, addPermille(unit.forca, totalForcaPermille));
      }
      if (totalDefesaPermille > 0) {
        unit.defesa = Math.max(1, addPermille(unit.defesa, totalDefesaPermille));
      }
      if (totalVelPermille > 0) {
        unit.velocidade = Math.max(1, addPermille(unit.velocidade, totalVelPermille));
      }
      if (resolved.tecnicaFlatBonus > 0) {
        unit.tecnica = clamp(unit.tecnica + resolved.tecnicaFlatBonus, 0, 100);
      }

      const cantoAdd = resolved.startingCantoBonus + setCantoBonus;
      if (cantoAdd > 0) {
        unit.canto = clamp(unit.canto + cantoAdd, 0, 1000);
      }

      unit.synergyDamageVsControlledPermille = resolved.damageVsControlledBonusPermille;
    }

    return resolved;
  }
}
