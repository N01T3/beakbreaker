import type { FastifyInstance } from 'fastify';
import type { InMemoryDatabase, PerchState, Player, RoosterInstance } from '../db/schema.js';
import { RedlockManager } from '../locks/RedlockManager.js';

export const RARITY_BASE_CORN_PER_MIN: Record<RoosterInstance['rarity'], number> = {
  Comum: 1.5, Raro: 2.2, Épico: 3.2, Lendário: 4.8, Mítico: 6.5, Heróico: 7.0,
};

export const PERCH_TABLE: Record<number, { slots: number; cap: number; minSede: number }> = {
  1: { slots: 2, cap: 3_000, minSede: 1 },
  2: { slots: 2, cap: 5_000, minSede: 2 },
  3: { slots: 3, cap: 8_000, minSede: 3 },
  4: { slots: 3, cap: 12_000, minSede: 5 },
  5: { slots: 4, cap: 18_000, minSede: 6 },
  6: { slots: 4, cap: 26_000, minSede: 8 },
  7: { slots: 5, cap: 36_000, minSede: 10 },
  8: { slots: 5, cap: 50_000, minSede: 12 },
};

export const SEDE_UPGRADE_TABLE: Record<number, { minNc: number; cornCost: number; buildMinutes: number }> = {
  1: { minNc: 1, cornCost: 0, buildMinutes: 0 },
  2: { minNc: 2, cornCost: 2_000, buildMinutes: 1 },
  3: { minNc: 4, cornCost: 10_000, buildMinutes: 15 },
  4: { minNc: 7, cornCost: 40_000, buildMinutes: 60 },
  5: { minNc: 10, cornCost: 120_000, buildMinutes: 180 },
  6: { minNc: 14, cornCost: 350_000, buildMinutes: 360 },
  7: { minNc: 18, cornCost: 900_000, buildMinutes: 600 },
  8: { minNc: 22, cornCost: 2_000_000, buildMinutes: 960 },
  9: { minNc: 27, cornCost: 4_000_000, buildMinutes: 1440 },
  10: { minNc: 32, cornCost: 7_500_000, buildMinutes: 2160 },
  11: { minNc: 38, cornCost: 12_000_000, buildMinutes: 2880 },
  12: { minNc: 45, cornCost: 20_000_000, buildMinutes: 4320 },
};

export const PRIMORDIAL_SPECIES = [
  'Curupira', 'Boto Encantado', 'Mapinguari', 'Lobisomem do Cariri', 'Corpo-Seco', 'Pisadeira',
] as const;

export class FarmService {
  constructor(
    private readonly db: InMemoryDatabase,
    private readonly locks: RedlockManager
  ) {}

  /** Equação Oficial do Poleiro (Módulo 2.1): Milho/min = Base_rar * NG * (1 + 0.15 * Estrelas) * M_bônus */
  calculateRoosterCornPerMinute(
    rooster: RoosterInstance,
    opts: { hasTotem?: boolean; favorableDayNight?: boolean; favorableSeason?: boolean; hasFarmerCard?: boolean } = {}
  ): number {
    const base = RARITY_BASE_CORN_PER_MIN[rooster.rarity] ?? 1.5;
    const starMult = 1 + 0.15 * rooster.stars;
    let bonusMult = 1.0;
    if (opts.hasTotem) bonusMult += 0.2;
    if (opts.favorableDayNight) bonusMult += 0.1;
    if (opts.favorableSeason) bonusMult += 0.1;
    if (opts.hasFarmerCard) bonusMult += 0.2;
    return base * rooster.ng * starMult * bonusMult;
  }

  calculatePerchRatePerMin(player: Player, perch: PerchState, nowMs = Date.now()): number {
    const hasFarmerCard = player.farmerCardActiveUntil > nowMs;
    return perch.roosterIds.reduce((sum, rId) => {
      const rooster = this.db.roosters.get(rId);
      if (!rooster) return sum;
      return sum + this.calculateRoosterCornPerMinute(rooster, { hasTotem: perch.hasAdjacentTotem, hasFarmerCard });
    }, 0);
  }

  /** Colheita preguiçosa de Poleiro baseada em timestamp sob Redlock do jogador. */
  async harvestPerchLazy(playerId: string, perchId: string, nowMs = Date.now()): Promise<number> {
    return this.locks.withLock(
      RedlockManager.playerLockKey(playerId),
      () => {
        const player = this.db.players.get(playerId);
        const perch = this.db.perches.get(perchId);
        if (!player || !perch || perch.playerId !== playerId) throw new Error('PERCH_NOT_FOUND');
        const elapsedMin = Math.max(0, (nowMs - perch.lastHarvestTimestampMs) / 60_000);
        const ratePerMin = this.calculatePerchRatePerMin(player, perch, nowMs);
        const cap = PERCH_TABLE[perch.level]?.cap ?? 3_000;
        const harvested = Math.min(cap, Math.floor(elapsedMin * ratePerMin));
        player.corn += harvested;
        perch.lastHarvestTimestampMs = nowMs;
        return harvested;
      },
      10,
      nowMs
    );
  }

  /** Evolução da Sede (Níveis 1 a 12). */
  upgradeSede(playerId: string): Player {
    const player = this.db.players.get(playerId);
    if (!player) throw new Error('PLAYER_NOT_FOUND');
    const nextLevel = player.sedeLevel + 1;
    const spec = SEDE_UPGRADE_TABLE[nextLevel];
    if (!spec) throw new Error('MAX_SEDE_LEVEL_REACHED');
    if (player.accountLevel < spec.minNc) throw new Error('ACCOUNT_LEVEL_TOO_LOW');
    if (player.corn < spec.cornCost) throw new Error('INSUFFICIENT_CORN');

    player.corn -= spec.cornCost;
    player.sedeLevel = nextLevel;
    if (nextLevel >= 10 && player.lapidarySlots < 2) player.lapidarySlots = 2;
    return player;
  }

  /** Centro de Treino: 1 Milho = 1 XP até o teto NG_máx = Sede * 5 + Bônus_Despertar_Astral */
  trainRoosterWithCorn(playerId: string, roosterId: string, cornAmount: number): RoosterInstance {
    const player = this.db.players.get(playerId);
    const rooster = this.db.roosters.get(roosterId);
    if (!player || !rooster || rooster.ownerId !== playerId) throw new Error('ROOSTER_NOT_FOUND');
    if (player.corn < cornAmount || cornAmount <= 0) throw new Error('INSUFFICIENT_CORN');
    const astralBonus = Math.max(0, rooster.stars - 5) * 2;
    const maxNg = player.sedeLevel * 5 + astralBonus;
    if (rooster.ng >= maxNg) throw new Error('SEDE_NG_CAP_REACHED');
    player.corn -= cornAmount;
    rooster.xp += cornAmount;
    const levelsGained = Math.floor(rooster.xp / 1000);
    if (levelsGained > 0) {
      rooster.ng = Math.min(maxNg, rooster.ng + levelsGained);
      rooster.xp = rooster.xp % 1000;
    }
    return rooster;
  }

  /** Ativação das 4 Torres dos Santos Padroeiros (Fartura, São Jorge, Parteira, Cangaço). */
  activatePatronSaintTower(
    playerId: string,
    tower: 'Fartura' | 'SaoJorge' | 'Parteira' | 'Cangaco',
    nowMs = Date.now()
  ): { tower: string; bonusCornCredited: number; cooldownUntilMs: number } {
    const player = this.db.players.get(playerId);
    if (!player) throw new Error('PLAYER_NOT_FOUND');
    if ((player.towerCooldowns[tower] ?? 0) > nowMs) throw new Error('TOWER_ON_COOLDOWN');

    let bonusCornCredited = 0;
    if (tower === 'Fartura') {
      let totalRate = 0;
      for (const perch of this.db.perches.values()) {
        if (perch.playerId === playerId) totalRate += this.calculatePerchRatePerMin(player, perch, nowMs);
      }
      bonusCornCredited = Math.floor(totalRate * 360);
      player.corn += bonusCornCredited;
    } else if (tower === 'SaoJorge') {
      player.activeBuffs.saoJorgeForceVigorPct = nowMs + 60 * 60 * 1000;
    } else if (tower === 'Parteira') {
      player.activeBuffs.parteiraTimerReductionMinutes = 240;
    } else if (tower === 'Cangaco') {
      player.activeBuffs.cangacoDoubleMutationUntil = nowMs + 30 * 60 * 1000;
    }

    const cooldownUntilMs = nowMs + 24 * 60 * 60 * 1000;
    player.towerCooldowns[tower] = cooldownUntilMs;
    return { tower, bonusCornCredited, cooldownUntilMs };
  }

  /** Lapidário do Sertão Ancestral (NC 22): 12 joias/dia por vaga para os 6 Primordiais. */
  claimLapidaryGems(
    playerId: string,
    primordialName: (typeof PRIMORDIAL_SPECIES)[number],
    nowMs = Date.now()
  ): { gemsCrafted: number; totalForPrimordial: number } {
    const player = this.db.players.get(playerId);
    if (!player) throw new Error('PLAYER_NOT_FOUND');
    if (player.accountLevel < 22) throw new Error('SERTAO_ANCESTRAL_REQUIRES_NC_22');
    const elapsedDays = Math.max(1, Math.floor((nowMs - player.lastLapidaryClaimMs) / 86_400_000));
    const gemsCrafted = elapsedDays * 12 * player.lapidarySlots;
    player.primordialGems[primordialName] = (player.primordialGems[primordialName] ?? 0) + gemsCrafted;
    player.lastLapidaryClaimMs = nowMs;
    return { gemsCrafted, totalForPrimordial: player.primordialGems[primordialName] };
  }
}

export async function registerFarmRoutes(app: FastifyInstance, service: FarmService): Promise<void> {
  app.post('/farm/harvest', async (req) => {
    const { playerId, perchId } = req.body as { playerId: string; perchId: string };
    return { harvested: await service.harvestPerchLazy(playerId, perchId) };
  });
  app.post('/farm/upgrade-sede', async (req) => service.upgradeSede((req.body as { playerId: string }).playerId));
}
