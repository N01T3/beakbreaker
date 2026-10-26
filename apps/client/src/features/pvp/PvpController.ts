export type RankedLeagueTier =
  | 'Terreiro'
  | 'Arraial'
  | 'Comarca'
  | 'Sertao'
  | 'Cangaco'
  | 'Lenda';

export const RANKED_LEAGUE_TIERS: readonly RankedLeagueTier[] = [
  'Terreiro',
  'Arraial',
  'Comarca',
  'Sertao',
  'Cangaco',
  'Lenda',
] as const;

export interface RevengeLogEntry {
  raidId: string;
  attackerId: string;
  milhoStolen: number;
  expiresInHours: number;
  revengeClaimed: boolean;
}

export class PvpController {
  public readonly tvSertaoIntervalMinutes = 5;
  public readonly tvSertaoBolaoRewardMilho = 500;
  private rating = 1000;
  private shieldRemainingHours = 0;
  private revengeHistory: RevengeLogEntry[] = [];

  public getLeagueTier(rating = this.rating): RankedLeagueTier {
    if (rating >= 2400) return 'Lenda';
    if (rating >= 2000) return 'Cangaco';
    if (rating >= 1600) return 'Sertao';
    if (rating >= 1300) return 'Comarca';
    if (rating >= 1100) return 'Arraial';
    return 'Terreiro';
  }

  public setRating(rating: number): RankedLeagueTier {
    this.rating = Math.max(0, Math.floor(rating));
    return this.getLeagueTier(this.rating);
  }

  public isSupremo9v9Unlocked(rating = this.rating): boolean {
    return this.getLeagueTier(rating) === 'Lenda';
  }

  public resolveSupremo9v9Match(roundWinners: readonly ('A' | 'B')[]): 'A' | 'B' {
    let winsA = 0;
    let winsB = 0;
    for (const w of roundWinners.slice(0, 3)) {
      if (w === 'A') winsA += 1;
      else winsB += 1;
    }
    return winsA >= winsB ? 'A' : 'B';
  }

  public calculateTwoWaveSaqueLoot(
    defenderExcessMilho: number,
    wave1Cleared: boolean,
    wave2Cleared: boolean,
  ): { stolenMilho: number; defenderShieldHoursGranted: number } {
    const maxLootPool = Math.floor(Math.max(0, defenderExcessMilho) * 0.2);
    if (!wave1Cleared) {
      return { stolenMilho: 0, defenderShieldHoursGranted: 0 };
    }
    if (!wave2Cleared) {
      return {
        stolenMilho: Math.floor(maxLootPool * 0.4),
        defenderShieldHoursGranted: 8,
      };
    }
    this.shieldRemainingHours = 12;
    return {
      stolenMilho: maxLootPool,
      defenderShieldHoursGranted: 12,
    };
  }

  public registerIncomingSaque(raidId: string, attackerId: string, milhoStolen: number): void {
    this.revengeHistory.push({
      raidId,
      attackerId,
      milhoStolen,
      expiresInHours: 72,
      revengeClaimed: false,
    });
  }

  public executeRevenge72h(raidId: string): { ok: boolean; recoveredMilhoWithBonus: number } {
    const entry = this.revengeHistory.find((r) => r.raidId === raidId);
    if (!entry || entry.revengeClaimed || entry.expiresInHours <= 0) {
      return { ok: false, recoveredMilhoWithBonus: 0 };
    }
    entry.revengeClaimed = true;
    // Bônus oficial de +50% na Revanche dentro de 72h
    return {
      ok: true,
      recoveredMilhoWithBonus: Math.floor(entry.milhoStolen * 1.5),
    };
  }

  public resolveTvSertaoBolaoPrediction(predictedTeam: 'A' | 'B', winnerTeam: 'A' | 'B'): number {
    return predictedTeam === winnerTeam ? this.tvSertaoBolaoRewardMilho : 0;
  }
}
