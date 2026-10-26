import type { FastifyInstance } from 'fastify';
import type { GachaPullHistory90d, InMemoryDatabase, RoosterInstance } from '../db/schema.js';
import { RedlockManager } from '../locks/RedlockManager.js';

export const FEATHERS_PER_PULL = 160;
export const ASTRAL_STAR_ORB_COSTS: Record<number, { orbs: number; cumulativeOrbs: number; astralEssences: number }> = {
  1: { orbs: 120, cumulativeOrbs: 120, astralEssences: 0 },
  2: { orbs: 200, cumulativeOrbs: 320, astralEssences: 0 },
  3: { orbs: 320, cumulativeOrbs: 640, astralEssences: 0 },
  4: { orbs: 560, cumulativeOrbs: 1_200, astralEssences: 0 },
  5: { orbs: 800, cumulativeOrbs: 2_000, astralEssences: 0 },
  6: { orbs: 1_000, cumulativeOrbs: 3_000, astralEssences: 1 },
  7: { orbs: 1_300, cumulativeOrbs: 4_300, astralEssences: 2 },
  8: { orbs: 1_700, cumulativeOrbs: 6_000, astralEssences: 3 },
  9: { orbs: 2_200, cumulativeOrbs: 8_200, astralEssences: 4 },
  10: { orbs: 3_000, cumulativeOrbs: 11_200, astralEssences: 5 },
};

export const SANCTUARY_24_RECIPES: Record<number, [string, string, string]> = {
  1: ['#18 Trovão do Sertão', '#23 Mula sem Cabeça', '#24 Cuca do Agreste'],
  2: ['#19 Asa Branca', '#22 Saci da Ventania', '#27 Boitatá de Fogo'],
  3: ['#20 Rei do Baião', 'Híbrido sob Encomenda', 'Crista Recessiva Garantida'],
  4: ['#28 Carcará de Aço', 'Plumagem Recessiva Garantida', 'Passiva Rara Garantida'],
  5: ['#11 Galo Cangaceiro Direto', '#12 Galo Mata-Guerreiro Direto', 'Dupla Herança de Passivas'],
  6: ['#26 Sombra Armorial', 'Passiva Lendária Garantida', 'Fertilidade Renovada'],
  7: ['#25 Guardião da Mata Direto', '#21 Galo Brasa-do-Sertão Direto', 'Mutação Dobrada 10%'],
  8: ['#29 Asa Branca Celestial', 'Linhagem Pura Perfeita', 'Ovo de Festa Sazonal'],
};

export class GachaAndGeneticsService {
  constructor(
    private readonly db: InMemoryDatabase,
    private readonly locks: RedlockManager
  ) {}

  /** Equação Exata de Soft Pity (tiros 61-79: +5 p.p./tiro) e Hard Pity (tiro 80 = 100%). */
  getLegendaryProbability(pullNumber: number): number {
    if (pullNumber <= 60) return 0.02;
    if (pullNumber >= 80) return 1.0;
    return Number((0.02 + 0.05 * (pullNumber - 60)).toFixed(4));
  }

  /** Sorteio na Chocadeira com regra 50/50, gatilho da Oferta Relâmpago (tiros 58-65) e histórico de 90d. */
  async pullChocadeira(
    playerId: string,
    bannerId: string,
    featuredSpeciesId: string,
    rngRoll: number,
    fiftyFiftyRoll = 0.5,
    nowMs = Date.now()
  ): Promise<{ pull: GachaPullHistory90d; triggerFlashPityOffer: boolean; newPityCounter: number }> {
    return this.locks.withLock(
      RedlockManager.playerLockKey(playerId),
      () => {
        const player = this.db.players.get(playerId);
        if (!player) throw new Error('PLAYER_NOT_FOUND');
        if (player.goldenFeathers < FEATHERS_PER_PULL) throw new Error('INSUFFICIENT_GOLDEN_FEATHERS');

        player.goldenFeathers -= FEATHERS_PER_PULL;
        const currentPullNumber = player.pityCounter + 1;
        const prob = this.getLegendaryProbability(currentPullNumber);
        const isLegendary = rngRoll < prob || currentPullNumber >= 80;

        let obtainedRarity: RoosterInstance['rarity'] = 'Comum';
        let obtainedSpeciesId = '#1 Galo Campina';
        let wasFeaturedGuarantee = false;

        if (isLegendary) {
          obtainedRarity = 'Lendário';
          if (player.guaranteedFeaturedNext || fiftyFiftyRoll < 0.5) {
            obtainedSpeciesId = featuredSpeciesId;
            wasFeaturedGuarantee = player.guaranteedFeaturedNext;
            player.guaranteedFeaturedNext = false;
          } else {
            obtainedSpeciesId = '#19 Asa Branca';
            player.guaranteedFeaturedNext = true;
          }
          player.pityCounter = 0;
        } else {
          player.pityCounter = currentPullNumber;
          obtainedRarity = rngRoll < 0.15 ? 'Épico' : rngRoll < 0.45 ? 'Raro' : 'Comum';
          obtainedSpeciesId =
            obtainedRarity === 'Épico' ? '#11 Galo Cangaceiro' : obtainedRarity === 'Raro' ? '#5 Brisa do Rio' : '#1 Galo Campina';
        }

        const triggerFlashPityOffer =
          player.pityCounter >= 58 && player.pityCounter <= 65 && player.goldenFeathers < FEATHERS_PER_PULL;

        const pullRecord: GachaPullHistory90d = {
          pullId: `pull_${playerId}_${nowMs}_${player.pityCounter}`,
          playerId,
          bannerId,
          pityAtPull: currentPullNumber,
          probabilityDisplayed: prob,
          obtainedSpeciesId,
          obtainedRarity,
          wasFeaturedGuarantee,
          timestampMs: nowMs,
        };
        this.db.gachaHistory90d.push(pullRecord);
        return { pull: pullRecord, triggerFlashPityOffer, newPityCounter: player.pityCounter };
      },
      10,
      nowMs
    );
  }

  /** Extração de Repetidos (Módulo 3.2): 40 Orbes no NG 1 até 100 Orbes no NG 30. */
  extractOrbsFromDuplicate(ng: number): number {
    const clampedNg = Math.max(1, Math.min(30, ng));
    return 40 + Math.floor(((clampedNg - 1) / 29) * 60);
  }

  /** Empoderamento na Árvore da Vida (1★ a 10★ = 11.200 Orbes) e Happy Hour (Qua/Sex = 100% Curingas). */
  empowerRoosterStar(
    playerId: string,
    roosterId: string,
    wildOrbsToUse: number,
    isHappyHourWedOrFri: boolean
  ): RoosterInstance {
    const player = this.db.players.get(playerId);
    const rooster = this.db.roosters.get(roosterId);
    if (!player || !rooster || rooster.ownerId !== playerId) throw new Error('ROOSTER_NOT_FOUND');
    const targetStar = rooster.stars + 1;
    const spec = ASTRAL_STAR_ORB_COSTS[targetStar];
    if (!spec) throw new Error('MAX_10_STARS_REACHED');

    const maxWildAllowed = Math.floor(spec.orbs * (isHappyHourWedOrFri ? 1.0 : 0.2));
    if (wildOrbsToUse > maxWildAllowed) throw new Error('WILD_ORB_LIMIT_EXCEEDED_OUTSIDE_HAPPY_HOUR');
    const speciesOrbsNeeded = spec.orbs - wildOrbsToUse;
    if (rooster.orbs < speciesOrbsNeeded || player.wildOrbs < wildOrbsToUse) throw new Error('INSUFFICIENT_ORBS');
    if (player.astralEssences < spec.astralEssences) throw new Error('INSUFFICIENT_ASTRAL_ESSENCES');

    rooster.orbs -= speciesOrbsNeeded;
    player.wildOrbs -= wildOrbsToUse;
    player.astralEssences -= spec.astralEssences;
    rooster.stars = targetStar;
    return rooster;
  }

  craftSanctuaryRecipe(sanctuaryLevel: number, recipeIndex: 0 | 1 | 2): string {
    const list = SANCTUARY_24_RECIPES[sanctuaryLevel];
    if (!list) throw new Error('INVALID_SANCTUARY_LEVEL');
    return list[recipeIndex];
  }
}

export async function registerGachaRoutes(app: FastifyInstance, service: GachaAndGeneticsService): Promise<void> {
  app.post('/gacha/pull', async (req) => {
    const b = req.body as { playerId: string; bannerId: string; featuredSpeciesId: string; rngRoll?: number };
    return service.pullChocadeira(b.playerId, b.bannerId, b.featuredSpeciesId, b.rngRoll ?? 0.5);
  });
}
