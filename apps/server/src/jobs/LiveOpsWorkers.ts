import type { InMemoryDatabase } from '../db/schema.js';

export const TV_SERTAO_QUIZ_REWARD_CORN = 500;
export const RODA_DO_ARRAIAL_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours
export const HERO_RACE_POOL_REGEN_MS = 15 * 60 * 1000; // 15 min per item

export class LiveOpsWorkers {
  private lastRodaSpinByPlayer = new Map<string, number>();
  private lastTvSertaoQuizByPlayer = new Map<string, number>();

  constructor(private readonly db: InMemoryDatabase) {}

  /**
   * Bolão Cultural gratuito da TV Sertão Ao Vivo: premia 500 Milho a cada 5 minutos (zero custo).
   */
  claimTvSertaoCulturalPoll(
    playerId: string,
    predictedTeamWon: boolean,
    nowMs = Date.now()
  ): { cornAwarded: number } {
    const player = this.db.players.get(playerId);
    if (!player) throw new Error('PLAYER_NOT_FOUND');
    const lastClaim = this.lastTvSertaoQuizByPlayer.get(playerId) ?? 0;
    if (nowMs - lastClaim < 5 * 60 * 1000) {
      throw new Error('TV_SERTAO_POLL_5MIN_COOLDOWN');
    }
    this.lastTvSertaoQuizByPlayer.set(playerId, nowMs);
    const cornAwarded = predictedTeamWon ? TV_SERTAO_QUIZ_REWARD_CORN : 100;
    player.corn += cornAwarded;
    return { cornAwarded };
  }

  /**
   * Roda do Arraial: giro grátis a cada 2 horas.
   */
  spinRodaDoArraial(
    playerId: string,
    nowMs = Date.now()
  ): { rewardType: 'CORN' | 'FEATHERS' | 'WILD_ORBS'; amount: number } {
    const player = this.db.players.get(playerId);
    if (!player) throw new Error('PLAYER_NOT_FOUND');
    const lastSpin = this.lastRodaSpinByPlayer.get(playerId) ?? 0;
    if (nowMs - lastSpin < RODA_DO_ARRAIAL_COOLDOWN_MS) {
      throw new Error('RODA_2H_COOLDOWN_ACTIVE');
    }
    this.lastRodaSpinByPlayer.set(playerId, nowMs);
    player.goldenFeathers += 15;
    player.corn += 1_500;
    return { rewardType: 'FEATHERS', amount: 15 };
  }

  /**
   * Loteria Semanal da Vila (Sorteio de Domingo à noite).
   */
  runSundayWeeklyLottery(playerIds: string[]): { winners: string[]; feathersPerWinner: number } {
    const winners = playerIds.slice(0, 3);
    const feathersPerWinner = 200;
    for (const id of winners) {
      const p = this.db.players.get(id);
      if (p) {
        p.goldenFeathers += feathersPerWinner;
        p.corn += 10_000;
      }
    }
    return { winners, feathersPerWinner };
  }

  /**
   * Corrida de Heróis (18 Voltas x 5 Nós):
   * - Na Volta V (1..18), cada Nó exige N_itens = 6 + V (acumula 1.050 itens até a Volta 15).
   * - 60% (ceil) disponíveis imediatamente; 40% (floor) regeneram a 1 item a cada 15 min.
   * - Alcançar Volta 18 entrega 640 Orbes do Galo Heróico (3★).
   */
  getHeroRaceNodeRequirements(lap: number): {
    totalItemsRequired: number;
    initialPool60Pct: number;
    cooldownPool40Pct: number;
    regenIntervalMinutes: 15;
  } {
    if (lap < 1 || lap > 18) throw new Error('INVALID_HERO_RACE_LAP');
    const totalItemsRequired = 6 + lap;
    const initialPool60Pct = Math.ceil(totalItemsRequired * 0.6);
    const cooldownPool40Pct = Math.floor(totalItemsRequired * 0.4);
    return {
      totalItemsRequired,
      initialPool60Pct,
      cooldownPool40Pct,
      regenIntervalMinutes: 15,
    };
  }

  calculateCumulativeItemsToLap15(): number {
    let total = 0;
    for (let lap = 1; lap <= 15; lap++) {
      total += 5 * (6 + lap);
    }
    return total; // Exatamente 1.050 itens
  }
}
