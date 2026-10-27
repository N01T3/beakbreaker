import type { ElementType, EquipmentSetId, RoosterClass, RowPosition } from '@beakbreaker/game-data';
import { describe, expect, it } from 'vitest';
import {
  ALL_TOWER_MODIFIERS,
  ClimaticModifierSystem,
  type CombatUnit,
  mulPermille,
  normalizeModifier,
  StatusEffectManager,
} from '../src/index.js';

function createTestUnit(opts: {
  team?: 'A' | 'B';
  row?: RowPosition;
  roosterClass?: RoosterClass;
  primaryElement?: ElementType;
  secondaryElement?: ElementType;
  equippedSet?: EquipmentSetId;
  defesa?: number;
  canto?: number;
}): CombatUnit {
  return {
    id: 'u1', specId: 's1', name: 'Combatente', team: opts.team ?? 'A',
    slotIndex: 0, row: opts.row ?? 'Frente', roosterClass: opts.roosterClass ?? 'Bruiser',
    primaryElement: opts.primaryElement ?? 'Brasa', secondaryElement: opts.secondaryElement,
    maxVigor: 10000, currentVigor: 10000, forca: 1000, defesa: opts.defesa ?? 500,
    velocidade: 200, tecnica: 50, garra: 100, esquiva: 10, canto: opts.canto ?? 0,
    nextAttackTick: 1, castWindupRemainingTicks: 0, equippedSet: opts.equippedSet,
    fenixUsed: false, reaperBlockedRevive: false, firstHitDone: false,
    stunImmuneTicks: 0, torcidaTicksRemaining: 0, synergyDamageVsControlledPermille: 0,
    isRaidBoss: false, raidDifficulty: 1, colossoFuriaStacks: 0,
    specialAbility: {
      name: 'Golpe', multiplierPermille: 1500, targetScope: 'CurrentTarget', hitCount: 1,
      effectDurationTicks: 0, shieldPermille: 0, healPermille: 0, cantoBonus: 0,
      cleanseDebuffs: false, ignoreDefensePermille: 0, ignoreShield: false, description: 'D',
    },
    activeStatuses: [],
  };
}

describe('ClimaticModifierSystem - 12 Modificadores da Torre do Mandacaru', () => {
  it('validates Seca (1) healing reduction by 20%', () => {
    expect(ClimaticModifierSystem.adjustHealing(1000, 'Seca')).toBe(800);
    expect(ClimaticModifierSystem.adjustHealing(500, 'Seca')).toBe(400);
    expect(ClimaticModifierSystem.adjustHealing(1000, 'Chuva')).toBe(1000);
  });

  it('validates Chuva (2) +25% damage for Correnteza element', () => {
    const water = createTestUnit({ primaryElement: 'Correnteza' });
    const secWater = createTestUnit({ primaryElement: 'Brasa', secondaryElement: 'Correnteza' });
    const fire = createTestUnit({ primaryElement: 'Brasa' });
    const def = createTestUnit({ team: 'B' });
    expect(ClimaticModifierSystem.adjustDamage(water, def, 1000, 'Chuva')).toBe(1250);
    expect(ClimaticModifierSystem.adjustDamage(secWater, def, 1000, 'Chuva')).toBe(1250);
    expect(ClimaticModifierSystem.adjustDamage(fire, def, 1000, 'Chuva')).toBe(1000);
  });

  it('validates Noite (3) Luar bonus (+150 Canto inicial)', () => {
    const lua = createTestUnit({ primaryElement: 'Lua', canto: 50 });
    const setUnit = createTestUnit({ equippedSet: 'LuarDoSertao', canto: 0 });
    const sol = createTestUnit({ primaryElement: 'Sol', canto: 0 });
    ClimaticModifierSystem.applyInitialBuffs([lua, setUnit, sol], 'Noite');
    expect(lua.canto).toBe(200);
    expect(setUnit.canto).toBe(150);
    expect(sol.canto).toBe(0);
  });

  it('validates Ventania (4) 150 permille accuracy penalty for Atirador', () => {
    const shooter = createTestUnit({ roosterClass: 'Atirador' });
    const bruiser = createTestUnit({ roosterClass: 'Bruiser' });
    expect(ClimaticModifierSystem.getShooterAccuracyPenalty(shooter, 'Ventania')).toBe(150);
    expect(ClimaticModifierSystem.getShooterAccuracyPenalty(bruiser, 'Ventania')).toBe(0);
    expect(ClimaticModifierSystem.adjustAccuracy(shooter, 1000, 'Ventania')).toBe(850);
    expect(ClimaticModifierSystem.adjustAccuracy(bruiser, 1000, 'Ventania')).toBe(1000);
  });

  it('validates Sol a Pino (5) double burn damage', () => {
    expect(ClimaticModifierSystem.adjustBurnDamage(150, 'SolAPino')).toBe(300);
    expect(ClimaticModifierSystem.adjustBurnDamage(150, 'Sol a Pino')).toBe(300);
    expect(ClimaticModifierSystem.adjustBurnDamage(150, 'Chuva')).toBe(150);
  });

  it('validates Neblina da Serra (6) 30 ticks of Furtivo on all units', () => {
    const u1 = createTestUnit({ team: 'A' });
    const u2 = createTestUnit({ team: 'B' });
    ClimaticModifierSystem.applyInitialBuffs([u1, u2], 'NeblinaDaSerra');
    expect(StatusEffectManager.hasStatus(u1, 'Furtivo')).toBe(true);
    expect(u1.activeStatuses.find((s) => s.type === 'Furtivo')?.remainingTicks).toBe(30);
  });

  it('validates Muralha (7) +25% defense for front row units only', () => {
    const front = createTestUnit({ row: 'Frente', defesa: 400 });
    const back = createTestUnit({ row: 'Tras', defesa: 400 });
    ClimaticModifierSystem.applyInitialBuffs([front, back], 'Muralha');
    expect(front.defesa).toBe(mulPermille(400, 1250));
    expect(back.defesa).toBe(400);
  });

  it('validates Assombracao (8) +20% damage for Assassino class', () => {
    const assassin = createTestUnit({ roosterClass: 'Assassino' });
    const tank = createTestUnit({ roosterClass: 'Tanque' });
    const def = createTestUnit({ team: 'B' });
    expect(ClimaticModifierSystem.adjustDamage(assassin, def, 1000, 'Assombracao')).toBe(1200);
    expect(ClimaticModifierSystem.adjustDamage(tank, def, 1000, 'Assombração')).toBe(1000);
  });

  it('validates Furia do Coronel (9) +30% damage for Team B', () => {
    const teamA = createTestUnit({ team: 'A' });
    const teamB = createTestUnit({ team: 'B' });
    const def = createTestUnit({ team: 'A' });
    expect(ClimaticModifierSystem.adjustDamage(teamB, def, 1000, 'FuriaDoCoronel')).toBe(1300);
    expect(ClimaticModifierSystem.adjustDamage(teamA, def, 1000, 'Fúria do Coronel')).toBe(1000);
  });

  it('validates Fe na Sanfona (10) +5% Canto gain', () => {
    expect(ClimaticModifierSystem.adjustCantoGain(100, 'FeNaSanfona')).toBe(105);
    expect(ClimaticModifierSystem.adjustCantoGain(100, 'Fé na Sanfona')).toBe(105);
    expect(ClimaticModifierSystem.adjustCantoGain(100, 'Chuva')).toBe(100);
  });

  it('validates Espinheiro (11) 15% thorns reflect', () => {
    const u1 = createTestUnit({});
    ClimaticModifierSystem.applyInitialBuffs([u1], 'Espinheiro');
    expect(StatusEffectManager.hasStatus(u1, 'Espinhos')).toBe(true);
    expect(u1.activeStatuses.find((s) => s.type === 'Espinhos')?.valuePermille).toBe(150);
    expect(ClimaticModifierSystem.getThornsReflectPermille('Espinheiro')).toBe(150);
    expect(ClimaticModifierSystem.computeThornsDamage(1000, 'Espinheiro')).toBe(150);
  });

  it('validates Festa no Arraial (12) allows 2 Torcida activations', () => {
    expect(ClimaticModifierSystem.getMaxTorcidaAllowed('FestaNoArraial')).toBe(2);
    expect(ClimaticModifierSystem.getMaxTorcidaAllowed('Festa no Arraial')).toBe(2);
    expect(ClimaticModifierSystem.getMaxTorcidaAllowed('Seca')).toBe(1);
    expect(ClimaticModifierSystem.getMaxTorcidaAllowed()).toBe(1);
  });

  it('validates ALL_TOWER_MODIFIERS list and alias normalization', () => {
    expect(ALL_TOWER_MODIFIERS).toHaveLength(12);
    expect(normalizeModifier('Sol a Pino')).toBe('SolAPino');
    expect(normalizeModifier('Neblina da Serra')).toBe('NeblinaDaSerra');
    expect(normalizeModifier('Assombração')).toBe('Assombracao');
    expect(normalizeModifier('Fúria do Coronel')).toBe('FuriaDoCoronel');
    expect(normalizeModifier('Fé na Sanfona')).toBe('FeNaSanfona');
    expect(normalizeModifier('Festa no Arraial')).toBe('FestaNoArraial');
    expect(normalizeModifier(undefined)).toBeUndefined();
  });
});
