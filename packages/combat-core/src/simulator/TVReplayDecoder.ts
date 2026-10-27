import type { RoosterSpec } from '@beakbreaker/game-data';
import { createCombatUnitFromSpec } from '../entities/CombatUnit.js';
import { BattleEngine } from './BattleEngine.js';
import {
  type CombatReplaySpec,
  type ReplayVerificationResult,
  decodeBase64,
} from './CombatReplaySerializer.js';

export class TVReplayDecoder {
  public static decodeFromBase64(b64: string): CombatReplaySpec {
    const raw = decodeBase64(b64);
    const parsed = JSON.parse(raw) as Partial<CombatReplaySpec>;
    if (parsed.version !== 5) {
      throw new Error(`Invalid replay version: ${parsed.version}`);
    }
    if (typeof parsed.seed !== 'number') {
      throw new Error('Invalid replay seed');
    }
    if (parsed.mode !== '3v3' && parsed.mode !== '1v1' && parsed.mode !== 'raid') {
      throw new Error(`Invalid replay mode: ${parsed.mode}`);
    }
    if (!Array.isArray(parsed.teamASpecIds) || parsed.teamASpecIds.length !== 3) {
      throw new Error('Invalid teamASpecIds: must contain 3 IDs');
    }
    if (!Array.isArray(parsed.teamBSpecIds) || parsed.teamBSpecIds.length !== 3) {
      throw new Error('Invalid teamBSpecIds: must contain 3 IDs');
    }
    if (!Array.isArray(parsed.torcidaTriggers)) {
      throw new Error('Invalid torcidaTriggers');
    }
    if (!Array.isArray(parsed.cortaCantoTriggers)) {
      throw new Error('Invalid cortaCantoTriggers');
    }
    if (
      parsed.expectedWinner !== 'A' &&
      parsed.expectedWinner !== 'B' &&
      parsed.expectedWinner !== 'DRAW'
    ) {
      throw new Error('Invalid expectedWinner');
    }
    if (typeof parsed.expectedTicks !== 'number') {
      throw new Error('Invalid expectedTicks');
    }

    return {
      version: 5,
      seed: parsed.seed >>> 0,
      mode: parsed.mode,
      ...(parsed.climaticModifier ? { climaticModifier: parsed.climaticModifier } : {}),
      teamASpecIds: [parsed.teamASpecIds[0]!, parsed.teamASpecIds[1]!, parsed.teamASpecIds[2]!],
      teamBSpecIds: [parsed.teamBSpecIds[0]!, parsed.teamBSpecIds[1]!, parsed.teamBSpecIds[2]!],
      torcidaTriggers: parsed.torcidaTriggers.map((t) => ({
        tick: t.tick,
        team: t.team as 'A' | 'B',
      })),
      cortaCantoTriggers: parsed.cortaCantoTriggers.map((c) => ({
        tick: c.tick,
        targetUnitId: c.targetUnitId,
      })),
      expectedWinner: parsed.expectedWinner,
      expectedTicks: parsed.expectedTicks,
    };
  }

  public decodeFromBase64(b64: string): CombatReplaySpec {
    return TVReplayDecoder.decodeFromBase64(b64);
  }

  public static verifyReplayIntegrity(
    b64: string,
    roostersSpecMap: Record<string, RoosterSpec>,
  ): ReplayVerificationResult {
    try {
      const spec = TVReplayDecoder.decodeFromBase64(b64);
      for (let i = 0; i < 3; i++) {
        const idA = spec.teamASpecIds[i];
        const idB = spec.teamBSpecIds[i];
        if (!idA || !roostersSpecMap[idA] || !idB || !roostersSpecMap[idB]) {
          return { verified: false, matchWinner: false, matchTicks: false };
        }
      }

      const teamA = spec.teamASpecIds.map((id, i) =>
        createCombatUnitFromSpec(roostersSpecMap[id]!, {
          id: `A_${i}`,
          team: 'A',
          slotIndex: i as 0 | 1 | 2,
        }),
      );

      const teamB = spec.teamBSpecIds.map((id, i) =>
        createCombatUnitFromSpec(roostersSpecMap[id]!, {
          id: `B_${i}`,
          team: 'B',
          slotIndex: i as 0 | 1 | 2,
        }),
      );

      const simMode = spec.mode === '1v1' ? '1x1' : spec.mode;
      const result = BattleEngine.simulate({
        seed: spec.seed,
        teamA,
        teamB,
        mode: simMode as any,
        towerModifier: spec.climaticModifier as any,
        torcidaTriggers: spec.torcidaTriggers,
      });

      const matchWinner = result.winner === spec.expectedWinner;
      const matchTicks = result.durationTicks === spec.expectedTicks;
      const verified = matchWinner && matchTicks;

      return { verified, matchWinner, matchTicks };
    } catch {
      return { verified: false, matchWinner: false, matchTicks: false };
    }
  }

  public verifyReplayIntegrity(
    b64: string,
    roostersSpecMap: Record<string, RoosterSpec>,
  ): ReplayVerificationResult {
    return TVReplayDecoder.verifyReplayIntegrity(b64, roostersSpecMap);
  }
}

export function verifyReplayIntegrity(
  b64: string,
  roostersSpecMap: Record<string, RoosterSpec>,
): ReplayVerificationResult {
  return TVReplayDecoder.verifyReplayIntegrity(b64, roostersSpecMap);
}
