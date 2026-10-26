import type {
  ElementType,
  EquipmentSetId,
  PerkGemId,
  RoosterClass,
  RoosterSpec,
  RowPosition,
  StatusEffectType,
} from '@beakbreaker/game-data';
import { clamp, mulPermille } from '../math/FixedMath.js';

export type TeamSide = 'A' | 'B';
export type SlotIndex = 0 | 1 | 2;

export interface ActiveStatusEffect {
  type: StatusEffectType;
  remainingTicks: number;
  valuePermille: number;
  shieldValue: number;
  sourceUnitId: string;
}

export interface CombatUnit {
  id: string;
  specId: string;
  name: string;
  team: TeamSide;
  slotIndex: SlotIndex;
  row: RowPosition;
  roosterClass: RoosterClass;
  primaryElement: ElementType;
  secondaryElement?: ElementType;
  maxVigor: number;
  currentVigor: number;
  forca: number;
  defesa: number;
  velocidade: number;
  tecnica: number;
  garra: number;
  esquiva: number;
  canto: number;
  nextAttackTick: number;
  castWindupRemainingTicks: number;
  equippedSet?: EquipmentSetId;
  perkGem?: PerkGemId;
  fenixUsed: boolean;
  reaperBlockedRevive: boolean;
  firstHitDone: boolean;
  stunImmuneTicks: number;
  torcidaTicksRemaining: number;
  synergyDamageVsControlledPermille: number;
  isRaidBoss: boolean;
  raidDifficulty: number;
  colossoFuriaStacks: number;
  specialAbility: RoosterSpec['specialAbility'];
  activeStatuses: ActiveStatusEffect[];
}

export interface CreateCombatUnitOptions {
  id: string;
  team: TeamSide;
  slotIndex: SlotIndex;
  row?: RowPosition;
  equippedSet?: EquipmentSetId;
  perkGem?: PerkGemId;
  vigorMultiplierPermille?: number;
  isRaidBoss?: boolean;
  raidDifficulty?: number;
}

export function createCombatUnitFromSpec(
  spec: RoosterSpec,
  options: CreateCombatUnitOptions,
): CombatUnit {
  const vigorMult = options.vigorMultiplierPermille ?? 1000;
  const scaledVigor = Math.max(1, mulPermille(spec.baseStats.vigor, vigorMult));
  return {
    id: options.id,
    specId: spec.id,
    name: spec.name,
    team: options.team,
    slotIndex: options.slotIndex,
    row: options.row ?? spec.preferredRow,
    roosterClass: spec.roosterClass,
    primaryElement: spec.primaryElement,
    secondaryElement: spec.secondaryElement,
    maxVigor: scaledVigor,
    currentVigor: scaledVigor,
    forca: spec.baseStats.forca,
    defesa: spec.baseStats.defesa,
    velocidade: spec.baseStats.velocidade,
    tecnica: clamp(spec.baseStats.tecnica, 0, 100),
    garra: spec.baseStats.garra,
    esquiva: clamp(spec.baseStats.esquiva ?? 0, 0, 60),
    canto: 0,
    nextAttackTick: 1,
    castWindupRemainingTicks: 0,
    equippedSet: options.equippedSet,
    perkGem: options.perkGem,
    fenixUsed: false,
    reaperBlockedRevive: false,
    firstHitDone: false,
    stunImmuneTicks: 0,
    torcidaTicksRemaining: 0,
    synergyDamageVsControlledPermille: 0,
    isRaidBoss: options.isRaidBoss ?? false,
    raidDifficulty: options.raidDifficulty ?? 1,
    colossoFuriaStacks: 0,
    specialAbility: spec.specialAbility,
    activeStatuses: [],
  };
}

export function isUnitAlive(unit: CombatUnit): boolean {
  return unit.currentVigor > 0;
}
