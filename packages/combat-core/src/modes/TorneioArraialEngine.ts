import { type CombatUnit, type SlotIndex } from '../entities/CombatUnit.js';
import { SeededPRNG } from '../math/SeededPRNG.js';
import type { BattleResult } from '../simulator/BattleEngine.js';
import { BattleEngine } from '../simulator/BattleEngine.js';

export interface TorneioParticipant {
  id: string;
  name: string;
  team: CombatUnit[];
}

export interface TorneioPremio {
  milho: number;
  penasDouradas: number;
  titulo: string;
}

export interface TorneioStanding {
  posicao: number;
  participantId: string;
  participantName: string;
  premio: TorneioPremio;
  faseEliminacao: 'CAMPEAO' | 'FINAL' | 'SEMIFINAL' | 'QUARTAS' | 'OITAVAS';
  tiebreakVigor: number;
  tiebreakTicks: number;
}

export interface TorneioMatch {
  matchId: string;
  stage: 'Oitavas' | 'Quartas' | 'Semifinal' | 'Disputa3º' | 'Final';
  participantA: TorneioParticipant;
  participantB: TorneioParticipant;
  winnerId: string;
  battleResult: BattleResult;
}

export interface TorneioArraialConfig {
  seed: number;
  participants: TorneioParticipant[];
  maxTicksPerMatch?: number;
}

export interface TorneioArraialResult {
  seed: number;
  campeao: TorneioParticipant;
  viceCampeao: TorneioParticipant;
  terceiroLugar: TorneioParticipant;
  quartoLugar: TorneioParticipant;
  standings: TorneioStanding[];
  matches: TorneioMatch[];
}

export const PREMIACAO_ARRAIAL: Record<number, TorneioPremio> = {
  1: { milho: 10000, penasDouradas: 500, titulo: 'Campeão do Arraial' },
  2: { milho: 6000, penasDouradas: 300, titulo: 'Vice-Campeão do Arraial' },
  3: { milho: 4000, penasDouradas: 200, titulo: '3º Colocado do Arraial' },
  4: { milho: 2500, penasDouradas: 100, titulo: '4º Colocado do Arraial' },
  5: { milho: 1200, penasDouradas: 50, titulo: 'Top 8 do Arraial' },
  6: { milho: 1200, penasDouradas: 50, titulo: 'Top 8 do Arraial' },
  7: { milho: 1200, penasDouradas: 50, titulo: 'Top 8 do Arraial' },
  8: { milho: 1200, penasDouradas: 50, titulo: 'Top 8 do Arraial' },
};

function cloneTeam(units: CombatUnit[], side: 'A' | 'B'): CombatUnit[] {
  return units.map((u, i) => ({
    ...u, team: side, slotIndex: (i % 3) as SlotIndex,
    currentVigor: u.currentVigor > 0 ? u.currentVigor : u.maxVigor,
    canto: 0, activeStatuses: [], fenixUsed: false, reaperBlockedRevive: false,
    firstHitDone: false, stunImmuneTicks: 0, torcidaTicksRemaining: 0,
    specialAbility: { ...u.specialAbility },
  }));
}

export class TorneioArraialEngine {
  public static simulate(config: TorneioArraialConfig): TorneioArraialResult {
    const { participants, seed } = config;
    if (participants.length !== 8 && participants.length !== 16) {
      throw new Error('Torneio do Arraial requer 8 ou 16 participantes');
    }
    const prng = new SeededPRNG(seed);
    const matches: TorneioMatch[] = [];
    let matchCounter = 1;

    const playMatch = (
      pA: TorneioParticipant, pB: TorneioParticipant, stage: TorneioMatch['stage'],
    ): { winner: TorneioParticipant; loser: TorneioParticipant; loserVigor: number; loserTicks: number } => {
      const bRes = BattleEngine.simulate({
        seed: prng.nextUint32(), teamA: cloneTeam(pA.team, 'A'), teamB: cloneTeam(pB.team, 'B'),
        mode: pA.team.length === 1 ? '1x1' : '3v3', maxTicks: config.maxTicksPerMatch ?? 1800,
      });
      let aWins = bRes.winner === 'A';
      if (bRes.winner === 'DRAW') {
        aWins = bRes.teamARemainingVigor > bRes.teamBRemainingVigor ||
          (bRes.teamARemainingVigor === bRes.teamBRemainingVigor && (prng.nextUint32() & 1) === 0);
      }
      const winner = aWins ? pA : pB, loser = aWins ? pB : pA;
      const loserVigor = aWins ? bRes.teamBRemainingVigor : bRes.teamARemainingVigor;
      matches.push({ matchId: `M${matchCounter++}`, stage, participantA: pA, participantB: pB, winnerId: winner.id, battleResult: bRes });
      return { winner, loser, loserVigor, loserTicks: bRes.durationTicks };
    };

    let pool = [...participants];
    if (pool.length === 16) {
      const oWinners: TorneioParticipant[] = [];
      for (let i = 0; i < 16; i += 2) oWinners.push(playMatch(pool[i]!, pool[i + 1]!, 'Oitavas').winner);
      pool = oWinners;
    }

    const qWinners: TorneioParticipant[] = [];
    const qLosers: { p: TorneioParticipant; vigor: number; ticks: number }[] = [];
    for (let i = 0; i < 8; i += 2) {
      const res = playMatch(pool[i]!, pool[i + 1]!, 'Quartas');
      qWinners.push(res.winner);
      qLosers.push({ p: res.loser, vigor: res.loserVigor, ticks: res.loserTicks });
    }

    const semi1 = playMatch(qWinners[0]!, qWinners[1]!, 'Semifinal');
    const semi2 = playMatch(qWinners[2]!, qWinners[3]!, 'Semifinal');

    const disp3 = playMatch(semi1.loser, semi2.loser, 'Disputa3º');
    const finalM = playMatch(semi1.winner, semi2.winner, 'Final');

    qLosers.sort((a, b) => b.vigor !== a.vigor ? b.vigor - a.vigor : a.ticks - b.ticks);

    const standings: TorneioStanding[] = [
      { posicao: 1, participantId: finalM.winner.id, participantName: finalM.winner.name, premio: PREMIACAO_ARRAIAL[1]!, faseEliminacao: 'CAMPEAO', tiebreakVigor: 0, tiebreakTicks: 0 },
      { posicao: 2, participantId: finalM.loser.id, participantName: finalM.loser.name, premio: PREMIACAO_ARRAIAL[2]!, faseEliminacao: 'FINAL', tiebreakVigor: finalM.loserVigor, tiebreakTicks: finalM.loserTicks },
      { posicao: 3, participantId: disp3.winner.id, participantName: disp3.winner.name, premio: PREMIACAO_ARRAIAL[3]!, faseEliminacao: 'SEMIFINAL', tiebreakVigor: 0, tiebreakTicks: 0 },
      { posicao: 4, participantId: disp3.loser.id, participantName: disp3.loser.name, premio: PREMIACAO_ARRAIAL[4]!, faseEliminacao: 'SEMIFINAL', tiebreakVigor: disp3.loserVigor, tiebreakTicks: disp3.loserTicks },
      ...qLosers.slice(0, 4).map((ql, idx) => ({
        posicao: 5 + idx, participantId: ql.p.id, participantName: ql.p.name,
        premio: PREMIACAO_ARRAIAL[5 + idx]!, faseEliminacao: 'QUARTAS' as const, tiebreakVigor: ql.vigor, tiebreakTicks: ql.ticks,
      })),
    ];

    return {
      seed, campeao: finalM.winner, viceCampeao: finalM.loser,
      terceiroLugar: disp3.winner, quartoLugar: disp3.loser,
      standings, matches,
    };
  }
}

export const simulateTorneioArraial = TorneioArraialEngine.simulate;
