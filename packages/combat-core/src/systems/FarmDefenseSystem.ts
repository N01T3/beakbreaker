import type { ElementType, RoosterClass, RowPosition } from '@beakbreaker/game-data';
import { type CombatUnit, type SlotIndex, type TeamSide, isUnitAlive } from '../entities/CombatUnit.js';
import { StatusEffectManager } from '../entities/StatusEffectManager.js';
import { addPermille } from '../math/FixedMath.js';
import type { SeededPRNG } from '../math/SeededPRNG.js';

export type RuralDefenseType =
  | 'cerca_mandacaru'
  | 'estilingue_sabugo'
  | 'espantalho_assombrado'
  | 'cata_vento_alerta';

export interface RuralDefenseOptions {
  slotIndex?: SlotIndex;
  team?: TeamSide;
  row?: RowPosition;
}

interface DefCfg {
  name: string; roosterClass: RoosterClass; elem: ElementType; row: RowPosition;
  vBase: number; vPerLvl: number; dBase: number; dPerLvl: number; fBase: number; fPerLvl: number; vel: number;
}

const CFGS: Record<RuralDefenseType, DefCfg> = {
  cerca_mandacaru: { name: 'Cerca de Mandacaru', roosterClass: 'Tanque', elem: 'Mata', row: 'Frente', vBase: 4000, vPerLvl: 600, dBase: 300, dPerLvl: 40, fBase: 50, fPerLvl: 10, vel: 70 },
  estilingue_sabugo: { name: 'Estilingue de Sabugo', roosterClass: 'Atirador', elem: 'Mata', row: 'Tras', vBase: 2000, vPerLvl: 300, dBase: 150, dPerLvl: 20, fBase: 250, fPerLvl: 50, vel: 120 },
  espantalho_assombrado: { name: 'Espantalho Assombrado', roosterClass: 'Controle', elem: 'Assombracao', row: 'Frente', vBase: 2500, vPerLvl: 400, dBase: 200, dPerLvl: 25, fBase: 100, fPerLvl: 20, vel: 90 },
  cata_vento_alerta: { name: 'Cata-Vento de Alerta', roosterClass: 'Suporte', elem: 'Sol', row: 'Tras', vBase: 2200, vPerLvl: 350, dBase: 180, dPerLvl: 25, fBase: 80, fPerLvl: 15, vel: 110 },
};

export function createRuralDefenseUnit(
  id: string, defenseType: RuralDefenseType, level: number, options?: RuralDefenseOptions,
): CombatUnit {
  const lvl = Math.max(1, level);
  const c = CFGS[defenseType];
  const maxVigor = c.vBase + lvl * c.vPerLvl;
  const unit: CombatUnit = {
    id, specId: defenseType, name: c.name, team: options?.team ?? 'B',
    slotIndex: options?.slotIndex ?? 0, row: options?.row ?? c.row, roosterClass: c.roosterClass,
    primaryElement: c.elem, maxVigor, currentVigor: maxVigor, forca: c.fBase + lvl * c.fPerLvl,
    defesa: c.dBase + lvl * c.dPerLvl, velocidade: c.vel, tecnica: 15, garra: 50, esquiva: 0, canto: 0,
    nextAttackTick: 1, castWindupRemainingTicks: 0, fenixUsed: false, reaperBlockedRevive: false,
    firstHitDone: false, stunImmuneTicks: 0, torcidaTicksRemaining: 0, synergyDamageVsControlledPermille: 0,
    isRaidBoss: false, raidDifficulty: 1, colossoFuriaStacks: 0, activeStatuses: [],
    specialAbility: {
      name: c.name, multiplierPermille: 1000, targetScope: 'CurrentTarget', hitCount: 1,
      effectDurationTicks: 0, shieldPermille: 0, healPermille: 0, cantoBonus: 0,
      cleanseDebuffs: false, ignoreDefensePermille: 0, ignoreShield: false, description: c.name,
    },
  };
  if (defenseType === 'cerca_mandacaru') {
    unit.activeStatuses.push({
      type: 'Espinhos', remainingTicks: 999999, valuePermille: 250, shieldValue: 0, sourceUnitId: id,
    });
  }
  return unit;
}

export interface DefenseWaveLevels {
  cercaMandacaruLevel?: number;
  estilingueSabugoLevel?: number;
  espantalhoAssombradoLevel?: number;
  cataVentoAlertaLevel?: number;
}

export function createRuralDefenseWave(levels?: DefenseWaveLevels): CombatUnit[] {
  return [
    createRuralDefenseUnit('cerca', 'cerca_mandacaru', levels?.cercaMandacaruLevel ?? 1, { slotIndex: 0, row: 'Frente' }),
    createRuralDefenseUnit('espantalho', 'espantalho_assombrado', levels?.espantalhoAssombradoLevel ?? 1, { slotIndex: 1, row: 'Frente' }),
    createRuralDefenseUnit('estilingue', 'estilingue_sabugo', levels?.estilingueSabugoLevel ?? 1, { slotIndex: 0, row: 'Tras' }),
    createRuralDefenseUnit('catavento', 'cata_vento_alerta', levels?.cataVentoAlertaLevel ?? 1, { slotIndex: 1, row: 'Tras' }),
  ];
}

export class FarmDefenseSystem {
  public static readonly THORNS_PERMILLE = 250;
  public static readonly CATA_VENTO_DEFENSE_BUFF_PERMILLE = 150;
  public static readonly ESPANTALHO_STUN_TICKS = 20;
  public static readonly ESTILINGUE_INTERVAL_TICKS = 30;

  public static createRuralDefenseUnit = createRuralDefenseUnit;
  public static createRuralDefenseWave = createRuralDefenseWave;

  public static applyCataVentoAura(defenses: CombatUnit[]): void {
    const active = defenses.some((d) => d.specId === 'cata_vento_alerta' && isUnitAlive(d));
    if (!active) return;
    for (const d of defenses) d.defesa = addPermille(d.defesa, this.CATA_VENTO_DEFENSE_BUFF_PERMILLE);
  }

  public static enforceAntiStealth(defenses: CombatUnit[], attackers: CombatUnit[]): void {
    const active = defenses.some((d) => d.specId === 'cata_vento_alerta' && isUnitAlive(d));
    if (!active) return;
    for (const a of attackers) {
      if (a.activeStatuses.length > 0) {
        a.activeStatuses = a.activeStatuses.filter((s) => s.type !== 'Furtivo');
      }
    }
  }

  public static checkEspantalhoTrigger(espantalho: CombatUnit, prevVigor: number, attacker: CombatUnit): boolean {
    if (espantalho.specId !== 'espantalho_assombrado') return false;
    const threshold = Math.floor((espantalho.maxVigor * 2) / 3);
    if (prevVigor >= threshold && espantalho.currentVigor < threshold) {
      return StatusEffectManager.applyStatus(attacker, 'Atordoado', this.ESPANTALHO_STUN_TICKS, espantalho);
    }
    return false;
  }

  public static executeEstilingueArtillery(
    estilingue: CombatUnit, attackers: CombatUnit[], prng: SeededPRNG,
  ): { target: CombatUnit; damage: number } | null {
    if (estilingue.specId !== 'estilingue_sabugo' || !isUnitAlive(estilingue)) return null;
    const targets = attackers.filter(isUnitAlive);
    if (targets.length === 0) return null;
    const idx = prng.pickIndex(targets.length);
    const target = targets[idx]!;
    const damage = Math.max(1, estilingue.forca);
    target.currentVigor = Math.max(0, target.currentVigor - damage);
    return { target, damage };
  }
}
