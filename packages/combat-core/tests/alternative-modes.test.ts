import type { ElementType, PerkGemId, Rarity, RoosterClass, RoosterSpec, RowPosition } from '@beakbreaker/game-data';
import { describe, expect, it } from 'vitest';
import {
  ArenaNiveladaEngine,
  DueloAmistosoEngine,
  ReiDoTerreiroEngine,
  TorneioArraialEngine,
  createCombatUnitFromSpec,
  normalizeUnitToLevel30,
} from '../src/index.js';

interface MakeSpecOverrides {
  id?: string;
  number?: number;
  name?: string;
  rarity?: Rarity;
  roosterClass?: RoosterClass;
  primaryElement?: ElementType;
  preferredRow?: RowPosition;
  baseStats?: Partial<RoosterSpec['baseStats']>;
  specialAbility?: Partial<RoosterSpec['specialAbility']>;
}

function makeSpec(overrides: MakeSpecOverrides = {}): RoosterSpec {
  return {
    id: overrides.id ?? 'rooster_dummy',
    number: overrides.number ?? 1,
    name: overrides.name ?? 'Galo Teste',
    rarity: overrides.rarity ?? 'Comum',
    roosterClass: overrides.roosterClass ?? 'Bruiser',
    primaryElement: overrides.primaryElement ?? 'Brasa',
    preferredRow: overrides.preferredRow ?? 'Frente',
    traitPositive: '+Forca',
    traitNegative: '-Defesa',
    baseStats: {
      forca: 850, vigor: 10000, defesa: 300, velocidade: 180, tecnica: 20, garra: 130, esquiva: 0,
      ...(overrides.baseStats ?? {}),
    },
    specialAbility: {
      name: 'Golpe Firme', multiplierPermille: 1500, targetScope: 'CurrentTarget', hitCount: 1,
      effectDurationTicks: 0, shieldPermille: 0, healPermille: 0, cantoBonus: 0, cleanseDebuffs: false,
      ignoreDefensePermille: 0, ignoreShield: false, description: 'Golpe basico',
      ...(overrides.specialAbility ?? {}),
    },
    geneticPassive: { name: 'Passiva', description: 'Desc' },
    source: 'Teste',
    defaultVisualDNA: { id: 'dna', parts: { tronco: 'a', cabeca: 'a', crista: 'a', asa_frente: 'a', cauda: 'a', canelas: 'a' } },
  };
}

describe('Modos Alternativos de Combate', () => {
  it('Duelo Amistoso: 1x1, max 900 ticks, zero trofeus e log de golpes', () => {
    const a = createCombatUnitFromSpec(makeSpec({ id: 'atleta_a', roosterClass: 'Bruiser' }), { id: 'a1', team: 'A', slotIndex: 0 });
    const b = createCombatUnitFromSpec(makeSpec({ id: 'atleta_b', roosterClass: 'Tanque', baseStats: { vigor: 12000, forca: 400, defesa: 450, velocidade: 120, tecnica: 5, garra: 80 } }), { id: 'b1', team: 'B', slotIndex: 0 });

    const result = DueloAmistosoEngine.simulate({ seed: 42, athleteA: a, athleteB: b, maxTicks: 900 });
    expect(result.durationTicks).toBeLessThanOrEqual(900);
    expect(result.durationSeconds).toBeLessThanOrEqual(45);
    expect(result.trophiesDelta).toBe(0);
    expect(result.isFriendly).toBe(true);
    expect(['A', 'B', 'DRAW']).toContain(result.winner);
    expect(result.logDeGolpes.length).toBeGreaterThan(0);
    expect(result.logDeGolpes[0]).toHaveProperty('tick');
    expect(result.logDeGolpes[0]).toHaveProperty('type');
    expect(a.currentVigor).toBe(10000);
  });

  it('Arena Nivelada: normaliza Nv30 e anula bonus de oficina (+15)', () => {
    const perk: PerkGemId = 'Ceifador';
    const unitWithEquip = createCombatUnitFromSpec(makeSpec({ id: 'galo_oficina' }), {
      id: 'eq1', team: 'A', slotIndex: 0, equippedSet: 'ArmorialReal', perkGem: perk,
    });
    expect(unitWithEquip.equippedSet).toBe('ArmorialReal');

    const normalized = normalizeUnitToLevel30(unitWithEquip, 'A', 0);
    expect(normalized.equippedSet).toBeUndefined();
    expect(normalized.perkGem).toBeUndefined();

    const teamA = [
      createCombatUnitFromSpec(makeSpec({ id: 'u1', roosterClass: 'Bruiser' }), { id: 'u1', team: 'A', slotIndex: 0, equippedSet: 'BrasaViva' }),
      createCombatUnitFromSpec(makeSpec({ id: 'u2', roosterClass: 'Assassino' }), { id: 'u2', team: 'A', slotIndex: 1, equippedSet: 'VentoDoArraial' }),
      createCombatUnitFromSpec(makeSpec({ id: 'u3', roosterClass: 'Tanque' }), { id: 'u3', team: 'A', slotIndex: 2, equippedSet: 'Mandacaru' }),
    ];
    const teamB = [
      createCombatUnitFromSpec(makeSpec({ id: 'u4', roosterClass: 'Suporte' }), { id: 'u4', team: 'B', slotIndex: 0 }),
      createCombatUnitFromSpec(makeSpec({ id: 'u5', roosterClass: 'Atirador' }), { id: 'u5', team: 'B', slotIndex: 1 }),
      createCombatUnitFromSpec(makeSpec({ id: 'u6', roosterClass: 'Bruiser' }), { id: 'u6', team: 'B', slotIndex: 2 }),
    ];

    const res = ArenaNiveladaEngine.simulate({ seed: 777, teamA, teamB });
    expect(res.normalizedTeamA.every((u) => u.equippedSet === undefined)).toBe(true);
    expect(res.normalizedTeamB.every((u) => u.equippedSet === undefined)).toBe(true);
    expect(res.synergiesTeamA.length).toBeGreaterThan(0);
    expect(['A', 'B', 'DRAW']).toContain(res.winner);
  });

  it('Rei do Terreiro: sobrevida com +15% vigor e streak multiplicador', () => {
    const champ = [createCombatUnitFromSpec(makeSpec({ id: 'forte', baseStats: { forca: 2000, vigor: 25000, velocidade: 300, defesa: 500, tecnica: 50, garra: 200 } }), { id: 'c1', team: 'A', slotIndex: 0 })];
    const chal1 = [createCombatUnitFromSpec(makeSpec({ id: 'fraco1', baseStats: { forca: 100, vigor: 1000, defesa: 50, velocidade: 80, tecnica: 0, garra: 50 } }), { id: 'w1', team: 'B', slotIndex: 0 })];
    const chal2 = [createCombatUnitFromSpec(makeSpec({ id: 'fraco2', baseStats: { forca: 100, vigor: 1000, defesa: 50, velocidade: 80, tecnica: 0, garra: 50 } }), { id: 'w2', team: 'B', slotIndex: 0 })];

    const sim = ReiDoTerreiroEngine.simulate({ seed: 123, championTeam: champ, challengers: [chal1, chal2], reliefVigorPercent: 15 });
    expect(sim.winStreak).toBe(2);
    expect(sim.championDefendedSuccessfully).toBe(true);
    expect(sim.rewardMultiplier).toBeGreaterThan(1.0);
    expect(sim.rewards.milho).toBeGreaterThan(500);
    expect(sim.rewards.penas).toBeGreaterThan(30);
    expect(sim.rounds.length).toBe(2);
  });

  it('Rei do Terreiro: derrota interrompe a sequencia', () => {
    const champFraco = [createCombatUnitFromSpec(makeSpec({ id: 'fraco', baseStats: { forca: 50, vigor: 500, defesa: 10, velocidade: 50, tecnica: 0, garra: 10 } }), { id: 'cf', team: 'A', slotIndex: 0 })];
    const chalForte = [createCombatUnitFromSpec(makeSpec({ id: 'boss', baseStats: { forca: 2500, vigor: 20000, defesa: 500, velocidade: 250, tecnica: 50, garra: 200 } }), { id: 'bf', team: 'B', slotIndex: 0 })];

    const sim = ReiDoTerreiroEngine.simulate({ seed: 123, championTeam: champFraco, challengers: [chalForte, chalForte] });
    expect(sim.winStreak).toBe(0);
    expect(sim.championDefendedSuccessfully).toBe(false);
    expect(sim.rounds.length).toBe(1);
  });

  it('Torneio do Arraial: simula chave de 8 com quartas, semi, final e top 8', () => {
    const participants = Array.from({ length: 8 }, (_, i) => ({
      id: `p_${i + 1}`, name: `Participante ${i + 1}`,
      team: [createCombatUnitFromSpec(makeSpec({ id: `atleta_${i + 1}`, baseStats: { forca: 500 + i * 80, vigor: 8000 + i * 500, defesa: 250, velocidade: 150 + i * 10, tecnica: 15, garra: 100 } }), { id: `u_${i}`, team: 'A', slotIndex: 0 })],
    }));

    const result = TorneioArraialEngine.simulate({ seed: 999, participants });
    expect(result.campeao).toBeDefined();
    expect(result.viceCampeao).toBeDefined();
    expect(result.terceiroLugar).toBeDefined();
    expect(result.quartoLugar).toBeDefined();
    expect(result.standings).toHaveLength(8);
    expect(result.standings[0]!.posicao).toBe(1);
    expect(result.standings[0]!.premio.milho).toBe(10000);
    expect(result.standings[7]!.posicao).toBe(8);
    expect(result.standings[7]!.premio.milho).toBe(1200);
    expect(result.matches.some((m) => m.stage === 'Quartas')).toBe(true);
    expect(result.matches.some((m) => m.stage === 'Semifinal')).toBe(true);
    expect(result.matches.some((m) => m.stage === 'Final')).toBe(true);
  });

  it('Torneio do Arraial: simula chave de 16 participantes e valida erro em tamanho invalido', () => {
    const participants16 = Array.from({ length: 16 }, (_, i) => ({
      id: `p16_${i + 1}`, name: `Participante ${i + 1}`,
      team: [createCombatUnitFromSpec(makeSpec({ id: `atleta_16_${i + 1}` }), { id: `u16_${i}`, team: 'A', slotIndex: 0 })],
    }));
    const res16 = TorneioArraialEngine.simulate({ seed: 333, participants: participants16 });
    expect(res16.matches.some((m) => m.stage === 'Oitavas')).toBe(true);
    expect(res16.standings).toHaveLength(8);

    expect(() => TorneioArraialEngine.simulate({ seed: 1, participants: participants16.slice(0, 5) }))
      .toThrow('Torneio do Arraial requer 8 ou 16 participantes');
  });
});
