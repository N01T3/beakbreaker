import type { TorcidaTrigger } from './BattleEngine.js';

export interface CortaCantoTrigger {
  tick: number;
  targetUnitId: string;
}

export interface CombatReplaySpec {
  version: 5;
  seed: number;
  mode: '3v3' | '1v1' | 'raid';
  climaticModifier?: string;
  teamASpecIds: [string, string, string];
  teamBSpecIds: [string, string, string];
  torcidaTriggers: TorcidaTrigger[];
  cortaCantoTriggers: CortaCantoTrigger[];
  expectedWinner: 'A' | 'B' | 'DRAW';
  expectedTicks: number;
}

export interface ReplayVerificationResult {
  verified: boolean;
  matchWinner: boolean;
  matchTicks: boolean;
}

export function encodeBase64(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64');
  }
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function decodeBase64(b64: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64, 'base64').toString('utf-8');
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export class CombatReplaySerializer {
  public static serializeToBase64(spec: CombatReplaySpec): string {
    if (spec.version !== 5) {
      throw new Error(`Unsupported replay version: ${spec.version}`);
    }
    const payload: CombatReplaySpec = {
      version: 5,
      seed: spec.seed >>> 0,
      mode: spec.mode,
      ...(spec.climaticModifier ? { climaticModifier: spec.climaticModifier } : {}),
      teamASpecIds: [spec.teamASpecIds[0], spec.teamASpecIds[1], spec.teamASpecIds[2]],
      teamBSpecIds: [spec.teamBSpecIds[0], spec.teamBSpecIds[1], spec.teamBSpecIds[2]],
      torcidaTriggers: spec.torcidaTriggers.map((t) => ({ tick: t.tick, team: t.team })),
      cortaCantoTriggers: spec.cortaCantoTriggers.map((c) => ({
        tick: c.tick,
        targetUnitId: c.targetUnitId,
      })),
      expectedWinner: spec.expectedWinner,
      expectedTicks: spec.expectedTicks,
    };
    return encodeBase64(JSON.stringify(payload));
  }

  public serializeToBase64(spec: CombatReplaySpec): string {
    return CombatReplaySerializer.serializeToBase64(spec);
  }
}
