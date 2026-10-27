import type { BrazilianStateUF } from '@beakbreaker/game-data';
import { BRAZILIAN_FEDERATION_LIST } from '@beakbreaker/game-data';
import type { InMemoryDatabase } from '../../db/schema.js';

export const SEASON_DURATION_DAYS = 28;
export const SEASON_DURATION_MS = SEASON_DURATION_DAYS * 24 * 60 * 60 * 1000;

export interface UFRankingEntry {
  rank: number;
  uf: BrazilianStateUF;
  stateName: string;
  region: string;
  totalTrophies: number;
  playerCount: number;
  weightedScore: number;
  regionalPrideMultiplier: number;
}

export interface PlayerUFRankEntry {
  rank: number;
  playerId: string;
  displayName: string;
  uf: BrazilianStateUF;
  trophies: number;
}

export interface SeasonState {
  seasonId: number;
  startsAtMs: number;
  endsAtMs: number;
  closed: boolean;
  championUF?: BrazilianStateUF;
}

export interface StateSeasonReward {
  uf: BrazilianStateUF;
  rank: number;
  goldenFeathersPerPlayer: number;
  honorMedal?: string;
}

export interface PlayerSeasonRewardGrant {
  playerId: string;
  uf: BrazilianStateUF;
  goldenFeathersGranted: number;
  honorMedalGranted?: string;
  isPodiumBonus: boolean;
}

export interface SeasonCloseResult {
  seasonId: number;
  championUF: BrazilianStateUF;
  closedAtMs: number;
  stateRewards: StateSeasonReward[];
  playerRewards: PlayerSeasonRewardGrant[];
  totalDistributedFeathers: number;
}

export class UFRankingService {
  private currentSeason: SeasonState;

  constructor(private readonly db: InMemoryDatabase, initialSeasonId = 1, startMs = Date.now()) {
    this.currentSeason = {
      seasonId: initialSeasonId,
      startsAtMs: startMs,
      endsAtMs: startMs + SEASON_DURATION_MS,
      closed: false,
    };
  }

  getCurrentSeason(): Readonly<SeasonState> { return { ...this.currentSeason }; }
  getTimeRemainingMs(nowMs = Date.now()): number { return Math.max(0, this.currentSeason.endsAtMs - nowMs); }

  getNationalUFRanking(): UFRankingEntry[] {
    const players = Array.from(this.db.players.values());
    const stats: Record<string, { totalTrophies: number; playerCount: number }> = {};
    for (const fed of BRAZILIAN_FEDERATION_LIST) stats[fed.uf] = { totalTrophies: 0, playerCount: 0 };
    for (const p of players) {
      if (stats[p.uf]) {
        stats[p.uf].totalTrophies += Math.max(0, p.trophies);
        stats[p.uf].playerCount += 1;
      }
    }

    const entries: UFRankingEntry[] = BRAZILIAN_FEDERATION_LIST.map((fed) => {
      const s = stats[fed.uf];
      return {
        rank: 0, uf: fed.uf, stateName: fed.name, region: fed.region,
        totalTrophies: s.totalTrophies, playerCount: s.playerCount,
        weightedScore: Math.floor(s.totalTrophies * fed.regionalPrideMultiplier),
        regionalPrideMultiplier: fed.regionalPrideMultiplier,
      };
    });

    entries.sort((a, b) => b.weightedScore - a.weightedScore || b.totalTrophies - a.totalTrophies || a.stateName.localeCompare(b.stateName));
    entries.forEach((e, idx) => { e.rank = idx + 1; });
    return entries;
  }

  getStatePlayerRanking(uf: BrazilianStateUF, limit = 50): PlayerUFRankEntry[] {
    const players = Array.from(this.db.players.values()).filter((p) => p.uf === uf);
    players.sort((a, b) => b.trophies - a.trophies || a.displayName.localeCompare(b.displayName));
    return players.slice(0, limit).map((p, idx) => ({
      rank: idx + 1, playerId: p.id, displayName: p.displayName, uf: p.uf, trophies: p.trophies,
    }));
  }

  closeSeason(nowMs = Date.now(), force = false): SeasonCloseResult {
    if (this.currentSeason.closed && !force) throw new Error(`Temporada #${this.currentSeason.seasonId} já foi encerrada.`);
    const nationalRanking = this.getNationalUFRanking();
    const championEntry = nationalRanking[0];
    const championUF = championEntry.uf;

    this.currentSeason.closed = true;
    this.currentSeason.championUF = championUF;

    const stateRewards: StateSeasonReward[] = [
      { uf: championUF, rank: 1, goldenFeathersPerPlayer: 500, honorMedal: `Medalha de Honra Estadual (${championEntry.stateName})` },
      ...(nationalRanking[1] ? [{ uf: nationalRanking[1].uf, rank: 2, goldenFeathersPerPlayer: 250 }] : []),
      ...(nationalRanking[2] ? [{ uf: nationalRanking[2].uf, rank: 3, goldenFeathersPerPlayer: 100 }] : []),
    ];

    const playerRewards: PlayerSeasonRewardGrant[] = [];
    let totalDistributedFeathers = 0;

    for (const reward of stateRewards) {
      const statePlayers = Array.from(this.db.players.values()).filter((p) => p.uf === reward.uf);
      statePlayers.sort((a, b) => b.trophies - a.trophies);
      statePlayers.forEach((player, idx) => {
        let feathers = reward.goldenFeathersPerPlayer;
        let isPodiumBonus = false;
        if (reward.rank === 1) {
          if (idx === 0) { feathers += 500; isPodiumBonus = true; }
          else if (idx === 1) { feathers += 300; isPodiumBonus = true; }
          else if (idx === 2) { feathers += 150; isPodiumBonus = true; }
        }
        player.goldenFeathers += feathers;
        totalDistributedFeathers += feathers;
        playerRewards.push({
          playerId: player.id, uf: player.uf, goldenFeathersGranted: feathers,
          honorMedalGranted: reward.honorMedal, isPodiumBonus,
        });
      });
    }

    return {
      seasonId: this.currentSeason.seasonId, championUF, closedAtMs: nowMs,
      stateRewards, playerRewards, totalDistributedFeathers,
    };
  }

  startNextSeason(startMs = Date.now()): SeasonState {
    this.currentSeason = {
      seasonId: this.currentSeason.seasonId + 1,
      startsAtMs: startMs, endsAtMs: startMs + SEASON_DURATION_MS, closed: false,
    };
    return this.getCurrentSeason();
  }
}
