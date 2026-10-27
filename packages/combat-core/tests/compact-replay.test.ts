import type { RoosterSpec } from '@beakbreaker/game-data';
import { describe, expect, it } from 'vitest';
import {
  BattleEngine,
  CombatReplaySerializer,
  type CombatReplaySpec,
  TVReplayDecoder,
  createCombatUnitFromSpec,
  verifyReplayIntegrity,
} from '../src/index.js';

function makeDummySpec(id: string, overrides: Partial<RoosterSpec> = {}): RoosterSpec {
  return {
    id, number: 1, name: `Atleta ${id}`, rarity: 'Comum',
    roosterClass: overrides.roosterClass ?? 'Bruiser',
    primaryElement: 'Brasa', preferredRow: overrides.preferredRow ?? 'Frente',
    traitPositive: '+Forca', traitNegative: '-Defesa',
    baseStats: {
      forca: 800, vigor: 8000, defesa: 300, velocidade: 160, tecnica: 20, garra: 120, esquiva: 0,
      ...(overrides.baseStats ?? {}),
    },
    specialAbility: {
      name: 'Golpe Especial', multiplierPermille: 1800, targetScope: 'CurrentTarget',
      hitCount: 1, effectDurationTicks: 0, shieldPermille: 0, healPermille: 0,
      cantoBonus: 0, cleanseDebuffs: false, ignoreDefensePermille: 0, ignoreShield: false,
      description: 'Especial do Sertao',
    },
    geneticPassive: { name: 'Passiva', description: 'Desc' }, source: 'Teste',
    defaultVisualDNA: {
      id: `dna_${id}`,
      parts: { tronco: 'a', cabeca: 'a', crista: 'a', asa_frente: 'a', cauda: 'a', canelas: 'a' },
    },
  };
}

describe('TV Sertao Compact Replay & Determinism Validator', () => {
  it('serializes compact replay to base64 under 1000 chars and roundtrips perfectly', () => {
    const replaySpec: CombatReplaySpec = {
      version: 5, seed: 20261027, mode: '3v3', climaticModifier: 'Seca',
      teamASpecIds: ['galo_alfa', 'galo_bravo', 'galo_corisco'],
      teamBSpecIds: ['galo_delta', 'galo_eco', 'galo_fagulha'],
      torcidaTriggers: [{ tick: 50, team: 'A' }, { tick: 120, team: 'B' }],
      cortaCantoTriggers: [{ tick: 80, targetUnitId: 'B_0' }],
      expectedWinner: 'A', expectedTicks: 432,
    };

    const b64 = CombatReplaySerializer.serializeToBase64(replaySpec);
    expect(typeof b64).toBe('string');
    expect(b64.length).toBeLessThan(1000);
    expect(Buffer.byteLength(b64, 'utf-8')).toBeLessThan(1500);

    const decoded = TVReplayDecoder.decodeFromBase64(b64);
    expect(decoded).toEqual(replaySpec);

    const specWithoutModifier: CombatReplaySpec = { ...replaySpec, climaticModifier: undefined };
    const b64NoMod = CombatReplaySerializer.serializeToBase64(specWithoutModifier);
    expect(b64NoMod.length).toBeLessThan(1000);
    const decodedNoMod = TVReplayDecoder.decodeFromBase64(b64NoMod);
    expect(decodedNoMod.climaticModifier).toBeUndefined();
    expect(decodedNoMod).toEqual(specWithoutModifier);
  });

  it('validates deterministic replay reproduction with verifyReplayIntegrity', () => {
    const specsMap: Record<string, RoosterSpec> = {
      gA0: makeDummySpec('gA0', { roosterClass: 'Tanque', preferredRow: 'Frente' }),
      gA1: makeDummySpec('gA1', { roosterClass: 'Atirador', preferredRow: 'Tras' }),
      gA2: makeDummySpec('gA2', { roosterClass: 'Suporte', preferredRow: 'Tras' }),
      gB0: makeDummySpec('gB0', { roosterClass: 'Bruiser', preferredRow: 'Frente' }),
      gB1: makeDummySpec('gB1', { roosterClass: 'Controle', preferredRow: 'Tras' }),
      gB2: makeDummySpec('gB2', { roosterClass: 'Assassino', preferredRow: 'Frente' }),
    };

    const seed = 987654;
    const teamASpecIds: [string, string, string] = ['gA0', 'gA1', 'gA2'];
    const teamBSpecIds: [string, string, string] = ['gB0', 'gB1', 'gB2'];
    const torcidaTriggers = [{ tick: 15, team: 'A' as const }];

    const liveSimA = teamASpecIds.map((id, i) =>
      createCombatUnitFromSpec(specsMap[id]!, { id: `A_${i}`, team: 'A', slotIndex: i as 0 | 1 | 2 }),
    );
    const liveSimB = teamBSpecIds.map((id, i) =>
      createCombatUnitFromSpec(specsMap[id]!, { id: `B_${i}`, team: 'B', slotIndex: i as 0 | 1 | 2 }),
    );

    const liveResult = BattleEngine.simulate({
      seed, teamA: liveSimA, teamB: liveSimB, mode: '3v3', torcidaTriggers,
    });

    const replaySpec: CombatReplaySpec = {
      version: 5, seed, mode: '3v3', teamASpecIds, teamBSpecIds, torcidaTriggers,
      cortaCantoTriggers: [{ tick: 20, targetUnitId: 'B_1' }],
      expectedWinner: liveResult.winner, expectedTicks: liveResult.durationTicks,
    };

    const b64 = CombatReplaySerializer.serializeToBase64(replaySpec);
    const check = verifyReplayIntegrity(b64, specsMap);
    expect(check.matchWinner).toBe(true);
    expect(check.matchTicks).toBe(true);
    expect(check.verified).toBe(true);
  });

  it('detects tampering and corrupted replay payloads', () => {
    const specsMap: Record<string, RoosterSpec> = {
      g1: makeDummySpec('g1'), g2: makeDummySpec('g2'), g3: makeDummySpec('g3'),
      g4: makeDummySpec('g4'), g5: makeDummySpec('g5'), g6: makeDummySpec('g6'),
    };
    const baseSpec: CombatReplaySpec = {
      version: 5, seed: 42, mode: '3v3', teamASpecIds: ['g1', 'g2', 'g3'],
      teamBSpecIds: ['g4', 'g5', 'g6'], torcidaTriggers: [], cortaCantoTriggers: [],
      expectedWinner: 'A', expectedTicks: 100,
    };

    const tamperedWinner = CombatReplaySerializer.serializeToBase64({ ...baseSpec, expectedWinner: 'B' });
    const checkTamperedWinner = verifyReplayIntegrity(tamperedWinner, specsMap);
    expect(checkTamperedWinner.matchWinner).toBe(false);
    expect(checkTamperedWinner.verified).toBe(false);

    const tamperedTicks = CombatReplaySerializer.serializeToBase64({ ...baseSpec, expectedTicks: 9999 });
    const checkTamperedTicks = verifyReplayIntegrity(tamperedTicks, specsMap);
    expect(checkTamperedTicks.matchTicks).toBe(false);
    expect(checkTamperedTicks.verified).toBe(false);

    expect(verifyReplayIntegrity('not-valid-base64-json!!!', specsMap)).toEqual({
      verified: false, matchWinner: false, matchTicks: false,
    });
    const validB64 = CombatReplaySerializer.serializeToBase64(baseSpec);
    expect(verifyReplayIntegrity(validB64, {})).toEqual({
      verified: false, matchWinner: false, matchTicks: false,
    });
  });
});
