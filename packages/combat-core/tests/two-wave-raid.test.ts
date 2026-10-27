import { describe, expect, it } from 'vitest';
import {
  type CombatUnit,
  FarmDefenseSystem,
  StatusEffectManager,
  TwoWaveRaidSimulator,
  createRuralDefenseUnit,
  createRuralDefenseWave,
} from '../src/index.js';

function makeTestUnit(id: string, team: 'A' | 'B', overrides: Partial<CombatUnit> = {}): CombatUnit {
  return {
    id, specId: 'spec_' + id, name: 'Combatente ' + id, team, slotIndex: 0,
    row: 'Frente', roosterClass: 'Bruiser', primaryElement: 'Brasa',
    maxVigor: 8000, currentVigor: 8000, forca: 800, defesa: 300, velocidade: 200,
    tecnica: 20, garra: 100, esquiva: 0, canto: 0, nextAttackTick: 1,
    castWindupRemainingTicks: 0, fenixUsed: false, reaperBlockedRevive: false,
    firstHitDone: false, stunImmuneTicks: 0, torcidaTicksRemaining: 0,
    synergyDamageVsControlledPermille: 0, isRaidBoss: false, raidDifficulty: 1,
    colossoFuriaStacks: 0, activeStatuses: [],
    specialAbility: {
      name: 'Golpe', multiplierPermille: 1200, targetScope: 'CurrentTarget', hitCount: 1,
      effectDurationTicks: 0, shieldPermille: 0, healPermille: 0, cantoBonus: 0,
      cleanseDebuffs: false, ignoreDefensePermille: 0, ignoreShield: false, description: 'Ataque',
    },
    ...overrides,
  };
}

describe('FarmDefenseSystem - As 4 Defesas Rurais', () => {
  it('creates the 4 rural defenses with expected properties and passives', () => {
    const cerca = createRuralDefenseUnit('d1', 'cerca_mandacaru', 2);
    expect(cerca.roosterClass).toBe('Tanque');
    expect(cerca.row).toBe('Frente');
    const espinho = cerca.activeStatuses.find((s) => s.type === 'Espinhos');
    expect(espinho?.valuePermille).toBe(FarmDefenseSystem.THORNS_PERMILLE);
    expect(espinho?.valuePermille).toBe(250);

    const estilingue = createRuralDefenseUnit('d2', 'estilingue_sabugo', 3);
    expect(estilingue.roosterClass).toBe('Atirador');
    expect(estilingue.row).toBe('Tras');

    const espantalho = createRuralDefenseUnit('d3', 'espantalho_assombrado', 1);
    expect(espantalho.roosterClass).toBe('Controle');

    const cataVento = createRuralDefenseUnit('d4', 'cata_vento_alerta', 1);
    expect(cataVento.roosterClass).toBe('Suporte');
  });

  it('validates Cata-Vento +15% defense aura and anti-stealth enforcement', () => {
    const defenses = createRuralDefenseWave({ cataVentoAlertaLevel: 1 });
    const cerca = defenses.find((d) => d.specId === 'cerca_mandacaru')!;
    const baseDef = cerca.defesa;
    FarmDefenseSystem.applyCataVentoAura(defenses);
    expect(cerca.defesa).toBeGreaterThan(baseDef);

    const attacker = makeTestUnit('a1', 'A');
    StatusEffectManager.applyStatus(attacker, 'Furtivo', 100);
    expect(StatusEffectManager.hasStatus(attacker, 'Furtivo')).toBe(true);
    FarmDefenseSystem.enforceAntiStealth(defenses, [attacker]);
    expect(StatusEffectManager.hasStatus(attacker, 'Furtivo')).toBe(false);
  });

  it('validates Espantalho Assombrado stun trigger when breaking first third of vigor', () => {
    const espantalho = createRuralDefenseUnit('esp', 'espantalho_assombrado', 1);
    const attacker = makeTestUnit('att', 'A');
    const threshold = Math.floor((espantalho.maxVigor * 2) / 3);
    espantalho.currentVigor = threshold - 10;
    const triggered = FarmDefenseSystem.checkEspantalhoTrigger(espantalho, espantalho.maxVigor, attacker);
    expect(triggered).toBe(true);
    expect(StatusEffectManager.hasStatus(attacker, 'Atordoado')).toBe(true);
  });
});

describe('TwoWaveRaidSimulator - Saque de Fazenda em 2 Ondas', () => {
  it('executes full 2-wave raid with attacker victory, vigor carry-over, and 8h shield', () => {
    const attackers = [
      makeTestUnit('atk_1', 'A', { forca: 2000, velocidade: 300 }),
      makeTestUnit('atk_2', 'A', { forca: 2000, velocidade: 300, slotIndex: 1 }),
      makeTestUnit('atk_3', 'A', { forca: 2000, velocidade: 300, slotIndex: 2 }),
    ];
    const guardians = [
      makeTestUnit('grd_1', 'B', { maxVigor: 1500, currentVigor: 1500, forca: 50, slotIndex: 0 }),
      makeTestUnit('grd_2', 'B', { maxVigor: 1500, currentVigor: 1500, forca: 50, slotIndex: 1 }),
      makeTestUnit('grd_3', 'B', { maxVigor: 1500, currentVigor: 1500, forca: 50, slotIndex: 2 }),
    ];

    const res = TwoWaveRaidSimulator.simulate({
      seed: 42,
      attackerTeam: attackers,
      guardianTeam: guardians,
      defenseLevels: { cercaMandacaruLevel: 1, estilingueSabugoLevel: 1 },
    });

    expect(res.winner).toBe('ATTACKER');
    expect(res.wave1Result.winner).toBe('A');
    expect(res.wave2Result).toBeDefined();
    expect(res.wave2Result?.winner).toBe('A');
    expect(res.survivingAttackerUnits.length).toBeGreaterThan(0);
    expect(res.shieldDurationHours).toBe(8);
    expect(res.totalTicks).toBe(res.wave1Result.durationTicks + res.wave2Result!.durationTicks);
  });

  it('fails immediately at Wave 1 if attacker trio is eliminated by rural defenses', () => {
    const frailAttackers = [
      makeTestUnit('frail_1', 'A', { maxVigor: 100, currentVigor: 100, forca: 10 }),
    ];
    const strongGuardians = [
      makeTestUnit('grd_1', 'B', { slotIndex: 0 }),
      makeTestUnit('grd_2', 'B', { slotIndex: 1 }),
      makeTestUnit('grd_3', 'B', { slotIndex: 2 }),
    ];

    const res = TwoWaveRaidSimulator.simulate({
      seed: 12345,
      attackerTeam: frailAttackers,
      guardianTeam: strongGuardians,
      defenseLevels: { cercaMandacaruLevel: 10, estilingueSabugoLevel: 10 },
    });

    expect(res.winner).toBe('DEFENDER');
    expect(res.wave1Result.winner).toBe('B');
    expect(res.wave2Result).toBeUndefined();
    expect(res.survivingAttackerUnits).toHaveLength(0);
    expect(res.shieldDurationHours).toBe(8);
  });

  it('preserves surviving attacker vigor from Wave 1 into Wave 2', () => {
    const attackers = [
      makeTestUnit('atk_1', 'A', { maxVigor: 12000, currentVigor: 12000, forca: 1200 }),
      makeTestUnit('atk_2', 'A', { maxVigor: 12000, currentVigor: 12000, forca: 1200, slotIndex: 1 }),
    ];
    const guardians = [
      makeTestUnit('grd_1', 'B', { maxVigor: 1000, currentVigor: 1000, forca: 10, slotIndex: 0 }),
    ];

    const res = TwoWaveRaidSimulator.simulate({
      seed: 999,
      attackerTeam: attackers,
      guardianTeam: guardians,
      defenseLevels: { cercaMandacaruLevel: 1, estilingueSabugoLevel: 1 },
    });

    expect(res.wave1Result.winner).toBe('A');
    expect(res.wave2Result).toBeDefined();
    expect(res.shieldDurationHours).toBe(8);
    expect(res.wave1Result.teamARemainingVigor).toBeLessThan(24000);
  });
});
