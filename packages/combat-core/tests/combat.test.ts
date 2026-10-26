import type { RoosterSpec } from '@beakbreaker/game-data';
import { describe, expect, it } from 'vitest';
import {
  BattleEngine,
  CantoSystem,
  DamageCalculator,
  InterruptSystem,
  RaidBossSystem,
  SeededPRNG,
  StatusEffectManager,
  SynergyResolver,
  createCombatUnitFromSpec,
} from '../src/index.js';

function makeDummySpec(overrides: Partial<RoosterSpec> = {}): RoosterSpec {
  return {
    id: overrides.id ?? 'test_rooster',
    number: overrides.number ?? 1,
    name: overrides.name ?? 'Galo Teste',
    rarity: overrides.rarity ?? 'Comum',
    roosterClass: overrides.roosterClass ?? 'Bruiser',
    primaryElement: overrides.primaryElement ?? 'Brasa',
    preferredRow: overrides.preferredRow ?? 'Frente',
    traitPositive: '+Forca',
    traitNegative: '-Defesa',
    baseStats: {
      forca: 923,
      vigor: 9000,
      defesa: 307,
      velocidade: 173,
      tecnica: 22,
      garra: 138,
      esquiva: 0,
      ...(overrides.baseStats ?? {}),
    },
    specialAbility: {
      name: 'Golpe Especial',
      multiplierPermille: 2000,
      targetScope: 'CurrentTarget',
      hitCount: 1,
      effectDurationTicks: 0,
      shieldPermille: 0,
      healPermille: 0,
      cantoBonus: 0,
      cleanseDebuffs: false,
      ignoreDefensePermille: 0,
      ignoreShield: false,
      description: 'Teste',
      ...(overrides.specialAbility ?? {}),
    },
    geneticPassive: { name: 'Passiva', description: 'Desc' },
    source: 'Teste',
    defaultVisualDNA: {
      id: 'dna_test',
      parts: { tronco: 'a', cabeca: 'a', crista: 'a', asa_frente: 'a', cauda: 'a', canelas: 'a' },
    },
  };
}

describe('@beakbreaker/combat-core', () => {
  it('validates GDD X-Ray exact Canto and Attack Interval equations & Vel > 360 overflow', () => {
    expect(CantoSystem.computeAttackIntervalTicks(173)).toBe(26);
    expect(CantoSystem.computeCantoPerHit(138, 173)).toBe(258);
    expect(CantoSystem.computeAttackIntervalTicks(360)).toBe(10);
    expect(CantoSystem.computeAttackIntervalTicks(440)).toBe(10);
    expect(CantoSystem.computeCantoPerHit(100, 400)).toBe(120 + 100 + 10);
  });

  it('validates fixed-point damage equation, class passives, BrasaViva and Ceifador vs Fenix', () => {
    const baseDmg = DamageCalculator.computeFormulaDamage(1000, 2000, 250, 1250, 1500);
    expect(baseDmg).toBe(Math.floor((1000 * 2 * 1000) / 1750 * 1.25 * 1.5));

    const shooter = createCombatUnitFromSpec(makeDummySpec({ roosterClass: 'Atirador' }), {
      id: 's1', team: 'A', slotIndex: 0,
    });
    const tank = createCombatUnitFromSpec(makeDummySpec({ roosterClass: 'Tanque', baseStats: { forca: 500, vigor: 10000, defesa: 400, velocidade: 150, tecnica: 10, garra: 100, esquiva: 0 } }), {
      id: 't1', team: 'B', slotIndex: 0,
    });
    expect(DamageCalculator.computeEffectiveDefesa(shooter, tank, false)).toBe(340);

    const assassin = createCombatUnitFromSpec(
      makeDummySpec({ roosterClass: 'Assassino', baseStats: { forca: 1200, vigor: 6000, defesa: 200, velocidade: 220, tecnica: 0, garra: 120, esquiva: 0 } }),
      { id: 'a1', team: 'A', slotIndex: 0, equippedSet: 'BrasaViva', perkGem: 'Ceifador' },
    );
    const victim = createCombatUnitFromSpec(
      makeDummySpec({ baseStats: { forca: 500, vigor: 5000, defesa: 100, velocidade: 120, tecnica: 10, garra: 100, esquiva: 0 } }),
      { id: 'v1', team: 'B', slotIndex: 0, perkGem: 'FenixSertaneja' },
    );
    victim.currentVigor = 500; // < 20% Vigor -> Ceifador active
    const hit = DamageCalculator.resolveHit(
      { attacker: assassin, defender: victim, mHabPermille: 2000, isSpecial: true },
      new SeededPRNG(42),
    );
    expect(hit.isCrit).toBe(true); // Bote first hit crit even with tecnica = 0
    expect(hit.killedTarget).toBe(true);
    expect(hit.triggeredFenixRevive).toBe(false); // Blocked by Ceifador!
  });

  it('validates Corta-Canto (6-tick windup interrupt) and 40-tick post-stun immunity + Pulso', () => {
    const caster = createCombatUnitFromSpec(makeDummySpec(), { id: 'c1', team: 'A', slotIndex: 0 });
    const ctrl = createCombatUnitFromSpec(makeDummySpec({ roosterClass: 'Controle' }), { id: 'ct1', team: 'B', slotIndex: 0 });
    caster.canto = 1000;
    expect(InterruptSystem.startSpecialWindup(caster)).toBe(true);
    expect(caster.castWindupRemainingTicks).toBe(6);
    expect(InterruptSystem.advanceWindupTick(caster)).toBe('WINDING_UP');
    expect(caster.castWindupRemainingTicks).toBe(5);

    expect(StatusEffectManager.applyStatus(caster, 'Atordoado', 30, ctrl)).toBe(true);
    expect(caster.activeStatuses[0].remainingTicks).toBe(40); // 30 + 10 from Pulso
    expect(InterruptSystem.advanceWindupTick(caster)).toBe('INTERRUPTED');
    expect(caster.canto).toBe(500);
    expect(caster.castWindupRemainingTicks).toBe(0);

    for (let t = 1; t <= 40; t++) {
      StatusEffectManager.tickUnitStatuses(caster, t);
    }
    expect(StatusEffectManager.isStunImmune(caster)).toBe(true);
    expect(caster.stunImmuneTicks).toBe(40);
    expect(StatusEffectManager.applyStatus(caster, 'Atordoado', 20, ctrl)).toBe(false);
  });

  it('validates all 7 Trio Synergies and Anti-Monoclass rule', () => {
    const mono = SynergyResolver.evaluateClasses(['Tanque', 'Tanque', 'Tanque']);
    expect(mono.isMonoclassBlocked).toBe(true);
    expect(mono.activeSynergyIds).toHaveLength(0);

    const full = SynergyResolver.evaluateClasses(['Tanque', 'Suporte', 'Controle']);
    expect(full.activeSynergyIds).toContain('muralha_viva');
    expect(full.activeSynergyIds).toContain('coro_do_arraial');
    expect(full.activeSynergyIds).toContain('bando_completo');
    expect(full.maxVigorBonusPermille).toBe(100);
    expect(full.startingCantoBonus).toBe(100);
    expect(full.allStatsBonusPermille).toBe(50);
  });

  it('validates Raid Boss Galo Colosso 10 difficulties and 3 phases', () => {
    expect(RaidBossSystem.getDifficultyMaxVigor(1)).toBe(20_000_000);
    expect(RaidBossSystem.getDifficultyMaxVigor(10)).toBe(1_370_000_000);
    const boss = RaidBossSystem.createColossoBossUnit(1);
    const foe = createCombatUnitFromSpec(makeDummySpec(), { id: 'f1', team: 'A', slotIndex: 0 });

    expect(RaidBossSystem.getPhase(boss)).toBe(1);
    const p1 = RaidBossSystem.processBossTick(boss, [foe], 200);
    expect(p1.appliedMassBurn).toBe(true);
    expect(StatusEffectManager.hasStatus(foe, 'Queimadura')).toBe(true);

    boss.currentVigor = 10_000_000; // 50% -> Phase 2
    expect(RaidBossSystem.getPhase(boss)).toBe(2);
    const refl = RaidBossSystem.reflectCritInPhase2(boss, foe, 1000, true);
    expect(refl).toBe(500);

    boss.currentVigor = 5_000_000; // 25% -> Phase 3
    expect(RaidBossSystem.getPhase(boss)).toBe(3);
    expect(StatusEffectManager.applyStatus(boss, 'Atordoado', 40, foe)).toBe(false);
    const p3 = RaidBossSystem.processBossTick(boss, [foe], 400);
    expect(p3.furiaStackAdded).toBe(true);
    expect(boss.colossoFuriaStacks).toBe(1);
  });

  it('validates 100% bit-for-bit determinism in BattleEngine', () => {
    const buildTeam = (team: 'A' | 'B') => [
      createCombatUnitFromSpec(makeDummySpec({ id: 'g1', roosterClass: 'Tanque', preferredRow: 'Frente' }), { id: `${team}_0`, team, slotIndex: 0 }),
      createCombatUnitFromSpec(makeDummySpec({ id: 'g2', roosterClass: 'Atirador', preferredRow: 'Tras' }), { id: `${team}_1`, team, slotIndex: 1 }),
      createCombatUnitFromSpec(makeDummySpec({ id: 'g3', roosterClass: 'Suporte', preferredRow: 'Tras' }), { id: `${team}_2`, team, slotIndex: 2 }),
    ];
    const r1 = BattleEngine.simulate({ seed: 123456, teamA: buildTeam('A'), teamB: buildTeam('B') });
    const r2 = BattleEngine.simulate({ seed: 123456, teamA: buildTeam('A'), teamB: buildTeam('B') });
    expect(r1.digestHash).toBe(r2.digestHash);
    expect(r1.durationTicks).toBe(r2.durationTicks);
  });
});
